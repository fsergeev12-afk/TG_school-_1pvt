import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const initData = request.headers['x-telegram-init-data'];

    if (!initData) {
      throw new UnauthorizedException('Отсутствуют данные Telegram');
    }

    try {
      // Аутентификация и получение пользователя
      const user = await this.authService.authenticateFromTelegram(initData);
      
      // Добавляем пользователя в request
      request.user = user;
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Невалидные данные Telegram');
    }
  }
}


