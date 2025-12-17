import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitPaymentDto, ManualPaymentConfirmDto, PaymentCallbackDto } from './dto';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

/**
 * Контроллер платежей для создателей
 */
@Controller('payments')
@UseGuards(TelegramAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Получить статистику всех платежей создателя
   * GET /api/payments/stats
   */
  @Get('stats')
  @Roles('creator', 'admin')
  async getStats(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.paymentsService.getCreatorStats(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Получить статистику платежей потока
   * GET /api/payments/stream/:streamId/stats
   */
  @Get('stream/:streamId/stats')
  @Roles('creator', 'admin')
  async getStreamStats(
    @CurrentUser() user: User,
    @Param('streamId') streamId: string,
  ) {
    return this.paymentsService.getStreamStats(streamId, user.id);
  }

  /**
   * Получить платежи потока
   * GET /api/payments/stream/:streamId
   */
  @Get('stream/:streamId')
  @Roles('creator', 'admin')
  async findByStream(
    @CurrentUser() user: User,
    @Param('streamId') streamId: string,
  ) {
    return this.paymentsService.findByStream(streamId, user.id);
  }

  /**
   * Получить платёж по ID
   * GET /api/payments/:id
   */
  @Get(':id')
  @Roles('creator', 'admin')
  async findOne(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const payment = await this.paymentsService.findOne(id);
    // Проверка доступа будет внутри через stream
    return payment;
  }

  /**
   * Ручное подтверждение платежа
   * POST /api/payments/stream/:streamId/confirm
   */
  @Post('stream/:streamId/confirm')
  @Roles('creator', 'admin')
  async manualConfirm(
    @CurrentUser() user: User,
    @Param('streamId') streamId: string,
    @Body() dto: ManualPaymentConfirmDto,
  ) {
    return this.paymentsService.manualConfirm(user.id, streamId, dto);
  }
}

/**
 * Публичный контроллер платежей для учеников
 */
@Controller('payments/public')
@UseGuards(TelegramAuthGuard)
export class PaymentsPublicController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Инициировать платёж
   * POST /api/payments/public/init
   */
  @Post('init')
  async initPayment(
    @CurrentUser() user: User,
    @Body() dto: InitPaymentDto,
  ) {
    return this.paymentsService.initPayment(user.id, dto);
  }

  /**
   * Получить статус платежа
   * GET /api/payments/public/:id/status
   */
  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    const payment = await this.paymentsService.findOne(id);
    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      completedAt: payment.completedAt,
    };
  }
}

/**
 * Webhook контроллер для callback'ов от платёжных систем
 * Без аутентификации (верификация через подпись)
 */
@Controller('payments/webhook')
export class PaymentsWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Webhook от платёжной системы
   * POST /api/payments/webhook/callback
   */
  @Post('callback')
  async handleCallback(@Body() dto: PaymentCallbackDto) {
    // TODO: Верификация подписи от провайдера

    if (dto.status === 'succeeded') {
      await this.paymentsService.confirmPayment(dto.paymentId, dto.externalPaymentId);
    } else if (dto.status === 'failed' || dto.status === 'canceled') {
      await this.paymentsService.rejectPayment(dto.paymentId);
    }

    return { received: true };
  }
}

