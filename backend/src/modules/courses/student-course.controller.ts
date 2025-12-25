import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { StreamStudent } from '../streams/entities/stream-student.entity';
import { Course } from './entities/course.entity';
import { Lesson } from './entities/lesson.entity';
import { LessonSchedule } from '../streams/entities/lesson-schedule.entity';

/**
 * Контроллер для доступа студентов к курсам
 * GET /api/student/course - получить свой курс
 * GET /api/student/lessons/:id - получить урок
 */
@Controller('student')
@UseGuards(TelegramAuthGuard)
export class StudentCourseController {
  constructor(
    @InjectRepository(StreamStudent)
    private readonly studentRepository: Repository<StreamStudent>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(LessonSchedule)
    private readonly scheduleRepository: Repository<LessonSchedule>,
  ) {}

  /**
   * Получить курс студента
   * GET /api/student/course
   */
  @Get('course')
  async getMyCourse(@CurrentUser() user: User) {
    // Найти активную подписку студента
    const student = await this.studentRepository.findOne({
      where: { 
        userId: user.id,
        invitationStatus: 'activated',
      },
      relations: ['stream', 'stream.course', 'stream.course.creator'],
      order: { activatedAt: 'DESC' },
    });

    if (!student) {
      throw new NotFoundException('Вы не записаны ни на один курс');
    }

    const stream = student.stream;
    const course = stream?.course;

    if (!course) {
      throw new NotFoundException('Курс не найден');
    }

    // Проверка оплаты (если курс платный)
    const requiresPayment = (stream.price || 0) > 0;
    const isPaid = student.paymentStatus === 'paid';

    if (requiresPayment && !isPaid) {
      // Возвращаем ограниченную информацию для неоплаченного курса
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        coverImageUrl: course.coverImageUrl,
        creatorName: course.creator?.firstName || 'Автор',
        streamId: stream.id,
        streamName: stream.name,
        price: stream.price,
        requiresPayment: true,
        isPaid: false,
        blocks: [], // Не показываем содержимое
      };
    }

    // Получить полную структуру курса с блоками и уроками
    const fullCourse = await this.courseRepository.findOne({
      where: { id: course.id },
      relations: ['blocks', 'blocks.lessons', 'creator'],
    });

    if (!fullCourse) {
      throw new NotFoundException('Курс не найден');
    }

    // Получить расписание уроков для этого потока
    const schedules = await this.scheduleRepository.find({
      where: { streamId: stream.id },
    });

    const schedulesMap = new Map(schedules.map(s => [s.lessonId, s]));
    const now = new Date();

    // Сортировка блоков и уроков
    const sortedBlocks = [...fullCourse.blocks].sort((a, b) => a.order - b.order);

    // Формируем ответ с информацией о доступности уроков
    const blocksWithAvailability = sortedBlocks.map(block => {
      const sortedLessons = [...(block.lessons || [])].sort((a, b) => a.order - b.order);
      
      return {
        id: block.id,
        title: block.title,
        order: block.order,
        lessons: sortedLessons.map(lesson => {
          const schedule = schedulesMap.get(lesson.id);
          let available = true;
          let scheduledAt: string | null = null;

          if (schedule && schedule.scheduledOpenAt) {
            const openDate = new Date(schedule.scheduledOpenAt);
            available = now >= openDate;
            if (!available) {
              scheduledAt = this.formatDate(openDate);
            }
          }

          return {
            id: lesson.id,
            title: lesson.title,
            description: available ? lesson.description : null,
            videoType: available ? lesson.videoType : null,
            available,
            scheduledAt,
          };
        }),
      };
    });

    // Подсчёт статистики
    const totalLessons = blocksWithAvailability.reduce(
      (sum, block) => sum + block.lessons.length, 
      0
    );
    const availableLessons = blocksWithAvailability.reduce(
      (sum, block) => sum + block.lessons.filter(l => l.available).length, 
      0
    );

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      coverImageUrl: course.coverImageUrl,
      creatorName: fullCourse.creator?.firstName || 'Автор',
      streamId: stream.id,
      streamName: stream.name,
      price: stream.price,
      requiresPayment,
      isPaid: true,
      totalLessons,
      availableLessons,
      allAvailable: totalLessons === availableLessons,
      blocks: blocksWithAvailability,
    };
  }

  /**
   * Получить урок студента
   * GET /api/student/lessons/:id
   */
  @Get('lessons/:id')
  async getLesson(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) lessonId: string,
  ) {
    // Проверить, что студент имеет доступ к этому уроку
    const student = await this.studentRepository.findOne({
      where: { 
        userId: user.id,
        invitationStatus: 'activated',
      },
      relations: ['stream'],
    });

    if (!student) {
      throw new NotFoundException('Вы не записаны ни на один курс');
    }

    // Проверка оплаты
    const stream = student.stream;
    const requiresPayment = (stream?.price || 0) > 0;
    const isPaid = student.paymentStatus === 'paid';

    if (requiresPayment && !isPaid) {
      throw new ForbiddenException('Необходимо оплатить курс');
    }

    // Получить урок с материалами
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['block', 'block.course', 'materials'],
    });

    if (!lesson) {
      throw new NotFoundException('Урок не найден');
    }

    // Проверить, что урок принадлежит курсу студента
    const course = lesson.block?.course;
    if (!course || course.id !== stream?.courseId) {
      throw new ForbiddenException('Нет доступа к этому уроку');
    }

    // Проверить расписание
    const schedule = await this.scheduleRepository.findOne({
      where: { 
        streamId: stream.id,
        lessonId: lesson.id,
      },
    });

    if (schedule && schedule.scheduledOpenAt) {
      const now = new Date();
      const openDate = new Date(schedule.scheduledOpenAt);
      if (now < openDate) {
        throw new ForbiddenException(`Урок откроется ${this.formatDate(openDate)}`);
      }
    }

    // Найти соседние уроки для навигации
    const allLessons = await this.lessonRepository.find({
      where: { block: { course: { id: course.id } } },
      relations: ['block'],
      order: { block: { order: 'ASC' }, order: 'ASC' },
    });

    const currentIndex = allLessons.findIndex(l => l.id === lesson.id);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      videoType: lesson.videoType,
      videoExternalUrl: lesson.videoExternalUrl,
      videoTelegramFileId: lesson.videoTelegramFileId,
      materials: (lesson.materials || []).map(m => ({
        id: m.id,
        fileName: m.fileName,
        fileType: m.fileType,
        fileSizeBytes: m.fileSizeBytes,
        telegramFileId: m.telegramFileId,
      })),
      prevLessonId: prevLesson?.id || null,
      nextLessonId: nextLesson?.id || null,
    };
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

