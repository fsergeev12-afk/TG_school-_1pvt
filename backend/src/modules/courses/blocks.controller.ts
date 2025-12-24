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
import { BlocksService } from './blocks.service';
import { CreateBlockDto, UpdateBlockDto, ReorderDto } from './dto';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('courses/:courseId/blocks')
@UseGuards(TelegramAuthGuard, RolesGuard)
@Roles('creator')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  /**
   * Создать блок в курсе
   * POST /api/courses/:courseId/blocks
   */
  @Post()
  async create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateBlockDto,
  ) {
    return this.blocksService.create(courseId, user.id, dto);
  }

  /**
   * Получить все блоки курса
   * GET /api/courses/:courseId/blocks
   */
  @Get()
  async findAll(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.blocksService.findAllByCourse(courseId);
  }

  /**
   * Изменить порядок блоков
   * PATCH /api/courses/:courseId/blocks/reorder
   */
  @Patch('reorder')
  async reorder(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: User,
    @Body() dto: ReorderDto,
  ) {
    return this.blocksService.reorder(courseId, user.id, dto);
  }
}

/**
 * Отдельный контроллер для операций с блоками по ID
 */
@Controller('blocks')
@UseGuards(TelegramAuthGuard, RolesGuard)
@Roles('creator')
export class BlockController {
  constructor(private readonly blocksService: BlocksService) {}

  /**
   * Получить блок по ID
   * GET /api/blocks/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.blocksService.findOne(id);
  }

  /**
   * Обновить блок
   * PATCH /api/blocks/:id
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateBlockDto,
  ) {
    return this.blocksService.update(id, user.id, dto);
  }

  /**
   * Удалить блок
   * DELETE /api/blocks/:id
   */
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.blocksService.remove(id, user.id);
    return { message: 'Блок удалён' };
  }
}


