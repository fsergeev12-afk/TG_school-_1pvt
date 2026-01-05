import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Generated,
  Unique,
} from 'typeorm';
import { Stream } from './stream.entity';
import { User } from '../../users/entities/user.entity';

/**
 * StreamStudent entity - v3.0
 * Ученик в потоке с двумя независимыми статусами:
 * - invitationStatus: 'invited' | 'activated'
 * - paymentStatus: 'unpaid' | 'paid'
 */
@Entity('stream_students')
@Unique(['streamId', 'telegramId']) // Один ученик может быть в потоке только один раз
export class StreamStudent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  streamId: string;

  @ManyToOne(() => Stream, (stream) => stream.students, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'streamId' })
  stream: Stream;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  userId: string; // связь с User после активации

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Telegram ID ученика (для защиты от складчины)
   * Уникален в рамках потока
   */
  @Column({ type: 'bigint' })
  @Index()
  telegramId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  telegramUsername: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  telegramFirstName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  telegramLastName: string;

  /**
   * Статус приглашения:
   * - 'invited' - ссылка отправлена, ученик не перешёл
   * - 'activated' - ученик перешёл по ссылке
   */
  @Column({ type: 'varchar', length: 20, default: 'invited' })
  @Index()
  invitationStatus: string;

  /**
   * Статус оплаты:
   * - 'unpaid' - не оплачено
   * - 'paid' - оплачено (или применён бесплатный промокод)
   */
  @Column({ type: 'varchar', length: 20, default: 'unpaid' })
  @Index()
  paymentStatus: string;

  /**
   * ID последнего платежа
   */
  @Column({ type: 'uuid', nullable: true })
  paymentId: string;

  /**
   * Уникальный токен для доступа к курсу
   */
  @Column({ type: 'uuid', unique: true })
  @Generated('uuid')
  @Index()
  accessToken: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  invitedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  activatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



