import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsDateString,
  MaxLength,
  MinLength,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO для расписания урока
 */
export class LessonScheduleItemDto {
  @IsString()
  lessonId: string;

  @IsDateString()
  scheduledOpenAt: string;
}

/**
 * DTO для создания потока
 */
export class CreateStreamDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  /**
   * ID курса, к которому привязан поток
   */
  @IsString()
  courseId: string;

  /**
   * Цена курса в копейках (по умолчанию 3000 = 30₽)
   */
  @IsInt()
  @IsOptional()
  @Min(0)
  price?: number;

  /**
   * Дата начала потока (для автоматического расписания)
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
   * Расписание уроков (при scheduleEnabled=true)
   */
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LessonScheduleItemDto)
  lessonSchedules?: LessonScheduleItemDto[];
}



