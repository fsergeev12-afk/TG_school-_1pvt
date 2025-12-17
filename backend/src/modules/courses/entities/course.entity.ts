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
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Block } from './block.entity';

/**
 * Course entity - v3.0
 * Курс создаётся один раз, переиспользуется в нескольких потоках
 */
@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  creatorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Обложка курса (JPG/PNG до 5MB)
   * Хранится URL из CDN/S3
   */
  @Column({ type: 'text', nullable: true })
  coverImageUrl: string;

  @Column({ type: 'boolean', default: false })
  @Index()
  isPublished: boolean;

  @OneToMany(() => Block, (block) => block.course, { cascade: true })
  blocks: Block[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date; // soft-delete
}



