import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamStudentsService } from './stream-students.service';
import { AddStudentDto, BulkAddStudentsDto } from './dto';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('streams/:streamId/students')
@UseGuards(TelegramAuthGuard, RolesGuard)
export class StreamStudentsController {
  constructor(
    private readonly studentsService: StreamStudentsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Получить всех учеников потока
   * GET /api/streams/:streamId/students
   */
  @Get()
  @Roles('creator', 'admin')
  async findAll(
    @CurrentUser() user: User,
    @Param('streamId') streamId: string,
  ) {
    const students = await this.studentsService.findByStream(streamId, user.id);
    const botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME');

    // Добавляем ссылки приглашения
    return students.map(student => ({
      ...student,
      inviteLink: botUsername
        ? this.studentsService.getInviteLink(student, botUsername)
        : null,
    }));
  }

  /**
   * Получить статистику учеников
   * GET /api/streams/:streamId/students/stats
   */
  @Get('stats')
  @Roles('creator', 'admin')
  async getStats(
    @CurrentUser() user: User,
    @Param('streamId') streamId: string,
  ) {
    return this.studentsService.getStudentStats(streamId, user.id);
  }

  /**
   * Добавить ученика в поток
   * POST /api/streams/:streamId/students
   */
  @Post()
  @Roles('creator', 'admin')
  async addStudent(
    @CurrentUser() user: User,
    @Param('streamId') streamId: string,
    @Body() dto: AddStudentDto,
  ) {
    const student = await this.studentsService.addStudent(streamId, user.id, dto);
    const botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME');

    return {
      ...student,
      inviteLink: botUsername
        ? this.studentsService.getInviteLink(student, botUsername)
        : null,
    };
  }

  /**
   * Массовое добавление учеников
   * POST /api/streams/:streamId/students/bulk
   */
  @Post('bulk')
  @Roles('creator', 'admin')
  async bulkAddStudents(
    @CurrentUser() user: User,
    @Param('streamId') streamId: string,
    @Body() dto: BulkAddStudentsDto,
  ) {
    return this.studentsService.bulkAddStudents(streamId, user.id, dto);
  }

  /**
   * Отметить оплату ученика
   * POST /api/streams/:streamId/students/:studentId/paid
   */
  @Post(':studentId/paid')
  @Roles('creator', 'admin')
  async markPaid(
    @CurrentUser() user: User,
    @Param('streamId') streamId: string,
    @Param('studentId') studentId: string,
    @Body('paymentId') paymentId?: string,
  ) {
    return this.studentsService.markPaid(studentId, user.id, paymentId);
  }

  /**
   * Удалить ученика из потока
   * DELETE /api/streams/:streamId/students/:studentId
   */
  @Delete(':studentId')
  @Roles('creator', 'admin')
  async removeStudent(
    @CurrentUser() user: User,
    @Param('streamId') streamId: string,
    @Param('studentId') studentId: string,
  ) {
    await this.studentsService.remove(studentId, user.id);
    return { success: true };
  }
}

/**
 * Публичный контроллер для активации учеников
 * Не требует аутентификации создателя
 */
@Controller('students')
export class StudentActivationController {
  constructor(private readonly studentsService: StreamStudentsService) {}

  /**
   * Активация ученика по токену
   * POST /api/students/activate
   */
  @Post('activate')
  @UseGuards(TelegramAuthGuard)
  async activate(
    @CurrentUser() user: User,
    @Body('accessToken') accessToken: string,
  ) {
    const student = await this.studentsService.activate(
      accessToken,
      user.telegramId,
      user.id,
    );

    return {
      success: true,
      student,
      stream: student.stream,
      course: student.stream?.course,
      requiresPayment: student.stream?.price > 0 && student.paymentStatus === 'unpaid',
    };
  }

  /**
   * Проверить токен доступа (без активации)
   * GET /api/students/check/:accessToken
   */
  @Get('check/:accessToken')
  async checkToken(@Param('accessToken') accessToken: string) {
    const student = await this.studentsService.findByAccessToken(accessToken);

    if (!student) {
      return {
        valid: false,
        message: 'Недействительная ссылка приглашения',
      };
    }

    return {
      valid: true,
      streamName: student.stream?.name,
      courseName: student.stream?.course?.title,
      isActivated: student.invitationStatus === 'activated',
      isPaid: student.paymentStatus === 'paid',
      requiresPayment: (student.stream?.price || 0) > 0,
    };
  }
}


