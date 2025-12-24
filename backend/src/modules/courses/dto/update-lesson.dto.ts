import { IsString, IsOptional, IsIn, IsInt, MaxLength, MinLength, Min } from 'class-validator';

/**
 * DTO для обновления урока
 */
export class UpdateLessonDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  /**
   * Тип видео: 'telegram' | 'external' | null
   */
  @IsString()
  @IsOptional()
  @IsIn(['telegram', 'external'])
  videoType?: string;

  /**
   * Telegram file_id (для videoType = 'telegram')
   */
  @IsString()
  @IsOptional()
  videoTelegramFileId?: string;

  /**
   * Внешняя ссылка на видео (для videoType = 'external')
   */
  @IsString()
  @IsOptional()
  videoExternalUrl?: string;

  /**
   * Длительность видео в секундах
   */
  @IsInt()
  @IsOptional()
  @Min(0)
  videoDuration?: number;
}


