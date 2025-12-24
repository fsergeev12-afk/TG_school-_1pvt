import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { PromoCode } from './promo-code.entity';
import { StreamStudent } from '../../streams/entities/stream-student.entity';

/**
 * PromoCodeUsage entity - v3.0
 * Учёт использований промокодов
 * Один ученик может использовать один промокод только один раз
 */
@Entity('promo_code_usages')
@Unique(['promoCodeId', 'studentId']) // Один промокод = одно использование на ученика
export class PromoCodeUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  promoCodeId: string;

  @ManyToOne(() => PromoCode, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promoCodeId' })
  promoCode: PromoCode;

  /**
   * ID записи stream_student (не user!)
   */
  @Column({ type: 'uuid' })
  @Index()
  studentId: string;

  @ManyToOne(() => StreamStudent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: StreamStudent;

  /**
   * Время использования промокода
   */
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  usedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}


