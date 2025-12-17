import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto, UpdateLessonDto, ReorderDto } from './dto';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('blocks/:blockId/lessons')
@UseGuards(TelegramAuthGuard, RolesGuard)
@Roles('creator')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  /**
   * Создать урок в блоке
   * POST /api/blocks/:blockId/lessons
   */
  @Post()
  async create(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonsService.create(blockId, user.id, dto);
  }

  /**
   * Получить все уроки блока
   * GET /api/blocks/:blockId/lessons
   */
  @Get()
  async findAll(@Param('blockId', ParseUUIDPipe) blockId: string) {
    return this.lessonsService.findAllByBlock(blockId);
  }

  /**
   * Изменить порядок уроков
   * PATCH /api/blocks/:blockId/lessons/reorder
   */
  @Patch('reorder')
  async reorder(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @CurrentUser() user: User,
    @Body() dto: ReorderDto,
  ) {
    return this.lessonsService.reorder(blockId, user.id, dto);
  }
}

/**
 * Отдельный контроллер для операций с уроками по ID
 */
@Controller('lessons')
@UseGuards(TelegramAuthGuard, RolesGuard)
export class LessonController {
  constructor(private readonly lessonsService: LessonsService) {}

  /**
   * Получить урок по ID
   * GET /api/lessons/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.lessonsService.findOne(id);
  }

  /**
   * Обновить урок
   * PATCH /api/lessons/:id
   */
  @Patch(':id')
  @Roles('creator')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(id, user.id, dto);
  }

  /**
   * Переместить урок в другой блок
   * POST /api/lessons/:id/move/:newBlockId
   */
  @Post(':id/move/:newBlockId')
  @Roles('creator')
  async moveToBlock(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('newBlockId', ParseUUIDPipe) newBlockId: string,
    @CurrentUser() user: User,
  ) {
    return this.lessonsService.moveToBlock(id, user.id, newBlockId);
  }

  /**
   * Удалить урок
   * DELETE /api/lessons/:id
   */
  @Delete(':id')
  @Roles('creator')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.lessonsService.remove(id, user.id);
    return { message: 'Урок удалён' };
  }
}

