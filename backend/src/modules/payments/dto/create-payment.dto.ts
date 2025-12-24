import {
  IsString,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

/**
 * DTO для создания платежа (внутреннее использование)
 */
export class CreatePaymentDto {
  /**
   * ID ученика в потоке
   */
  @IsString()
  studentId: string;

  /**
   * ID потока
   */
  @IsString()
  streamId: string;

  /**
   * Сумма платежа в копейках
   */
  @IsInt()
  @Min(0)
  amount: number;

  /**
   * Исходная сумма (до скидки)
   */
  @IsInt()
  @Min(0)
  originalAmount: number;

  /**
   * Сумма скидки
   */
  @IsInt()
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  /**
   * ID использованного промокода
   */
  @IsString()
  @IsOptional()
  promoCodeId?: string;
}

/**
 * DTO для инициации платежа (от клиента)
 */
export class InitPaymentDto {
  /**
   * ID потока для оплаты
   */
  @IsString()
  streamId: string;

  /**
   * Код промокода (опционально)
   */
  @IsString()
  @IsOptional()
  promoCode?: string;
}


