import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO для применения промокода
 */
export class ApplyPromoCodeDto {
  /**
   * Код промокода
   */
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  code: string;

  /**
   * ID потока (для валидации)
   */
  @IsString()
  streamId: string;
}

/**
 * DTO для проверки промокода (без применения)
 */
export class ValidatePromoCodeDto {
  /**
   * Код промокода
   */
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  code: string;

  /**
   * ID потока
   */
  @IsString()
  streamId: string;
}

