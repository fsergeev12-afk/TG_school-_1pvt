import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: TelegramBot;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!token) {
      this.logger.error('TELEGRAM_BOT_TOKEN не найден в .env файле!');
      return;
    }

    // Определяем production по наличию DATABASE_URL (Railway) или NODE_ENV
    const isProduction = 
      !!this.configService.get<string>('DATABASE_URL') || 
      this.configService.get<string>('NODE_ENV') === 'production';

    // В production используем polling=false чтобы избежать конфликтов
    // Webhook нужно будет настроить отдельно
    this.bot = new TelegramBot(token, {
      polling: !isProduction,
    });

    this.logger.log('Telegram Bot инициализирован');
    this.logger.log(`Режим: ${isProduction ? 'webhook (polling отключен)' : 'polling'}`);
    
    if (isProduction) {
      this.logger.warn('⚠️ Для работы в production настройте webhook через /api/telegram/set-webhook');
    }
  }

  /**
   * Получить инстанс бота
   */
  getBot(): TelegramBot {
    return this.bot;
  }

  /**
   * Отправить сообщение пользователю
   */
  async sendMessage(
    chatId: number,
    text: string,
    options?: TelegramBot.SendMessageOptions,
  ): Promise<TelegramBot.Message> {
    try {
      return await this.bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        ...options,
      });
    } catch (error) {
      this.logger.error(`Ошибка отправки сообщения: ${error.message}`);
      throw error;
    }
  }

  /**
   * Отправить сообщение с кнопкой открытия Mini App
   * Используется для мгновенного перехода ученика на курс
   */
  async sendMessageWithWebApp(
    chatId: number,
    text: string,
    buttonText: string,
    startParam?: string,
  ): Promise<TelegramBot.Message> {
    const webAppUrl = this.configService.get<string>('WEBAPP_URL') || 'https://tg-school-1pvt.vercel.app';
    
    // Добавляем start_param в URL если есть
    const url = startParam ? `${webAppUrl}?start=${startParam}` : webAppUrl;

    try {
      return await this.bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            {
              text: buttonText,
              web_app: { url },
            },
          ]],
        },
      });
    } catch (error) {
      this.logger.error(`Ошибка отправки сообщения с WebApp: ${error.message}`);
      throw error;
    }
  }

  /**
   * Генерация Direct Link для Mini App
   */
  private generateDirectLink(accessToken: string): string {
    const botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME') || 'Bllocklyyy_bot';
    const appShortName = this.configService.get<string>('TELEGRAM_APP_SHORT_NAME') || 'Amber';
    return `https://t.me/${botUsername}/${appShortName}?startapp=${accessToken}`;
  }

  /**
   * Отправить welcome сообщение (объединенное: приглашение + welcome)
   */
  async sendWelcomeMessage(
    telegramId: number,
    creatorName: string,
    streamName: string,
    accessToken: string,
  ): Promise<void> {
    const message = `
🎓 Привет! <b>${creatorName}</b> приглашает тебя на проект "<b>${streamName}</b>"!

Нажми кнопку ниже, чтобы начать обучение.
    `.trim();

    await this.sendMessageWithWebApp(
      telegramId,
      message,
      `Открыть "${streamName}"`,
      accessToken,
    );
    this.logger.log(`Welcome сообщение отправлено пользователю ${telegramId}`);
  }

  /**
   * Отправить уведомление о новом материале
   */
  async sendLessonNotification(
    telegramId: number,
    creatorName: string,
    streamName: string,
    lessonTitle: string,
    accessToken: string,
  ): Promise<void> {
    const message = `
📚 <b>Новый материал доступен!</b>

От <b>${creatorName}</b> в проекте "<b>${streamName}</b>":
Материал "${lessonTitle}" открыт для просмотра.
    `.trim();

    await this.sendMessageWithWebApp(
      telegramId,
      message,
      `Открыть "${streamName}"`,
      accessToken,
    );
    this.logger.log(`Уведомление о материале отправлено пользователю ${telegramId}`);
  }

  /**
   * Отправить broadcast сообщение (ручная рассылка от создателя)
   */
  async sendBroadcastMessage(
    telegramId: number,
    creatorName: string,
    streamName: string,
    messageText: string,
    accessToken: string,
  ): Promise<void> {
    const message = `
💬 <b>Сообщение от ${creatorName}</b>

${messageText}
    `.trim();

    await this.sendMessageWithWebApp(
      telegramId,
      message,
      `Открыть "${courseName}"`,
      accessToken,
    );
    this.logger.log(`Broadcast сообщение отправлено пользователю ${telegramId}`);
  }

  /**
   * Настроить webhook (для продакшена)
   */
  async setWebhook(url: string): Promise<void> {
    try {
      await this.bot.setWebHook(url);
      this.logger.log(`Webhook установлен: ${url}`);
    } catch (error) {
      this.logger.error(`Ошибка установки webhook: ${error.message}`);
      throw error;
    }
  }

  /**
   * Удалить webhook (для разработки)
   */
  async deleteWebhook(): Promise<void> {
    try {
      await this.bot.deleteWebHook();
      this.logger.log('Webhook удален');
    } catch (error) {
      this.logger.error(`Ошибка удаления webhook: ${error.message}`);
      throw error;
    }
  }
}


