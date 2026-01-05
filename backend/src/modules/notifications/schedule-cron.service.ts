import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { LessonSchedule } from '../streams/entities/lesson-schedule.entity';
import { NotificationsService } from './notifications.service';

/**
 * Cron сервис для автоматического открытия уроков
 * и отправки уведомлений
 */
@Injectable()
export class ScheduleCronService {
  private readonly logger = new Logger(ScheduleCronService.name);

  constructor(
    @InjectRepository(LessonSchedule)
    private readonly scheduleRepository: Repository<LessonSchedule>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Проверка расписания каждую минуту
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledLessons() {
    const now = new Date();
    this.logger.log(`[CRON] Проверка расписания в ${now.toISOString()}`);
    this.logger.log(`[CRON] Текущее время UTC: ${now.toISOString()}, MSK: ${new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString()}`);

    try {
      // Сначала найдем ВСЕ нераскрытые расписания для отладки
      const allSchedules = await this.scheduleRepository.find({
        where: {
          isOpened: false,
        },
        relations: ['lesson'],
        take: 10, // Лимит для логов
      });

      this.logger.log(`[CRON] Всего нераскрытых уроков в базе: ${allSchedules.length}`);
      allSchedules.forEach(s => {
        this.logger.log(`[CRON] - Урок "${s.lesson?.title}": scheduledOpenAt = ${s.scheduledOpenAt?.toISOString()}, isOpened = ${s.isOpened}`);
      });

      // Находим уроки, которые нужно открыть
      const schedulesToOpen = await this.scheduleRepository.find({
        where: {
          scheduledOpenAt: LessThanOrEqual(now),
          isOpened: false,
        },
        relations: ['stream', 'stream.students', 'stream.creator', 'stream.course', 'lesson'],
      });

      this.logger.log(`[CRON] Найдено ${schedulesToOpen.length} schedules для открытия (scheduledOpenAt <= ${now.toISOString()})`);

      if (schedulesToOpen.length === 0) {
        return;
      }

      this.logger.log(`[CRON] Открываем ${schedulesToOpen.length} уроков...`);

    for (const schedule of schedulesToOpen) {
      try {
        // Отмечаем урок как открытый
        schedule.isOpened = true;
        await this.scheduleRepository.save(schedule);

        this.logger.log(`Урок "${schedule.lesson?.title}" открыт для потока ${schedule.streamId}`);

        // Отправляем уведомления если включены
        if (schedule.stream?.notifyOnLessonOpen && !schedule.notificationSent) {
          const students = schedule.stream.students?.filter(
            s => s.invitationStatus === 'activated' && s.paymentStatus === 'paid'
          ) || [];

          const creatorName = schedule.stream.creator?.firstName || 'Создатель';
          const lessonTitle = schedule.lesson?.title || 'Новый урок';
          const courseName = schedule.stream.course?.title || 'Проект';

          for (const student of students) {
            await this.notificationsService.sendLessonOpenedNotification(
              student,
              lessonTitle,
              creatorName,
              courseName,
            );

            // Rate limiting
            await this.delay(100);
          }

          // Отмечаем что уведомления отправлены
          schedule.notificationSent = true;
          await this.scheduleRepository.save(schedule);

          this.logger.log(`Отправлено ${students.length} уведомлений для урока "${lessonTitle}"`);
        }

      } catch (error) {
        this.logger.error(`[CRON] Ошибка открытия урока ${schedule.id}: ${error.message}`);
      }
    }
    } catch (error) {
      this.logger.error(`[CRON] Критическая ошибка в handleScheduledLessons: ${error.message}`, error.stack);
    }
  }

  /**
   * Задержка для rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}



