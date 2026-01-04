import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { Stream } from '../streams/entities/stream.entity';
import { StreamStudent } from '../streams/entities/stream-student.entity';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';
import { SendBroadcastDto } from './dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
    @InjectRepository(StreamStudent)
    private readonly studentRepository: Repository<StreamStudent>,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  /**
   * Создать уведомление
   */
  async create(
    studentId: string,
    type: string,
    title: string,
    message: string,
    streamId?: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      studentId,
      streamId,
      type,
      title,
      message,
      status: 'pending',
    });

    return this.notificationRepository.save(notification);
  }

  /**
   * Отправить уведомление
   */
  async send(notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
      relations: ['student'],
    });

    if (!notification) {
      throw new NotFoundException('Уведомление не найдено');
    }

    try {
      // Отправляем в Telegram
      await this.telegramBotService.sendMessage(
        notification.student.telegramId,
        `<b>${notification.title}</b>\n\n${notification.message}`,
      );

      notification.status = 'sent';
      notification.sentAt = new Date();

    } catch (error) {
      this.logger.error(`Ошибка отправки уведомления ${notificationId}: ${error.message}`);
      notification.status = 'failed';
      notification.errorMessage = error.message;
    }

    return this.notificationRepository.save(notification);
  }

  /**
   * Отправить broadcast рассылку
   */
  async sendBroadcast(
    creatorId: string,
    dto: SendBroadcastDto,
  ): Promise<{ sent: number; failed: number }> {
    // Проверяем права
    const stream = await this.streamRepository.findOne({
      where: { id: dto.streamId },
      relations: ['students', 'creator', 'course'],
    });

    if (!stream || stream.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа к этому потоку');
    }

    const courseName = stream.course?.title || 'Проект';

    // Фильтруем учеников
    let students = stream.students || [];

    if (dto.paymentFilter === 'paid') {
      students = students.filter(s => s.paymentStatus === 'paid');
    } else if (dto.paymentFilter === 'unpaid') {
      students = students.filter(s => s.paymentStatus === 'unpaid');
    }

    if (dto.activationFilter === 'activated') {
      students = students.filter(s => s.invitationStatus === 'activated');
    } else if (dto.activationFilter === 'invited') {
      students = students.filter(s => s.invitationStatus === 'invited');
    }

    let sent = 0;
    let failed = 0;

    for (const student of students) {
      try {
        // Создаём уведомление
        const notification = await this.create(
          student.id,
          'broadcast',
          'Сообщение от создателя',
          dto.message,
          dto.streamId,
        );

        // Отправляем
        await this.telegramBotService.sendBroadcastMessage(
          student.telegramId,
          stream.creator?.firstName || 'Создатель',
          courseName,
          dto.message,
          student.accessToken,
        );

        notification.status = 'sent';
        notification.sentAt = new Date();
        await this.notificationRepository.save(notification);

        sent++;

        // Пауза между сообщениями (rate limiting)
        await this.delay(100);

      } catch (error) {
        this.logger.error(`Ошибка отправки broadcast для ${student.id}: ${error.message}`);
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * Отправить уведомление об открытии материала
   */
  async sendLessonOpenedNotification(
    student: StreamStudent,
    lessonTitle: string,
    creatorName: string,
    courseName: string,
  ): Promise<void> {
    try {
      const notification = await this.create(
        student.id,
        'lesson_opened',
        '📚 Новый материал доступен!',
        `Материал "${lessonTitle}" теперь открыт для просмотра.`,
        student.streamId,
      );

      await this.telegramBotService.sendLessonNotification(
        student.telegramId,
        creatorName,
        courseName,
        lessonTitle,
        student.accessToken,
      );

      notification.status = 'sent';
      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);

    } catch (error) {
      this.logger.error(`Ошибка уведомления о материале: ${error.message}`);
    }
  }

  /**
   * Уведомление об открытии всех материалов сразу
   */
  async sendAllLessonsOpenedNotification(
    student: StreamStudent,
    courseName: string,
  ): Promise<void> {
    try {
      const notification = await this.create(
        student.id,
        'all_lessons_opened',
        '🎉 Все материалы доступны!',
        `Все материалы проекта "${courseName}" теперь открыты для просмотра.`,
        student.streamId,
      );

      await this.telegramBotService.sendMessageWithWebApp(
        student.telegramId,
        `📚 <b>Все материалы проекта "${courseName}" теперь доступны!</b>\n\nПереходите в проект и приступайте к изучению.`,
        `Открыть "${courseName}"`,
        student.accessToken,
      );

      notification.status = 'sent';
      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);

    } catch (error) {
      this.logger.error(`Ошибка уведомления о массовом открытии: ${error.message}`);
    }
  }

  /**
   * Отправить приветственное сообщение
   */
  async sendWelcomeNotification(
    student: StreamStudent,
    creatorName: string,
    courseName: string,
  ): Promise<void> {
    try {
      const notification = await this.create(
        student.id,
        'welcome',
        '🎓 Добро пожаловать!',
        `Вы успешно присоединились к проекту "${courseName}".`,
        student.streamId,
      );

      await this.telegramBotService.sendWelcomeMessage(
        student.telegramId,
        creatorName,
        courseName,
        student.accessToken,
      );

      notification.status = 'sent';
      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);

    } catch (error) {
      this.logger.error(`Ошибка welcome уведомления: ${error.message}`);
    }
  }

  /**
   * Получить уведомления потока
   */
  async findByStream(streamId: string, creatorId: string): Promise<Notification[]> {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId },
    });

    if (!stream || stream.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа');
    }

    return this.notificationRepository.find({
      where: { streamId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /**
   * Задержка для rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}



