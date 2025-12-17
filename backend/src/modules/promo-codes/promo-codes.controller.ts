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
import { PromoCodesService } from './promo-codes.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto, ValidatePromoCodeDto, ApplyPromoCodeDto } from './dto';
import { TelegramAuthGuard } from '../auth/guards/telegram-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

/**
 * Контроллер для управления промокодами (для создателей)
 */
@Controller('promo-codes')
@UseGuards(TelegramAuthGuard, RolesGuard)
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  /**
   * Создать промокод
   * POST /api/promo-codes
   */
  @Post()
  @Roles('creator', 'admin')
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreatePromoCodeDto,
  ) {
    return this.promoCodesService.create(user.id, dto);
  }

  /**
   * Получить все промокоды потока
   * GET /api/promo-codes?streamId=...
   */
  @Get()
  @Roles('creator', 'admin')
  async findByStream(
    @CurrentUser() user: User,
    @Query('streamId') streamId: string,
  ) {
    return this.promoCodesService.findByStream(streamId, user.id);
  }

  /**
   * Получить промокод по ID
   * GET /api/promo-codes/:id
   */
  @Get(':id')
  @Roles('creator', 'admin')
  async findOne(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const promoCode = await this.promoCodesService.findOne(id);
    // Проверка доступа через stream
    await this.promoCodesService.findByStream(promoCode.streamId, user.id);
    return promoCode;
  }

  /**
   * Получить статистику использования промокода
   * GET /api/promo-codes/:id/stats
   */
  @Get(':id/stats')
  @Roles('creator', 'admin')
  async getStats(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.promoCodesService.getUsageStats(id, user.id);
  }

  /**
   * Обновить промокод
   * PATCH /api/promo-codes/:id
   */
  @Patch(':id')
  @Roles('creator', 'admin')
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdatePromoCodeDto,
  ) {
    return this.promoCodesService.update(id, user.id, dto);
  }

  /**
   * Удалить промокод
   * DELETE /api/promo-codes/:id
   */
  @Delete(':id')
  @Roles('creator', 'admin')
  async remove(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    await this.promoCodesService.remove(id, user.id);
    return { success: true };
  }

  /**
   * Сгенерировать уникальный код
   * GET /api/promo-codes/generate?prefix=...
   */
  @Get('generate/code')
  @Roles('creator', 'admin')
  generateCode(@Query('prefix') prefix?: string) {
    return {
      code: this.promoCodesService.generateUniqueCode(prefix || ''),
    };
  }
}

/**
 * Публичный контроллер для работы с промокодами (для учеников)
 */
@Controller('promo-codes/public')
@UseGuards(TelegramAuthGuard)
export class PromoCodesPublicController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  /**
   * Проверить промокод (без применения)
   * POST /api/promo-codes/public/validate
   */
  @Post('validate')
  async validate(@Body() dto: ValidatePromoCodeDto) {
    const result = await this.promoCodesService.validate(dto.code, dto.streamId);

    if (!result.valid) {
      return {
        valid: false,
        message: result.message,
      };
    }

    return {
      valid: true,
      type: result.promoCode!.type,
      discountAmount: result.discountAmount,
      finalPrice: result.finalPrice,
      isFree: result.promoCode!.type === 'free' || result.finalPrice === 0,
    };
  }

  /**
   * Применить промокод
   * POST /api/promo-codes/public/apply
   */
  @Post('apply')
  async apply(
    @CurrentUser() user: User,
    @Body() dto: ApplyPromoCodeDto,
  ) {
    // Находим студента по user.id и streamId
    // Это будет реализовано в интеграции с StreamStudentsService
    // Пока используем user.id как studentId для демонстрации

    const result = await this.promoCodesService.apply(
      dto.code,
      dto.streamId,
      user.id, // В реальности здесь должен быть studentId
    );

    return {
      success: result.success,
      originalPrice: result.originalPrice,
      discountAmount: result.discountAmount,
      finalPrice: result.finalPrice,
      isFree: result.isFree,
    };
  }
}

