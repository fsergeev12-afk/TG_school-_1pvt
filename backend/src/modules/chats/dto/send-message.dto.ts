import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO для отправки сообщения от создателя
 */
export class SendMessageDto {
  /**
   * ID диалога
   */
  @IsString()
  conversationId: string;

  /**
   * Текст сообщения
   */
  @IsString()
  @MinLength(1)
  @MaxLength(4096) // Лимит Telegram
  text: string;
}

/**
 * DTO для ответа на сообщение
 */
export class ReplyMessageDto {
  /**
   * Текст ответа
   */
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  text: string;
}

