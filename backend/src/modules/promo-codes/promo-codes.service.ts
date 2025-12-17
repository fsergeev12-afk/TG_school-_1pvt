import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromoCode } from './entities/promo-code.entity';
import { PromoCodeUsage } from './entities/promo-code-usage.entity';
import { Stream } from '../streams/entities/stream.entity';
import { StreamStudent } from '../streams/entities/stream-student.entity';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto';

/**
 * Результат применения промокода
 */
export interface PromoCodeApplyResult {
  success: boolean;
  promoCode: PromoCode;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  isFree: boolean;
}

/**
 * Результат валидации промокода
 */
export interface PromoCodeValidationResult {
  valid: boolean;
  message?: string;
  promoCode?: PromoCode;
  discountAmount?: number;
  finalPrice?: number;
}

@Injectable()
export class PromoCodesService {
  constructor(
    @InjectRepository(PromoCode)
    private readonly promoCodeRepository: Repository<PromoCode>,
    @InjectRepository(PromoCodeUsage)
    private readonly usageRepository: Repository<PromoCodeUsage>,
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
    @InjectRepository(StreamStudent)
    private readonly studentRepository: Repository<StreamStudent>,
  ) {}

  /**
   * Проверить, что поток принадлежит создателю
   */
  private async checkStreamOwnership(streamId: string, creatorId: string): Promise<Stream> {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId },
    });

    if (!stream) {
      throw new NotFoundException('Поток не найден');
    }

    if (stream.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа к этому потоку');
    }

    return stream;
  }

  /**
   * Создать промокод
   */
  async create(creatorId: string, dto: CreatePromoCodeDto): Promise<PromoCode> {
    const stream = await this.checkStreamOwnership(dto.streamId, creatorId);

    // Проверяем уникальность кода в рамках потока
    const existing = await this.promoCodeRepository.findOne({
      where: { streamId: dto.streamId, code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException('Промокод с таким кодом уже существует в этом потоке');
    }

    // Валидация discountValue для percent_discount
    if (dto.type === 'percent_discount') {
      if (!dto.discountValue || dto.discountValue < 1 || dto.discountValue > 100) {
        throw new BadRequestException('Для процентной скидки укажите значение от 1 до 100');
      }
    }

    const promoCode = this.promoCodeRepository.create({
      streamId: dto.streamId,
      code: dto.code.toUpperCase(),
      type: dto.type,
      discountValue: dto.type === 'free' ? null : dto.discountValue,
      maxUsages: dto.maxUsages || null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      description: dto.description,
      isActive: true,
      usageCount: 0,
    });

    return this.promoCodeRepository.save(promoCode);
  }

  /**
   * Получить все промокоды потока
   */
  async findByStream(streamId: string, creatorId: string): Promise<PromoCode[]> {
    await this.checkStreamOwnership(streamId, creatorId);

    return this.promoCodeRepository.find({
      where: { streamId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Получить промокод по ID
   */
  async findOne(id: string): Promise<PromoCode> {
    const promoCode = await this.promoCodeRepository.findOne({
      where: { id },
      relations: ['stream'],
    });

    if (!promoCode) {
      throw new NotFoundException('Промокод не найден');
    }

    return promoCode;
  }

  /**
   * Обновить промокод
   */
  async update(id: string, creatorId: string, dto: UpdatePromoCodeDto): Promise<PromoCode> {
    const promoCode = await this.findOne(id);
    await this.checkStreamOwnership(promoCode.streamId, creatorId);

    if (dto.expiresAt) {
      promoCode.expiresAt = new Date(dto.expiresAt);
    }

    if (dto.maxUsages !== undefined) {
      promoCode.maxUsages = dto.maxUsages;
    }

    if (dto.description !== undefined) {
      promoCode.description = dto.description;
    }

    if (dto.isActive !== undefined) {
      promoCode.isActive = dto.isActive;
    }

    return this.promoCodeRepository.save(promoCode);
  }

  /**
   * Удалить промокод
   */
  async remove(id: string, creatorId: string): Promise<void> {
    const promoCode = await this.findOne(id);
    await this.checkStreamOwnership(promoCode.streamId, creatorId);

    await this.promoCodeRepository.remove(promoCode);
  }

  /**
   * Валидировать промокод (без применения)
   */
  async validate(
    code: string,
    streamId: string,
    studentId?: string,
  ): Promise<PromoCodeValidationResult> {
    const promoCode = await this.promoCodeRepository.findOne({
      where: { code: code.toUpperCase(), streamId },
      relations: ['stream'],
    });

    if (!promoCode) {
      return { valid: false, message: 'Промокод не найден' };
    }

    if (!promoCode.isActive) {
      return { valid: false, message: 'Промокод деактивирован' };
    }

    // Проверка срока действия
    if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
      return { valid: false, message: 'Срок действия промокода истёк' };
    }

    // Проверка лимита использований
    if (promoCode.maxUsages && promoCode.usageCount >= promoCode.maxUsages) {
      return { valid: false, message: 'Достигнут лимит использований промокода' };
    }

    // Проверка, использовал ли уже этот ученик этот промокод
    if (studentId) {
      const existingUsage = await this.usageRepository.findOne({
        where: { promoCodeId: promoCode.id, studentId },
      });

      if (existingUsage) {
        return { valid: false, message: 'Вы уже использовали этот промокод' };
      }
    }

    // Рассчитываем скидку
    const originalPrice = promoCode.stream?.price || 0;
    const { discountAmount, finalPrice } = this.calculateDiscount(promoCode, originalPrice);

    return {
      valid: true,
      promoCode,
      discountAmount,
      finalPrice,
    };
  }

  /**
   * Применить промокод к ученику
   */
  async apply(
    code: string,
    streamId: string,
    studentId: string,
  ): Promise<PromoCodeApplyResult> {
    // Валидируем промокод
    const validation = await this.validate(code, streamId, studentId);

    if (!validation.valid) {
      throw new BadRequestException(validation.message);
    }

    const promoCode = validation.promoCode!;
    const stream = await this.streamRepository.findOne({ where: { id: streamId } });
    const originalPrice = stream?.price || 0;

    // Создаём запись использования
    const usage = this.usageRepository.create({
      promoCodeId: promoCode.id,
      studentId,
    });
    await this.usageRepository.save(usage);

    // Увеличиваем счётчик использований
    promoCode.usageCount += 1;
    await this.promoCodeRepository.save(promoCode);

    const { discountAmount, finalPrice } = this.calculateDiscount(promoCode, originalPrice);

    return {
      success: true,
      promoCode,
      originalPrice,
      discountAmount,
      finalPrice,
      isFree: promoCode.type === 'free' || finalPrice === 0,
    };
  }

  /**
   * Рассчитать скидку
   */
  private calculateDiscount(
    promoCode: PromoCode,
    originalPrice: number,
  ): { discountAmount: number; finalPrice: number } {
    let discountAmount = 0;

    switch (promoCode.type) {
      case 'free':
        discountAmount = originalPrice;
        break;

      case 'percent_discount':
        discountAmount = Math.round(originalPrice * (promoCode.discountValue! / 100));
        break;

      case 'fixed_discount':
        discountAmount = Math.min(promoCode.discountValue!, originalPrice);
        break;
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return { discountAmount, finalPrice };
  }

  /**
   * Получить статистику использования промокода
   */
  async getUsageStats(id: string, creatorId: string): Promise<{
    totalUsages: number;
    usages: PromoCodeUsage[];
  }> {
    const promoCode = await this.findOne(id);
    await this.checkStreamOwnership(promoCode.streamId, creatorId);

    const usages = await this.usageRepository.find({
      where: { promoCodeId: id },
      relations: ['student'],
      order: { usedAt: 'DESC' },
    });

    return {
      totalUsages: usages.length,
      usages,
    };
  }

  /**
   * Генерация уникального кода
   */
  generateUniqueCode(prefix: string = ''): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Без похожих символов (O, 0, 1, I)
    let code = prefix;

    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }
}

