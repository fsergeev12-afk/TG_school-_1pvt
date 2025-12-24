import {
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  IsDateString,
  MaxLength,
  MinLength,
  Min,
  Max,
  Matches,
} from 'class-validator';

/**
 * DTO для создания промокода
 */
export class CreatePromoCodeDto {
  /**
   * ID потока, к которому привязан промокод
   */
  @IsString()
  streamId: string;

  /**
   * Код промокода (латиница, цифры, без пробелов)
   * Пример: WELCOME2024, NEWYEAR, FREE100
   */
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[A-Z0-9_-]+$/i, {
    message: 'Код может содержать только латинские буквы, цифры, дефис и подчёркивание',
  })
  code: string;

  /**
   * Тип промокода:
   * - 'free' - полностью бесплатный доступ
   * - 'percent_discount' - скидка в процентах
   * - 'fixed_discount' - скидка в рублях
   */
  @IsString()
  @IsIn(['free', 'percent_discount', 'fixed_discount'])
  type: string;

  /**
   * Значение скидки:
   * - Для 'percent_discount': 1-100 (процент)
   * - Для 'fixed_discount': сумма в копейках
   * - Для 'free': игнорируется
   */
  @IsInt()
  @IsOptional()
  @Min(1)
  discountValue?: number;

  /**
   * Максимальное количество использований
   * null = безлимитный
   */
  @IsInt()
  @IsOptional()
  @Min(1)
  maxUsages?: number;

  /**
   * Срок действия промокода
   */
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  /**
   * Описание промокода (для создателя)
   */
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}


