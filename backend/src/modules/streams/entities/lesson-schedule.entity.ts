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
import { Lesson } from '../../courses/entities/lesson.entity';
import { Stream } from './stream.entity';

/**
 * LessonSchedule entity - v3.0
 * Расписание открытия уроков для конкретного потока
 * Cron проверяет эту таблицу и открывает уроки по времени
 */
@Entity('lesson_schedules')
@Unique(['lessonId', 'streamId']) // Один урок = одна дата открытия в потоке
export class LessonSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  lessonId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  @Column({ type: 'uuid' })
  @Index()
  streamId: string;

  @ManyToOne(() => Stream, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'streamId' })
  stream: Stream;

  /**
   * Дата и время открытия урока
   */
  @Column({ type: 'datetime' })
  @Index()
  scheduledOpenAt: Date;

  /**
   * Открыт ли урок (устанавливается cron'ом)
   */
  @Column({ type: 'boolean', default: false })
  isOpened: boolean;

  /**
   * Отправлены ли уведомления ученикам
   */
  @Column({ type: 'boolean', default: false })
  notificationSent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

