import { IsNotEmpty, IsNumber, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsNumber()
  telegramId: number;

  @IsOptional()
  @IsString()
  telegramUsername?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['creator', 'student'])
  role: string;
}


