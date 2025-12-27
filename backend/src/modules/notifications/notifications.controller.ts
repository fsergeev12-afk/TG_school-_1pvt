import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendBroadcastDto } from './dto';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('notifications')
@UseGuards(TelegramAuthGuard, RolesGuard)
@Roles('creator', 'admin')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Получить уведомления потока
   * GET /api/notifications/stream/:streamId
   */
  @Get('stream/:streamId')
  async findByStream(
    @CurrentUser() user: User,
    @Param('streamId') streamId: string,
  ) {
    return this.notificationsService.findByStream(streamId, user.id);
  }

  /**
   * Отправить broadcast рассылку
   * POST /api/notifications/broadcast
   */
  @Post('broadcast')
  async sendBroadcast(
    @CurrentUser() user: User,
    @Body() dto: SendBroadcastDto,
  ) {
    const result = await this.notificationsService.sendBroadcast(user.id, dto);
    return {
      success: true,
      ...result,
    };
  }
}



