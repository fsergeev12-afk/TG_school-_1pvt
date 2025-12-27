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
import { LessonScheduleService } from './lesson-schedule.service';
import { CreateScheduleDto, UpdateLessonScheduleDto } from './dto';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('streams/:streamId/schedule')
@UseGuards(TelegramAuthGuard, RolesGuard)
export class LessonScheduleController {
  constructor(private readonly scheduleService: LessonScheduleService) {}

  /**
   * Получить расписание потока
   * GET /api/streams/:streamId/schedule
   */
  @Get()
  @Roles('creator', 'admin')
  async findAll(
    @CurrentUser() user: User,
    @Param('streamId') streamId: string,
  ) {
    return this.scheduleService.findByStream(streamId, user.id);
  }

  /**
   * Создать расписание для потока
   * POST /api/streams/:streamId/schedule
   */
  @Post()
  @Roles('creator', 'admin')
  async create(
    @CurrentUser() user: User,
    @Param('streamId') streamId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.scheduleService.createSchedule(streamId, user.id, dto);
  }

  /**
   * Автоматическое создание расписания
   * POST /api/streams/:streamId/schedule/auto
   */
  @Post('auto')
  @Roles('creator', 'admin')
  async generateAuto(
    @CurrentUser() user: User,
    @Param('streamId') streamId: string,
    @Body() body: { startDate: string; intervalDays?: number },
  ) {
    return this.scheduleService.generateAutoSchedule(
      streamId,
      user.id,
      new Date(body.startDate),
      body.intervalDays || 1,
    );
  }

  /**
   * Обновить расписание урока
   * PATCH /api/streams/:streamId/schedule/:scheduleId
   */
  @Patch(':scheduleId')
  @Roles('creator', 'admin')
  async update(
    @CurrentUser() user: User,
    @Param('streamId') streamId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: UpdateLessonScheduleDto,
  ) {
    return this.scheduleService.updateSchedule(scheduleId, user.id, dto);
  }

  /**
   * Удалить расписание урока
   * DELETE /api/streams/:streamId/schedule/:scheduleId
   */
  @Delete(':scheduleId')
  @Roles('creator', 'admin')
  async remove(
    @CurrentUser() user: User,
    @Param('streamId') streamId: string,
    @Param('scheduleId') scheduleId: string,
  ) {
    await this.scheduleService.removeSchedule(scheduleId, user.id);
    return { success: true };
  }
}

/**
 * Контроллер для проверки доступа к урокам (для студентов)
 */
@Controller('lessons')
export class LessonAccessController {
  constructor(private readonly scheduleService: LessonScheduleService) {}

  /**
   * Проверить, открыт ли урок для ученика
   * GET /api/lessons/:lessonId/access?streamId=...
   */
  @Get(':lessonId/access')
  @UseGuards(TelegramAuthGuard)
  async checkAccess(
    @Param('lessonId') lessonId: string,
    @Query('streamId') streamId: string,
  ) {
    const isOpen = await this.scheduleService.isLessonOpenForStudent(lessonId, streamId);

    return {
      lessonId,
      streamId,
      isOpen,
    };
  }
}



