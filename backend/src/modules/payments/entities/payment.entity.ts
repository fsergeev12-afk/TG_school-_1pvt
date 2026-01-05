import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { StreamStudent } from '../../streams/entities/stream-student.entity';
import { Stream } from '../../streams/entities/stream.entity';
import { PromoCode } from '../../promo-codes/entities/promo-code.entity';

/**
 * Payment entity - v3.0
 * Запись о платеже ученика за доступ к курсу
 */
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Ученик в потоке
   */
  @Column({ type: 'uuid' })
  @Index()
  studentId: string;

  @ManyToOne(() => StreamStudent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: StreamStudent;

  @Column({ type: 'uuid' })
  @Index()
  streamId: string;

  @ManyToOne(() => Stream, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'streamId' })
  stream: Stream;

  /**
   * Сумма платежа в копейках
   * 0 = бесплатный доступ (промокод)
   */
  @Column({ type: 'int', default: 0 })
  amount: number;

  /**
   * Оригинальная цена до скидки (в копейках)
   */
  @Column({ type: 'int', default: 0 })
  originalAmount: number;

  /**
   * Скидка (в копейках)
   */
  @Column({ type: 'int', default: 0 })
  discountAmount: number;

  @Column({ type: 'varchar', length: 10, default: 'RUB' })
  currency: string;

  /**
   * Промокод (если использован)
   */
  @Column({ type: 'uuid', nullable: true })
  promoCodeId: string;

  @ManyToOne(() => PromoCode, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'promoCodeId' })
  promoCode: PromoCode;

  /**
   * Статус платежа:
   * - 'pending' - ожидает оплаты
   * - 'completed' - успешно оплачено
   * - 'failed' - ошибка оплаты
   * - 'refunded' - возврат
   */
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  @Index()
  status: string;

  /**
   * Дата завершения платежа
   */
  @Column({ type: 'timestamp', nullable: true })
  @Index()
  completedAt: Date;

  /**
   * ID транзакции у платёжного провайдера
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  externalPaymentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



