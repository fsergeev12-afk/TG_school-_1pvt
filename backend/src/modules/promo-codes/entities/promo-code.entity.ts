import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Stream } from '../../streams/entities/stream.entity';

/**
 * PromoCode entity - v3.0
 * Промокоды привязаны к конкретному потоку
 * 3 типа: free (100% скидка), percent_discount (%), fixed_discount (₽)
 */
@Entity('promo_codes')
@Unique(['streamId', 'code']) // Код уникален в рамках потока
export class PromoCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Привязка к потоку
   */
  @Column({ type: 'uuid' })
  @Index()
  streamId: string;

  @ManyToOne(() => Stream, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'streamId' })
  stream: Stream;

  /**
   * Код промокода (вводит создатель или генерируется)
   */
  @Column({ type: 'varchar', length: 50 })
  @Index()
  code: string;

  /**
   * Тип промокода:
   * - 'free' - бесплатный доступ (100% скидка)
   * - 'percent_discount' - скидка в процентах
   * - 'fixed_discount' - фиксированная скидка в рублях
   */
  @Column({ type: 'varchar', length: 20 })
  type: string;

  /**
   * Значение скидки:
   * - Для percent_discount: % (например, 20 = 20%)
   * - Для fixed_discount: сумма в рублях (например, 500 = 500₽)
   * - Для free: null
   */
  @Column({ type: 'int', nullable: true })
  discountValue: number;

  /**
   * Срок действия (null = бессрочно)
   */
  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date;

  /**
   * Лимит использований (null = неограниченно)
   */
  @Column({ type: 'int', nullable: true })
  usageLimit: number;

  /**
   * Счётчик использований
   */
  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



