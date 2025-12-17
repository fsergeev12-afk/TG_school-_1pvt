import {
  IsString,
  IsInt,
  IsOptional,
  IsIn,
} from 'class-validator';

/**
 * DTO для callback от платёжной системы
 * Формат зависит от конкретного провайдера (ЮKassa, CloudPayments и др.)
 */
export class PaymentCallbackDto {
  /**
   * ID платежа в нашей системе
   */
  @IsString()
  paymentId: string;

  /**
   * ID транзакции у провайдера
   */
  @IsString()
  externalPaymentId: string;

  /**
   * Статус платежа
   */
  @IsString()
  @IsIn(['succeeded', 'failed', 'pending', 'canceled'])
  status: string;

  /**
   * Сумма платежа (для верификации)
   */
  @IsInt()
  @IsOptional()
  amount?: number;

  /**
   * Дополнительные данные от провайдера
   */
  @IsString()
  @IsOptional()
  metadata?: string;
}

/**
 * DTO для ручного подтверждения платежа (для MVP)
 */
export class ManualPaymentConfirmDto {
  /**
   * ID ученика
   */
  @IsString()
  studentId: string;

  /**
   * Комментарий (например, номер чека)
   */
  @IsString()
  @IsOptional()
  comment?: string;
}

