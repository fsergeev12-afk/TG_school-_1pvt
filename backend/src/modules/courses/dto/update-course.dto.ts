import { IsString, IsOptional, IsBoolean, MaxLength, MinLength } from 'class-validator';

/**
 * DTO для обновления курса
 */
export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}



