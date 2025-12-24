import {
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Расписание для одного урока
 */
export class LessonScheduleItemDto {
  @IsString()
  lessonId: string;

  @IsDateString()
  scheduledOpenAt: string;
}

/**
 * DTO для создания расписания потока
 */
export class CreateScheduleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonScheduleItemDto)
  schedules: LessonScheduleItemDto[];
}

/**
 * DTO для обновления расписания одного урока
 */
export class UpdateLessonScheduleDto {
  @IsDateString()
  @IsOptional()
  scheduledOpenAt?: string;
}


