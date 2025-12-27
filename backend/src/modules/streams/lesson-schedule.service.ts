import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { LessonSchedule } from './entities/lesson-schedule.entity';
import { Stream } from './entities/stream.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { CreateScheduleDto, UpdateLessonScheduleDto, LessonScheduleItemDto } from './dto';

@Injectable()
export class LessonScheduleService {
  constructor(
    @InjectRepository(LessonSchedule)
    private readonly scheduleRepository: Repository<LessonSchedule>,
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
  ) {}

  /**
   * Проверить, что поток принадлежит создателю
   */
  private async checkStreamOwnership(streamId: string, creatorId: string): Promise<Stream> {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId },
      relations: ['course'],
    });

    if (!stream) {
      throw new NotFoundException('Поток не найден');
    }

    if (stream.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа к этому потоку');
    }

    return stream;
  }

  /**
   * Создать расписание для потока
   */
  async createSchedule(streamId: string, creatorId: string, dto: CreateScheduleDto): Promise<LessonSchedule[]> {
    const stream = await this.checkStreamOwnership(streamId, creatorId);

    // Проверяем, что все уроки принадлежат курсу потока
    const lessonIds = dto.schedules.map(s => s.lessonId);
    const lessons = await this.lessonRepository.find({
      where: { id: In(lessonIds) },
      relations: ['block', 'block.course'],
    });

    for (const schedule of dto.schedules) {
      const lesson = lessons.find(l => l.id === schedule.lessonId);
      if (!lesson) {
        throw new NotFoundException(`Урок ${schedule.lessonId} не найден`);
      }
      if (lesson.block.course.id !== stream.courseId) {
        throw new BadRequestException(`Урок ${schedule.lessonId} не принадлежит курсу потока`);
      }
    }

    // Удаляем существующее расписание
    await this.scheduleRepository.delete({ streamId });

    // Создаём новое расписание
    const schedules = dto.schedules.map(item => 
      this.scheduleRepository.create({
        streamId,
        lessonId: item.lessonId,
        scheduledOpenAt: new Date(item.scheduledOpenAt),
        isOpened: false,
        notificationSent: false,
      })
    );

    return this.scheduleRepository.save(schedules);
  }

  /**
   * Получить расписание потока
   */
  async findByStream(streamId: string, creatorId: string): Promise<LessonSchedule[]> {
    await this.checkStreamOwnership(streamId, creatorId);

    return this.scheduleRepository.find({
      where: { streamId },
      relations: ['lesson'],
      order: { scheduledOpenAt: 'ASC' },
    });
  }

  /**
   * Обновить расписание урока
   */
  async updateSchedule(
    scheduleId: string,
    creatorId: string,
    dto: UpdateLessonScheduleDto,
  ): Promise<LessonSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['stream'],
    });

    if (!schedule) {
      throw new NotFoundException('Расписание не найдено');
    }

    await this.checkStreamOwnership(schedule.streamId, creatorId);

    if (dto.scheduledOpenAt) {
      schedule.scheduledOpenAt = new Date(dto.scheduledOpenAt);
    }

    return this.scheduleRepository.save(schedule);
  }

  /**
   * Удалить расписание урока
   */
  async removeSchedule(scheduleId: string, creatorId: string): Promise<void> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['stream'],
    });

    if (!schedule) {
      throw new NotFoundException('Расписание не найдено');
    }

    await this.checkStreamOwnership(schedule.streamId, creatorId);
    await this.scheduleRepository.remove(schedule);
  }

  /**
   * Получить уроки, которые нужно открыть (для cron)
   */
  async getScheduledToOpen(): Promise<LessonSchedule[]> {
    const now = new Date();

    return this.scheduleRepository.find({
      where: {
        scheduledOpenAt: LessThanOrEqual(now),
        isOpened: false,
      },
      relations: ['stream', 'stream.students', 'lesson'],
    });
  }

  /**
   * Отметить урок как открытый
   */
  async markAsOpened(scheduleId: string): Promise<LessonSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Расписание не найдено');
    }

    schedule.isOpened = true;
    return this.scheduleRepository.save(schedule);
  }

  /**
   * Отметить, что уведомление отправлено
   */
  async markNotificationSent(scheduleId: string): Promise<LessonSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Расписание не найдено');
    }

    schedule.notificationSent = true;
    return this.scheduleRepository.save(schedule);
  }

  /**
   * Автоматическое создание расписания на основе интервала
   * @param streamId - ID потока
   * @param creatorId - ID создателя
   * @param startDate - Дата начала
   * @param intervalDays - Интервал между уроками (дни)
   */
  async generateAutoSchedule(
    streamId: string,
    creatorId: string,
    startDate: Date,
    intervalDays: number = 1,
  ): Promise<LessonSchedule[]> {
    const stream = await this.checkStreamOwnership(streamId, creatorId);

    // Получаем все уроки курса в правильном порядке
    const lessons = await this.lessonRepository.find({
      where: {
        block: {
          courseId: stream.courseId,
        },
      },
      relations: ['block'],
      order: {
        block: { displayOrder: 'ASC' },
        displayOrder: 'ASC',
      },
    });

    if (lessons.length === 0) {
      throw new BadRequestException('В курсе нет уроков');
    }

    // Сортируем уроки по блокам и порядку
    lessons.sort((a, b) => {
      if (a.block.displayOrder !== b.block.displayOrder) {
        return a.block.displayOrder - b.block.displayOrder;
      }
      return a.displayOrder - b.displayOrder;
    });

    // Создаём расписание
    const scheduleItems: LessonScheduleItemDto[] = lessons.map((lesson, index) => {
      const openDate = new Date(startDate);
      openDate.setDate(openDate.getDate() + index * intervalDays);

      return {
        lessonId: lesson.id,
        scheduledOpenAt: openDate.toISOString(),
      };
    });

    return this.createSchedule(streamId, creatorId, { schedules: scheduleItems });
  }

  /**
   * Проверить, открыт ли урок для ученика
   */
  async isLessonOpenForStudent(
    lessonId: string,
    streamId: string,
  ): Promise<boolean> {
    const schedule = await this.scheduleRepository.findOne({
      where: { lessonId, streamId },
    });

    // Если расписания нет — урок открыт по умолчанию
    if (!schedule) {
      return true;
    }

    // Если расписание есть — проверяем, открыт ли
    return schedule.isOpened || schedule.scheduledOpenAt <= new Date();
  }
}



