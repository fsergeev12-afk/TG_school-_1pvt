import {
  IsInt,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';

/**
 * DTO для добавления ученика в поток
 */
export class AddStudentDto {
  /**
   * Telegram ID ученика
   */
  @IsInt()
  telegramId: number;

  /**
   * Telegram username (опционально)
   */
  @IsString()
  @IsOptional()
  @MaxLength(255)
  telegramUsername?: string;

  /**
   * Имя в Telegram
   */
  @IsString()
  @IsOptional()
  @MaxLength(255)
  telegramFirstName?: string;

  /**
   * Фамилия в Telegram
   */
  @IsString()
  @IsOptional()
  @MaxLength(255)
  telegramLastName?: string;
}

/**
 * DTO для массового добавления учеников
 */
export class BulkAddStudentsDto {
  /**
   * Массив Telegram ID учеников
   */
  @IsInt({ each: true })
  telegramIds: number[];
}

