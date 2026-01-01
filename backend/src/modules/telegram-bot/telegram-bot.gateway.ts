import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class TelegramBotGateway implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotGateway.name);

  constructor(
    private telegramBotService: TelegramBotService,
    private usersService: UsersService,
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
        
        // Запоминаем состояние "ожидание вопроса"
        // TODO: реализовать сохранение вопросов в БД
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

    // Обработка других сообщений
    bot.on('message', async (msg) => {
      // Пропускаем команды (они обработаны выше)
      if (msg.text?.startsWith('/')) {
        return;
      }

      const chatId = msg.chat.id;
      
      await this.telegramBotService.sendMessage(
        chatId,
        'Используй <b>Menu Button</b> внизу, чтобы открыть платформу! 👇',
      );
    });

    this.logger.log('Обработчики команд настроены');
  }
}


