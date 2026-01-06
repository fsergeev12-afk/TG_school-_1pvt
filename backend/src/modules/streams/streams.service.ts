import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Stream } from './entities/stream.entity';
import { LessonSchedule } from './entities/lesson-schedule.entity';
import { StreamStudent } from './entities/stream-student.entity';
import { Course } from '../courses/entities/course.entity';
import { CreateStreamDto, UpdateStreamDto } from './dto';
import { NotificationsService } from '../notifications/notifications.service';

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
    @InjectRepository(StreamStudent)
    private readonly streamStudentRepository: Repository<StreamStudent>,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
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
   * Получить статистику потока (оптимизировано через SQL агрегацию)
   */
  async getStats(id: string, creatorId: string): Promise<{
    totalStudents: number;
    activatedStudents: number;
    paidStudents: number;
    revenue: number;
  }> {
    // Проверяем доступ (без загрузки students)
    const stream = await this.streamRepository.findOne({
      where: { id, creatorId },
    });

    if (!stream) {
      throw new NotFoundException('Поток не найден');
    }

    // SQL агрегация вместо загрузки всех студентов
    const result = await this.streamStudentRepository
      .createQueryBuilder('student')
      .select('COUNT(*)', 'totalStudents')
      .addSelect(
        `COUNT(CASE WHEN student.invitationStatus = 'activated' THEN 1 END)`,
        'activatedStudents'
      )
      .addSelect(
        `COUNT(CASE WHEN student.paymentStatus = 'paid' THEN 1 END)`,
        'paidStudents'
      )
      .where('student.streamId = :streamId', { streamId: id })
      .getRawOne();

    const totalStudents = parseInt(result.totalStudents) || 0;
    const activatedStudents = parseInt(result.activatedStudents) || 0;
    const paidStudents = parseInt(result.paidStudents) || 0;
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

  /**
   * Открыть все уроки потока сразу (отменить расписание)
   */
  async openAllLessons(streamId: string, creatorId: string): Promise<{ success: boolean; openedCount: number }> {
    const stream = await this.findOneByCreator(streamId, creatorId);

    // Получаем все schedules для потока
    const schedules = await this.lessonScheduleRepository.find({
      where: { streamId },
      relations: ['lesson'],
    });

    if (schedules.length === 0) {
      throw new BadRequestException('Нет запланированных уроков для открытия');
    }

    // Подсчитываем сколько уроков ещё не открыты
    const closedLessonsCount = schedules.filter(s => !s.isOpened).length;

    if (closedLessonsCount === 0) {
      throw new BadRequestException('Все уроки уже открыты');
    }

    // Открываем все уроки
    for (const schedule of schedules) {
      if (!schedule.isOpened) {
        schedule.isOpened = true;
        await this.lessonScheduleRepository.save(schedule);
      }
    }

    this.logger.log(`Открыто ${closedLessonsCount} уроков для потока ${streamId}`);

    // Отправляем ОДНО уведомление всем студентам
    const students = await this.streamStudentRepository.find({
      where: {
        streamId,
        invitationStatus: 'activated',
        paymentStatus: 'paid',
      },
    });

    if (students.length > 0 && stream.notifyOnLessonOpen) {
      const course = await this.courseRepository.findOne({ where: { id: stream.courseId } });
      const courseName = course?.title || 'Проект';

      for (const student of students) {
        try {
          await this.notificationsService.sendAllLessonsOpenedNotification(
            student,
            courseName,
          );
          await this.delay(100); // Rate limiting
        } catch (error) {
          this.logger.error(`Ошибка отправки уведомления студенту ${student.id}: ${error.message}`);
        }
      }

      this.logger.log(`Отправлено ${students.length} уведомлений о массовом открытии`);
    }

    return {
      success: true,
      openedCount: closedLessonsCount,
    };
  }

  /**
   * Задержка для rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

