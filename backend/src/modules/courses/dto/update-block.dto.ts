import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

/**
 * DTO для обновления блока
 */
export class UpdateBlockDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}


