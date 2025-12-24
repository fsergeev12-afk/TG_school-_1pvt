import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Stream } from '../../streams/entities/stream.entity';
import { StreamStudent } from '../../streams/entities/stream-student.entity';
import { Message } from './message.entity';

/**
 * Conversation entity - v3.0
 * Диалог между создателем и учеником
 * Сообщения приходят через Telegram Bot и отображаются на вкладке "Чаты"
 */
@Entity('conversations')
@Unique(['creatorId', 'telegramChatId']) // Один диалог на пару создатель-telegram_chat
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Создатель курса (владелец чата)
   */
  @Column({ type: 'uuid' })
  @Index()
  creatorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  /**
   * Ученик (может быть null для "рандомных" людей)
   * Становится не-null после оплаты/добавления в поток
   */
  @Column({ type: 'uuid', nullable: true })
  @Index()
  studentId: string;

  @ManyToOne(() => StreamStudent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'studentId' })
  student: StreamStudent;

  /**
   * Поток (может быть null если ученик не привязан к потоку)
   */
  @Column({ type: 'uuid', nullable: true })
  @Index()
  streamId: string;

  @ManyToOne(() => Stream, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'streamId' })
  stream: Stream;

  /**
   * Telegram chat_id ученика (для отправки ответов)
   */
  @Column({ type: 'bigint' })
  @Index()
  telegramChatId: number;

  /**
   * Telegram данные ученика (для отображения)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  telegramUsername: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  telegramFirstName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  telegramLastName: string;

  /**
   * Время последнего сообщения (для сортировки)
   */
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  lastMessageAt: Date;

  /**
   * Количество непрочитанных сообщений от ученика
   */
  @Column({ type: 'int', default: 0 })
  unreadCount: number;

  @OneToMany(() => Message, (message) => message.conversation, { cascade: true })
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


