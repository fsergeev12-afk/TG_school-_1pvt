import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { StreamStudent } from '../../streams/entities/stream-student.entity';
import { Stream } from '../../streams/entities/stream.entity';

/**
 * Notification entity - v3.0
 * Логирование отправленных уведомлений через Telegram Bot
 */
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Ученик, которому отправлено уведомление
   */
  @Column({ type: 'uuid' })
  @Index()
  studentId: string;

  @ManyToOne(() => StreamStudent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: StreamStudent;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  streamId: string;

  @ManyToOne(() => Stream, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'streamId' })
  stream: Stream;

  /**
   * Тип уведомления:
   * - 'welcome' - приветствие после активации
   * - 'lesson_opened' - урок открылся по расписанию
   * - 'broadcast' - рассылка от создателя
   * - 'creator_reply' - ответ создателя в чате
   * - 'payment_reminder' - напоминание об оплате
   * - 'payment_error' - ошибка оплаты
   */
  @Column({ type: 'varchar', length: 50 })
  @Index()
  type: string;

  /**
   * Заголовок уведомления
   */
  @Column({ type: 'varchar', length: 500 })
  title: string;

  /**
   * Текст уведомления
   */
  @Column({ type: 'text' })
  message: string;

  /**
   * Статус отправки:
   * - 'pending' - ожидает отправки
   * - 'sent' - отправлено
   * - 'failed' - ошибка
   */
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  @Index()
  status: string;

  /**
   * Telegram message_id (для возможного редактирования)
   */
  @Column({ type: 'bigint', nullable: true })
  telegramMessageId: number;

  /**
   * Время отправки
   */
  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  /**
   * Сообщение об ошибке (если failed)
   */
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}



