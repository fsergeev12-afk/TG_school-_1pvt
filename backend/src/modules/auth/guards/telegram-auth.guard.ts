import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  private readonly logger = new Logger(TelegramAuthGuard.name);

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const initData = request.headers['x-telegram-init-data'];

    // DEV MODE: Если нет initData и включен dev режим - используем тестового пользователя
    const isDev = this.configService.get('NODE_ENV') === 'development' || 
                  this.configService.get('DEV_MODE') === 'true';
    
    if (!initData && isDev) {
      this.logger.warn('DEV MODE: Используется тестовый пользователь');
      
      // Получаем или создаем тестового пользователя-создателя
      let devUser = await this.usersService.findByTelegramId(999999999);
      if (!devUser) {
        devUser = await this.usersService.create({
          telegramId: 999999999,
          telegramUsername: 'dev_creator',
          firstName: 'Dev',
          lastName: 'Creator',
          role: 'creator',
        });
      }
      
      request.user = devUser;
      return true;
    }

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


