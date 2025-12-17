import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';

/**
 * Message entity - v3.0
 * Сообщение в диалоге между создателем и учеником
 */
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  /**
   * Тип отправителя:
   * - 'creator' - сообщение от создателя
   * - 'student' - сообщение от ученика
   */
  @Column({ type: 'varchar', length: 20 })
  senderType: string;

  /**
   * Текст сообщения
   */
  @Column({ type: 'text' })
  text: string;

  /**
   * ID сообщения в Telegram (для сообщений от ученика)
   */
  @Column({ type: 'bigint', nullable: true })
  telegramMessageId: number;

  /**
   * Прочитано ли сообщение создателем
   * (актуально только для сообщений от ученика)
   */
  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}

