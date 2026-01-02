import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { UsersService } from '../users/users.service';
import { ChatsService } from '../chats/chats.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StreamStudent } from '../streams/entities/stream-student.entity';

@Injectable()
export class TelegramBotGateway implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotGateway.name);

  constructor(
    private telegramBotService: TelegramBotService,
    private usersService: UsersService,
    private chatsService: ChatsService,
    @InjectRepository(StreamStudent)
    private studentRepository: Repository<StreamStudent>,
  ) {}

  onModuleInit() {
    this.setupCommandHandlers();
  }

  /**
   * Настройка обработчиков команд бота
   */
  private setupCommandHandlers() {
    const bot = this.telegramBotService.getBot();

    if (!bot) {
      this.logger.warn('Telegram Bot не инициализирован');
      return;
    }

    // Обработка команды /start
    bot.onText(/\/start(.*)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const username = msg.from.username;
      const firstName = msg.from.first_name;
      const lastName = msg.from.last_name;

      this.logger.log(`Получена команда /start от пользователя ${userId}`);

      // Извлекаем параметр (access_token) из команды /start
      const startParam = match[1]?.trim();

      if (startParam === 'question') {
        // Ученик хочет задать вопрос
        this.logger.log(`Ученик ${userId} хочет задать вопрос`);
        
        await this.telegramBotService.sendMessage(
          chatId,
          '💬 <b>Задайте свой вопрос</b>\n\nНапишите ваш вопрос в этот чат — автор проекта получит уведомление и ответит вам.',
        );
        // Сообщения обрабатываются в bot.on('message') и сохраняются через ChatsService
      } else if (startParam) {
        // Если есть параметр - это активация ученика по invite токену
        this.logger.log(`Параметр start: ${startParam}`);
        
        // Сразу открываем Mini App с кнопкой
        await this.telegramBotService.sendMessageWithWebApp(
          chatId,
          '🎓 Добро пожаловать!\n\nНажми кнопку ниже, чтобы начать:',
          'Открыть проект',
          startParam, // передаём токен в Mini App
        );
      } else {
        // Если нет параметра - приветствие для нового пользователя
        let user = await this.usersService.findByTelegramId(userId);

        if (!user) {
          // Создаем нового пользователя со статусом student по умолчанию
          user = await this.usersService.create({
            telegramId: userId,
            telegramUsername: username,
            firstName,
            lastName,
            role: 'student', // по умолчанию student, можно изменить в Mini App
          });

          this.logger.log(`Создан новый пользователь: ${userId}`);
        }

        const welcomeMessage = `
👋 Привет, <b>${firstName}</b>!

Добро пожаловать в <b>Modula</b> — платформу для создания и изучения онлайн-проектов в Telegram.

Открой <b>Menu Button</b> внизу, чтобы начать! 👇
        `.trim();

        await this.telegramBotService.sendMessage(chatId, welcomeMessage);
      }
    });

    // Обработка других сообщений (вопросы от учеников)
    bot.on('message', async (msg) => {
      // Пропускаем команды (они обработаны выше)
      if (msg.text?.startsWith('/')) {
        return;
      }

      const chatId = msg.chat.id;
      const telegramId = msg.from?.id;
      const text = msg.text;
      
      if (!telegramId || !text) {
        return;
      }

      this.logger.log(`Получено сообщение от ${telegramId}: ${text.substring(0, 50)}...`);

      try {
        // Ищем все потоки, в которых состоит этот ученик
        // Важно: telegramId в PostgreSQL хранится как bigint (string), нужно явное приведение
        const students = await this.studentRepository
          .createQueryBuilder('student')
          .leftJoinAndSelect('student.stream', 'stream')
          .leftJoinAndSelect('stream.creator', 'creator')
          .where('student.telegramId = :telegramId', { telegramId: String(telegramId) })
          .andWhere('student.invitationStatus = :status', { status: 'activated' })
          .getMany();
        
        this.logger.log(`Найдено ${students.length} записей студентов для telegramId=${telegramId}`);

        if (students.length === 0) {
          // Ученик не состоит ни в одном потоке
          await this.telegramBotService.sendMessage(
            chatId,
            '💬 Чтобы задать вопрос преподавателю, сначала присоединись к проекту по ссылке-приглашению.\n\nОткрой <b>Menu Button</b> внизу для навигации 👇',
          );
          return;
        }

        // Отправляем сообщение всем создателям (обычно ученик в одном потоке)
        const creatorIds = [...new Set(students.map(s => s.stream?.creatorId).filter(Boolean))];
        this.logger.log(`CreatorIds для сообщения: ${JSON.stringify(creatorIds)}`);
        
        for (const creatorId of creatorIds) {
          await this.chatsService.addIncomingMessage(
            creatorId,
            telegramId,
            text,
            msg.message_id,
            {
              username: msg.from?.username,
              firstName: msg.from?.first_name,
              lastName: msg.from?.last_name,
            },
          );
        }

        // Подтверждаем получение
        await this.telegramBotService.sendMessage(
          chatId,
          '✅ Ваше сообщение отправлено преподавателю. Ожидайте ответа!',
        );

        this.logger.log(`Сообщение от ${telegramId} сохранено для ${creatorIds.length} создателей`);

      } catch (error) {
        this.logger.error(`Ошибка обработки сообщения: ${error.message}`);
        await this.telegramBotService.sendMessage(
          chatId,
          'Произошла ошибка. Попробуйте позже или откройте <b>Menu Button</b> внизу 👇',
        );
      }
    });

    this.logger.log('Обработчики команд настроены');
  }
}


