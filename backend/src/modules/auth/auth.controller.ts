import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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


