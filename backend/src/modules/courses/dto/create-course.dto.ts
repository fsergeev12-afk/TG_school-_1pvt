import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

/**
 * DTO для создания курса
 */
export class CreateCourseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;
}



