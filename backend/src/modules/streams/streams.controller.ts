import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamsService } from './streams.service';
import { CreateStreamDto, UpdateStreamDto } from './dto';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('streams')
@UseGuards(TelegramAuthGuard, RolesGuard)
export class StreamsController {
  constructor(
    private readonly streamsService: StreamsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Создать новый поток
   * POST /api/streams
   */
  @Post()
  @Roles('creator', 'admin')
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateStreamDto,
  ) {
    return this.streamsService.create(user.id, dto);
  }

  /**
   * Получить все потоки создателя
   * GET /api/streams
   */
  @Get()
  @Roles('creator', 'admin')
  async findAll(@CurrentUser() user: User) {
    return this.streamsService.findAllByCreator(user.id);
  }

  /**
   * Получить потоки курса
   * GET /api/streams/course/:courseId
   */
  @Get('course/:courseId')
  @Roles('creator', 'admin')
  async findByCourse(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
  ) {
    return this.streamsService.findByCourse(courseId, user.id);
  }

  /**
   * Получить поток по ID
   * GET /api/streams/:id
   */
  @Get(':id')
  @Roles('creator', 'admin')
  async findOne(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.streamsService.findOneByCreator(id, user.id);
  }

  /**
   * Получить статистику потока
   * GET /api/streams/:id/stats
   */
  @Get(':id/stats')
  @Roles('creator', 'admin')
  async getStats(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.streamsService.getStats(id, user.id);
  }

  /**
   * Получить ссылку приглашения для потока
   * GET /api/streams/:id/invite-link
   */
  @Get(':id/invite-link')
  @Roles('creator', 'admin')
  async getInviteLink(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const stream = await this.streamsService.findOneByCreator(id, user.id);
    const botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME');
    
    if (!botUsername) {
      return {
        inviteLink: null,
        error: 'Bot username not configured',
      };
    }

    // Формат: https://t.me/BOT_NAME?start=INVITE_TOKEN
    const inviteLink = `https://t.me/${botUsername}?start=${stream.inviteToken}`;
    
    return {
      inviteLink,
      inviteToken: stream.inviteToken,
      streamName: stream.name,
      courseName: stream.course?.title,
    };
  }

  /**
   * Обновить поток
   * PATCH /api/streams/:id
   */
  @Patch(':id')
  @Roles('creator', 'admin')
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateStreamDto,
  ) {
    return this.streamsService.update(id, user.id, dto);
  }

  /**
   * Клонировать поток
   * POST /api/streams/:id/clone
   */
  @Post(':id/clone')
  @Roles('creator', 'admin')
  async clone(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('name') newName?: string,
  ) {
    return this.streamsService.clone(id, user.id, newName);
  }

  /**
   * Удалить поток
   * DELETE /api/streams/:id
   */
  @Delete(':id')
  @Roles('creator', 'admin')
  async remove(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    await this.streamsService.remove(id, user.id);
    return { success: true };
  }
}


