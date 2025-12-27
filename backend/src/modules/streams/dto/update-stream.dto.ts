import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsDateString,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';

/**
 * DTO для обновления потока
 */
export class UpdateStreamDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  /**
   * Цена курса в копейках
   */
  @IsInt()
  @IsOptional()
  @Min(0)
  price?: number;

  /**
   * Дата начала потока
   */
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  /**
   * Включить расписание открытия уроков
   */
  @IsBoolean()
  @IsOptional()
  scheduleEnabled?: boolean;

  /**
   * Отправлять приветственное сообщение
   */
  @IsBoolean()
  @IsOptional()
  sendWelcome?: boolean;

  /**
   * Уведомлять об открытии уроков
   */
  @IsBoolean()
  @IsOptional()
  notifyOnLessonOpen?: boolean;

  /**
   * Активен ли поток
   */
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}



