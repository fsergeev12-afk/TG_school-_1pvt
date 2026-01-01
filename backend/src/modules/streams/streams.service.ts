import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Stream } from './entities/stream.entity';
import { LessonSchedule } from './entities/lesson-schedule.entity';
import { Course } from '../courses/entities/course.entity';
import { CreateStreamDto, UpdateStreamDto } from './dto';

@Injectable()
export class StreamsService {
  private readonly logger = new Logger(StreamsService.name);

  constructor(
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(LessonSchedule)
    private readonly lessonScheduleRepository: Repository<LessonSchedule>,
  ) {}

  /**
   * Проверить, что курс принадлежит создателю
   */
  private async checkCourseOwnership(courseId: string, creatorId: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Курс не найден');
    }

    if (course.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа к этому курсу');
    }

    return course;
  }

  /**
   * Создать новый поток
   */
  async create(creatorId: string, dto: CreateStreamDto): Promise<Stream> {
    // Проверяем владение курсом
    await this.checkCourseOwnership(dto.courseId, creatorId);

    // Извлекаем lessonSchedules из dto
    const { lessonSchedules, ...streamData } = dto;

    const stream = this.streamRepository.create({
      ...streamData,
      creatorId,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      inviteToken: uuidv4(), // Генерируем уникальный токен приглашения
    });

    const savedStream = await this.streamRepository.save(stream);

    // Создаём расписание уроков если включено и есть данные
    if (dto.scheduleEnabled && lessonSchedules && lessonSchedules.length > 0) {
      this.logger.log(`Создаём расписание для ${lessonSchedules.length} уроков`);
      
      const scheduleEntities = lessonSchedules.map(schedule => 
        this.lessonScheduleRepository.create({
          streamId: savedStream.id,
          lessonId: schedule.lessonId,
          scheduledOpenAt: new Date(schedule.scheduledOpenAt),
        })
      );

      await this.lessonScheduleRepository.save(scheduleEntities);
      this.logger.log(`Расписание сохранено для потока ${savedStream.id}`);
    }

    return savedStream;
  }

  /**
   * Получить все потоки создателя
   */
  async findAllByCreator(creatorId: string): Promise<Stream[]> {
    return this.streamRepository.find({
      where: { creatorId },
      relations: ['course', 'students'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Получить потоки курса
   */
  async findByCourse(courseId: string, creatorId: string): Promise<Stream[]> {
    await this.checkCourseOwnership(courseId, creatorId);

    return this.streamRepository.find({
      where: { courseId },
      relations: ['students'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Получить поток по ID
   */
  async findOne(id: string): Promise<Stream> {
    const stream = await this.streamRepository.findOne({
      where: { id },
      relations: ['course', 'students', 'schedules', 'schedules.lesson'],
    });

    if (!stream) {
      throw new NotFoundException('Поток не найден');
    }

    return stream;
  }

  /**
   * Получить поток по ID с проверкой владельца
   */
  async findOneByCreator(id: string, creatorId: string): Promise<Stream> {
    const stream = await this.findOne(id);

    if (stream.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа к этому потоку');
    }

    return stream;
  }

  /**
   * Обновить поток
   */
  async update(id: string, creatorId: string, dto: UpdateStreamDto): Promise<Stream> {
    const stream = await this.findOneByCreator(id, creatorId);

    // Обновляем поля (исключаем startsAt из spread чтобы обработать отдельно)
    const { startsAt, ...rest } = dto;
    
    Object.assign(stream, rest);
    
    if (startsAt) {
      stream.startsAt = new Date(startsAt);
    }

    return this.streamRepository.save(stream);
  }

  /**
   * Удалить поток
   */
  async remove(id: string, creatorId: string): Promise<void> {
    const stream = await this.findOneByCreator(id, creatorId);
    await this.streamRepository.remove(stream);
  }

  /**
   * Получить статистику потока
   */
  async getStats(id: string, creatorId: string): Promise<{
    totalStudents: number;
    activatedStudents: number;
    paidStudents: number;
    revenue: number;
  }> {
    const stream = await this.findOneByCreator(id, creatorId);

    const students = stream.students || [];

    const totalStudents = students.length;
    const activatedStudents = students.filter(s => s.invitationStatus === 'activated').length;
    const paidStudents = students.filter(s => s.paymentStatus === 'paid').length;
    const revenue = paidStudents * (stream.price || 0);

    return {
      totalStudents,
      activatedStudents,
      paidStudents,
      revenue,
    };
  }

  /**
   * Клонировать поток (для нового набора)
   */
  async clone(id: string, creatorId: string, newName?: string): Promise<Stream> {
    const originalStream = await this.findOneByCreator(id, creatorId);

    const clonedStream = this.streamRepository.create({
      name: newName || `${originalStream.name} (копия)`,
      description: originalStream.description,
      courseId: originalStream.courseId,
      creatorId: originalStream.creatorId,
      price: originalStream.price,
      scheduleEnabled: originalStream.scheduleEnabled,
      sendWelcome: originalStream.sendWelcome,
      notifyOnLessonOpen: originalStream.notifyOnLessonOpen,
      isActive: false, // Новый поток неактивен по умолчанию
      inviteToken: uuidv4(), // Новый токен для клона
    });

    return this.streamRepository.save(clonedStream);
  }
}

