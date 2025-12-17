import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Получить текущего пользователя
   * GET /api/users/me
   */
  @Get('me')
  @UseGuards(TelegramAuthGuard)
  async getMe(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  /**
   * Получить пользователя по ID
   * GET /api/users/:id
   */
  @Get(':id')
  @UseGuards(TelegramAuthGuard)
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }
}

