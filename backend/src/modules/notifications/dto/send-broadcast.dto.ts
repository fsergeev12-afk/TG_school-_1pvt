import {
  IsString,
  IsOptional,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO для broadcast рассылки
 */
export class SendBroadcastDto {
  /**
   * ID потока для рассылки
   */
  @IsString()
  streamId: string;

  /**
   * Текст сообщения
   */
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  message: string;

  /**
   * Фильтр по статусу оплаты
   * - 'all' - все ученики
   * - 'paid' - только оплатившие
   * - 'unpaid' - только неоплатившие
   */
  @IsString()
  @IsOptional()
  paymentFilter?: 'all' | 'paid' | 'unpaid';

  /**
   * Фильтр по статусу активации
   * - 'all' - все
   * - 'activated' - только активированные
   * - 'invited' - только приглашённые
   */
  @IsString()
  @IsOptional()
  activationFilter?: 'all' | 'activated' | 'invited';
}

/**
 * DTO для создания уведомления
 */
export class CreateNotificationDto {
  @IsString()
  studentId: string;

  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsString()
  message: string;
}


