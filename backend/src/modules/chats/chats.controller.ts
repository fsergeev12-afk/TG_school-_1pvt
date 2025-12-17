import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { SendMessageDto, ReplyMessageDto } from './dto';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';

@Controller('chats')
@UseGuards(TelegramAuthGuard, RolesGuard)
@Roles('creator', 'admin')
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  /**
   * Получить все диалоги
   * GET /api/chats
   */
  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.chatsService.findAllByCreator(user.id);
  }

  /**
   * Получить количество непрочитанных
   * GET /api/chats/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.chatsService.getUnreadCount(user.id);
    return { unreadCount: count };
  }

  /**
   * Получить диалог по ID
   * GET /api/chats/:id
   */
  @Get(':id')
  async findOne(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.chatsService.findOne(id, user.id);
  }

  /**
   * Получить сообщения диалога
   * GET /api/chats/:id/messages?limit=50&offset=0
   */
  @Get(':id/messages')
  async getMessages(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.chatsService.getMessages(
      id,
      user.id,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  /**
   * Отметить как прочитанное
   * POST /api/chats/:id/read
   */
  @Post(':id/read')
  async markAsRead(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    await this.chatsService.markAsRead(id, user.id);
    return { success: true };
  }

  /**
   * Отправить сообщение
   * POST /api/chats/:id/send
   */
  @Post(':id/send')
  async sendMessage(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ReplyMessageDto,
  ) {
    // Получаем диалог
    const conversation = await this.chatsService.findOne(id, user.id);

    // Отправляем в Telegram
    try {
      await this.telegramBotService.sendMessage(
        conversation.telegramChatId,
        dto.text,
      );
    } catch (error) {
      // Логируем ошибку, но не прерываем — сохраняем сообщение локально
      console.error('Ошибка отправки в Telegram:', error);
    }

    // Сохраняем сообщение
    const message = await this.chatsService.addOutgoingMessage(
      id,
      user.id,
      dto.text,
    );

    return message;
  }

  /**
   * Привязать диалог к ученику
   * POST /api/chats/:id/link
   */
  @Post(':id/link')
  async linkToStudent(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('studentId') studentId: string,
  ) {
    return this.chatsService.linkToStudent(id, user.id, studentId);
  }
}

