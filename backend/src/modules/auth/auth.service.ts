import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';

interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  /**
   * Валидация Telegram initData
   * Проверяет подпись данных от Telegram WebApp
   */
  validateTelegramInitData(initData: string): TelegramWebAppUser | null {
    try {
      const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
      
      if (!botToken) {
        this.logger.error('TELEGRAM_BOT_TOKEN не найден');
        return null;
      }

      // Парсим initData
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      urlParams.delete('hash');

      // Сортируем параметры
      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Вычисляем hash
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      // Проверяем hash
      if (calculatedHash !== hash) {
        this.logger.warn('Невалидный hash Telegram initData');
        return null;
      }

      // Парсим данные пользователя
      const userJson = urlParams.get('user');
      if (!userJson) {
        this.logger.warn('Данные пользователя не найдены в initData');
        return null;
      }

      const user: TelegramWebAppUser = JSON.parse(userJson);
      return user;

    } catch (error) {
      this.logger.error(`Ошибка валидации initData: ${error.message}`);
      return null;
    }
  }

  /**
   * Аутентификация через Telegram WebApp
   * Создает или находит пользователя по Telegram данным
   */
  async authenticateFromTelegram(initData: string): Promise<User> {
    const telegramUser = this.validateTelegramInitData(initData);

    if (!telegramUser) {
      throw new UnauthorizedException('Невалидные данные Telegram');
    }

    // Ищем существующего пользователя
    let user = await this.usersService.findByTelegramId(telegramUser.id);

    if (!user) {
      // Создаем нового пользователя
      user = await this.usersService.create({
        telegramId: telegramUser.id,
        telegramUsername: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        role: 'student', // по умолчанию student
      });

      this.logger.log(`Создан новый пользователь: ${telegramUser.id}`);
    }

    return user;
  }

  /**
   * Активация ученика по access_token
   * (Будем реализовывать в следующих этапах)
   */
  async activateStudent(accessToken: string, initData: string): Promise<any> {
    const telegramUser = this.validateTelegramInitData(initData);

    if (!telegramUser) {
      throw new UnauthorizedException('Невалидные данные Telegram');
    }

    // TODO: Реализовать логику активации в Этапе 6
    // 1. Найти stream_student по access_token
    // 2. Проверить telegram_id (защита от складчины)
    // 3. Проверить payment_status (если требуется оплата)
    // 4. Обновить статус на 'activated'
    // 5. Отправить демо-уведомление

    return {
      requirePayment: false,
      message: 'Активация будет реализована в Этапе 6',
    };
  }
}


