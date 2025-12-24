import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO для обновления промокода
 */
export class UpdatePromoCodeDto {
  /**
   * Максимальное количество использований
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
   * Описание промокода
   */
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  /**
   * Активен ли промокод
   */
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


