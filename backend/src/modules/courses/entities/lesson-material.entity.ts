import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Lesson } from './lesson.entity';

/**
 * LessonMaterial entity - v3.0
 * Материалы к уроку (PDF, DOC файлы до 50MB)
 * Хранятся в Telegram через Bot API
 */
@Entity('lesson_materials')
export class LessonMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  lessonId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  /**
   * Оригинальное имя файла
   */
  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  /**
   * Тип файла: 'pdf' | 'doc' | 'docx'
   */
  @Column({ type: 'varchar', length: 10 })
  fileType: string;

  /**
   * Размер файла в байтах
   */
  @Column({ type: 'int' })
  fileSizeBytes: number;

  /**
   * Telegram file_id для скачивания
   */
  @Column({ type: 'varchar', length: 255 })
  telegramFileId: string;

  /**
   * Порядок отображения
   */
  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}

