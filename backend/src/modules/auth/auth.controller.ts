import { Controller, Post, Get, Body, Headers, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TelegramAuthGuard } from './guards/telegram-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Аутентификация через Telegram WebApp
   * POST /api/auth/login
   */
  @Post('login')
  async login(@Headers('x-telegram-init-data') initData: string) {
    if (!initData) {
      throw new UnauthorizedException('Отсутствуют данные Telegram');
    }

    const user = await this.authService.authenticateFromTelegram(initData);

    return {
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.telegramUsername,
        role: user.role,
      },
    };
  }

  /**
   * Получить текущего пользователя
   * GET /api/auth/me
   */
  @Get('me')
  @UseGuards(TelegramAuthGuard)
  async me(@CurrentUser() user: User) {
    return {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      telegramUsername: user.telegramUsername,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  /**
   * Стать создателем курсов
   * POST /api/auth/become-creator
   * Вызывается когда пользователь открывает бота напрямую (не по invite ссылке)
   */
  @Post('become-creator')
  @UseGuards(TelegramAuthGuard)
  async becomeCreator(@CurrentUser() user: User) {
    // Обновляем роль на creator если она ещё не creator/admin
    if (user.role === 'student') {
      await this.usersService.updateRole(user.id, 'creator');
      user.role = 'creator';
    }

    return {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      telegramUsername: user.telegramUsername,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  /**
   * Активация ученика по access_token
   * POST /api/auth/activate
   */
  @Post('activate')
  async activate(
    @Body('accessToken') accessToken: string,
    @Headers('x-telegram-init-data') initData: string,
  ) {
    if (!initData) {
      throw new UnauthorizedException('Отсутствуют данные Telegram');
    }

    if (!accessToken) {
      throw new UnauthorizedException('Отсутствует access token');
    }

    return await this.authService.activateStudent(accessToken, initData);
  }
}


