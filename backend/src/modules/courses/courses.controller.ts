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
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('courses')
@UseGuards(TelegramAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  /**
   * Создать новый курс
   * POST /api/courses
   */
  @Post()
  @Roles('creator')
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateCourseDto,
  ) {
    return this.coursesService.create(user.id, dto);
  }

  /**
   * Получить все курсы создателя
   * GET /api/courses
   */
  @Get()
  @Roles('creator')
  async findAll(@CurrentUser() user: User) {
    return this.coursesService.findAllByCreator(user.id);
  }

  /**
   * Получить курс по ID
   * GET /api/courses/:id
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    // Создатель видит свой курс, ученик - только опубликованный
    if (user.role === 'creator') {
      return this.coursesService.findOneByCreator(id, user.id);
    }
    return this.coursesService.findOne(id);
  }

  /**
   * Получить статистику курса
   * GET /api/courses/:id/stats
   */
  @Get(':id/stats')
  @Roles('creator')
  async getStats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.getStats(id, user.id);
  }

  /**
   * Обновить курс
   * PATCH /api/courses/:id
   */
  @Patch(':id')
  @Roles('creator')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, user.id, dto);
  }

  /**
   * Опубликовать курс
   * POST /api/courses/:id/publish
   */
  @Post(':id/publish')
  @Roles('creator')
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.publish(id, user.id);
  }

  /**
   * Снять курс с публикации
   * POST /api/courses/:id/unpublish
   */
  @Post(':id/unpublish')
  @Roles('creator')
  async unpublish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.unpublish(id, user.id);
  }

  /**
   * Удалить курс
   * DELETE /api/courses/:id
   */
  @Delete(':id')
  @Roles('creator')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.coursesService.remove(id, user.id);
    return { message: 'Курс удалён' };
  }
}


