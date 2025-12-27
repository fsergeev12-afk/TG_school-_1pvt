import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

/**
 * DTO для создания блока
 */
export class CreateBlockDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}



