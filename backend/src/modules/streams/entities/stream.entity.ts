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
  Generated,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';
import { StreamStudent } from './stream-student.entity';
import { LessonSchedule } from './lesson-schedule.entity';

/**
 * Stream entity - v3.0
 * Поток = группа учеников + один курс + настройки (расписание, доступы, уведомления)
 */
@Entity('streams')
export class Stream {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  creatorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column({ type: 'uuid' })
  @Index()
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  /**
   * Название потока (видит только создатель)
   * Пример: "Группа декабрь 2024"
   */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /**
   * Описание потока (опционально)
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Цена курса в копейках (3000 = 30₽)
   */
  @Column({ type: 'int', default: 0 })
  price: number;

  /**
   * Дата начала потока (для автоматического расписания)
   */
  @Column({ type: 'timestamp', nullable: true })
  startsAt: Date;

  /**
   * Включить расписание уроков
   * Если true - уроки открываются по датам из lesson_schedules
   */
  @Column({ type: 'boolean', default: false })
  scheduleEnabled: boolean;

  /**
   * Отправлять приветственное сообщение при активации
   */
  @Column({ type: 'boolean', default: true })
  sendWelcome: boolean;

  /**
   * Уведомлять при открытии урока (по расписанию)
   */
  @Column({ type: 'boolean', default: true })
  notifyOnLessonOpen: boolean;

  /**
   * Активен ли поток (для набора учеников)
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Общий токен приглашения для потока
   * Используется в ссылках: t.me/bot?start=TOKEN
   */
  @Column({ type: 'uuid' })
  @Generated('uuid')
  @Index()
  inviteToken: string;

  @OneToMany(() => StreamStudent, (student) => student.stream, { cascade: true })
  students: StreamStudent[];

  @OneToMany(() => LessonSchedule, (schedule) => schedule.stream, { cascade: true })
  schedules: LessonSchedule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date; // soft-delete
}



