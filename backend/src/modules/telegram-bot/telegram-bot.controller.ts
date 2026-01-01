import { Controller, Post, Body, Get, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramBotGateway } from './telegram-bot.gateway';
import { ConfigService } from '@nestjs/config';

@Controller('telegram')
export class TelegramBotController {
  private readonly logger = new Logger(TelegramBotController.name);

  constructor(
    private telegramBotService: TelegramBotService,
    private telegramBotGateway: TelegramBotGateway,
    private configService: ConfigService,
  ) {}

  /**
   * Webhook endpoint для Telegram
   * POST /api/telegram/webhook
   */
  @Post('webhook')
  async handleWebhook(@Body() update: any, @Res() res: Response) {
    this.logger.log(`Получен webhook update: ${JSON.stringify(update).substring(0, 200)}...`);

    try {
      const bot = this.telegramBotService.getBot();
      if (bot) {
        // Обрабатываем update через node-telegram-bot-api
        bot.processUpdate(update);
      }
    } catch (error) {
      this.logger.error(`Ошибка обработки webhook: ${error.message}`);
    }

    // Всегда отвечаем 200 OK для Telegram
    res.status(200).send('OK');
  }

  /**
   * Установить webhook
   * GET /api/telegram/set-webhook
   */
  @Get('set-webhook')
  async setWebhook() {
    const backendUrl = this.configService.get<string>('BACKEND_URL');
    
    if (!backendUrl) {
      return {
        success: false,
        error: 'BACKEND_URL не настроен в переменных окружения',
      };
    }

    const webhookUrl = `${backendUrl}/api/telegram/webhook`;

    try {
      await this.telegramBotService.setWebhook(webhookUrl);
      return {
        success: true,
        webhookUrl,
        message: 'Webhook успешно установлен',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Удалить webhook (для перехода на polling)
   * GET /api/telegram/delete-webhook
   */
  @Get('delete-webhook')
  async deleteWebhook() {
    try {
      await this.telegramBotService.deleteWebhook();
      return {
        success: true,
        message: 'Webhook удален. Теперь используется polling.',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Информация о webhook
   * GET /api/telegram/webhook-info
   */
  @Get('webhook-info')
  async getWebhookInfo() {
    try {
      const bot = this.telegramBotService.getBot();
      const info = await bot.getWebHookInfo();
      return {
        success: true,
        info,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

