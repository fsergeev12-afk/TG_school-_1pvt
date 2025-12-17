import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Stream } from '../streams/entities/stream.entity';
import { StreamStudent } from '../streams/entities/stream-student.entity';
import { PromoCodesService } from '../promo-codes/promo-codes.service';
import { CreatePaymentDto, InitPaymentDto, ManualPaymentConfirmDto } from './dto';

/**
 * Результат инициации платежа
 */
export interface PaymentInitResult {
  paymentId: string;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  isFree: boolean;
  // URL для редиректа на страницу оплаты (для реальной интеграции)
  paymentUrl?: string;
}

/**
 * Статистика платежей
 */
export interface PaymentStats {
  totalRevenue: number;
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  averagePayment: number;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
    @InjectRepository(StreamStudent)
    private readonly studentRepository: Repository<StreamStudent>,
    private readonly promoCodesService: PromoCodesService,
  ) {}

  /**
   * Инициировать платёж
   */
  async initPayment(
    userId: string,
    dto: InitPaymentDto,
  ): Promise<PaymentInitResult> {
    // Находим студента
    const student = await this.studentRepository.findOne({
      where: { streamId: dto.streamId, userId },
      relations: ['stream'],
    });

    if (!student) {
      throw new NotFoundException('Вы не добавлены в этот поток');
    }

    if (student.paymentStatus === 'paid') {
      throw new BadRequestException('Курс уже оплачен');
    }

    const stream = student.stream;
    let originalAmount = stream.price;
    let discountAmount = 0;
    let promoCodeId: string | undefined;

    // Применяем промокод если есть
    if (dto.promoCode) {
      const promoResult = await this.promoCodesService.apply(
        dto.promoCode,
        dto.streamId,
        student.id,
      );

      discountAmount = promoResult.discountAmount;
      promoCodeId = promoResult.promoCode.id;

      // Если бесплатный — сразу активируем
      if (promoResult.isFree) {
        student.paymentStatus = 'paid';
        student.paidAt = new Date();
        await this.studentRepository.save(student);

        // Создаём запись о "бесплатном" платеже
        const payment = this.paymentRepository.create({
          studentId: student.id,
          streamId: dto.streamId,
          amount: 0,
          originalAmount,
          discountAmount,
          promoCodeId,
          status: 'completed',
          completedAt: new Date(),
        });
        await this.paymentRepository.save(payment);

        return {
          paymentId: payment.id,
          amount: 0,
          originalAmount,
          discountAmount,
          isFree: true,
        };
      }
    }

    const finalAmount = originalAmount - discountAmount;

    // Создаём платёж
    const payment = this.paymentRepository.create({
      studentId: student.id,
      streamId: dto.streamId,
      amount: finalAmount,
      originalAmount,
      discountAmount,
      promoCodeId,
      status: 'pending',
    });

    await this.paymentRepository.save(payment);

    // TODO: Интеграция с платёжным провайдером
    // const paymentUrl = await this.createExternalPayment(payment);

    return {
      paymentId: payment.id,
      amount: finalAmount,
      originalAmount,
      discountAmount,
      isFree: false,
      // paymentUrl,
    };
  }

  /**
   * Подтвердить платёж (callback от провайдера)
   */
  async confirmPayment(
    paymentId: string,
    externalPaymentId: string,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['student'],
    });

    if (!payment) {
      throw new NotFoundException('Платёж не найден');
    }

    if (payment.status === 'completed') {
      return payment; // Уже подтверждён
    }

    payment.status = 'completed';
    payment.externalPaymentId = externalPaymentId;
    payment.completedAt = new Date();

    await this.paymentRepository.save(payment);

    // Обновляем статус студента
    if (payment.student) {
      payment.student.paymentStatus = 'paid';
      payment.student.paidAt = new Date();
      payment.student.paymentId = payment.id;
      await this.studentRepository.save(payment.student);
    }

    return payment;
  }

  /**
   * Ручное подтверждение платежа (для MVP без интеграции)
   */
  async manualConfirm(
    creatorId: string,
    streamId: string,
    dto: ManualPaymentConfirmDto,
  ): Promise<Payment> {
    // Проверяем права
    const stream = await this.streamRepository.findOne({
      where: { id: streamId },
    });

    if (!stream || stream.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа');
    }

    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId, streamId },
    });

    if (!student) {
      throw new NotFoundException('Ученик не найден');
    }

    // Создаём или обновляем платёж
    let payment = await this.paymentRepository.findOne({
      where: { studentId: student.id, streamId, status: 'pending' },
    });

    if (!payment) {
      payment = this.paymentRepository.create({
        studentId: student.id,
        streamId,
        amount: stream.price,
        originalAmount: stream.price,
        discountAmount: 0,
        status: 'completed',
        completedAt: new Date(),
      });
    } else {
      payment.status = 'completed';
      payment.completedAt = new Date();
    }

    if (dto.comment) {
      payment.externalPaymentId = dto.comment;
    }

    await this.paymentRepository.save(payment);

    // Обновляем статус студента
    student.paymentStatus = 'paid';
    student.paidAt = new Date();
    student.paymentId = payment.id;
    await this.studentRepository.save(student);

    return payment;
  }

  /**
   * Отклонить платёж
   */
  async rejectPayment(paymentId: string, reason?: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Платёж не найден');
    }

    payment.status = 'failed';
    return this.paymentRepository.save(payment);
  }

  /**
   * Получить платежи потока
   */
  async findByStream(streamId: string, creatorId: string): Promise<Payment[]> {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId },
    });

    if (!stream || stream.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа');
    }

    return this.paymentRepository.find({
      where: { streamId },
      relations: ['student'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Получить статистику платежей для создателя
   */
  async getCreatorStats(
    creatorId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PaymentStats> {
    // Получаем все потоки создателя
    const streams = await this.streamRepository.find({
      where: { creatorId },
      select: ['id'],
    });

    const streamIds = streams.map(s => s.id);

    if (streamIds.length === 0) {
      return {
        totalRevenue: 0,
        totalPayments: 0,
        completedPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        averagePayment: 0,
      };
    }

    // Базовый запрос
    let queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.streamId IN (:...streamIds)', { streamIds });

    // Фильтр по датам
    if (startDate && endDate) {
      queryBuilder = queryBuilder.andWhere(
        'payment.createdAt BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    const payments = await queryBuilder.getMany();

    const completedPayments = payments.filter(p => p.status === 'completed');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const failedPayments = payments.filter(p => p.status === 'failed');

    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const averagePayment = completedPayments.length > 0
      ? Math.round(totalRevenue / completedPayments.length)
      : 0;

    return {
      totalRevenue,
      totalPayments: payments.length,
      completedPayments: completedPayments.length,
      pendingPayments: pendingPayments.length,
      failedPayments: failedPayments.length,
      averagePayment,
    };
  }

  /**
   * Получить статистику по потоку
   */
  async getStreamStats(streamId: string, creatorId: string): Promise<PaymentStats> {
    const stream = await this.streamRepository.findOne({
      where: { id: streamId },
    });

    if (!stream || stream.creatorId !== creatorId) {
      throw new ForbiddenException('Нет доступа');
    }

    const payments = await this.paymentRepository.find({
      where: { streamId },
    });

    const completedPayments = payments.filter(p => p.status === 'completed');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const failedPayments = payments.filter(p => p.status === 'failed');

    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const averagePayment = completedPayments.length > 0
      ? Math.round(totalRevenue / completedPayments.length)
      : 0;

    return {
      totalRevenue,
      totalPayments: payments.length,
      completedPayments: completedPayments.length,
      pendingPayments: pendingPayments.length,
      failedPayments: failedPayments.length,
      averagePayment,
    };
  }

  /**
   * Получить платёж по ID
   */
  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['student', 'stream', 'promoCode'],
    });

    if (!payment) {
      throw new NotFoundException('Платёж не найден');
    }

    return payment;
  }
}

