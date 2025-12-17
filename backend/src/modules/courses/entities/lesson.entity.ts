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
import { Block } from './block.entity';
import { LessonMaterial } from './lesson-material.entity';

/**
 * Lesson entity - v3.0
 * Гибридное видео: загрузка до 50MB ИЛИ внешняя ссылка
 * AI-транскрибация удалена в v3.0
 */
@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  blockId: string;

  @ManyToOne(() => Block, (block) => block.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockId' })
  block: Block;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Тип видео: 'telegram' (загрузка) | 'external' (ссылка) | null (без видео)
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  videoType: string;

  /**
   * Telegram file_id для загруженного видео (до 50MB)
   * Используется когда videoType = 'telegram'
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  videoTelegramFileId: string;

  /**
   * Внешняя ссылка на видео (YouTube, Vimeo, Rutube и др.)
   * Используется когда videoType = 'external'
   */
  @Column({ type: 'text', nullable: true })
  videoExternalUrl: string;

  /**
   * Длительность видео в секундах (опционально)
   */
  @Column({ type: 'int', nullable: true })
  videoDuration: number;

  /**
   * Порядок отображения в блоке
   */
  @Column({ type: 'int', default: 0 })
  @Index()
  displayOrder: number;

  /**
   * Материалы к уроку (PDF, DOC)
   */
  @OneToMany(() => LessonMaterial, (material) => material.lesson, { cascade: true })
  materials: LessonMaterial[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



