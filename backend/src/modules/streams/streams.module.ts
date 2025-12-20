import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Entities
import { Stream } from './entities/stream.entity';
import { StreamStudent } from './entities/stream-student.entity';
import { LessonSchedule } from './entities/lesson-schedule.entity';

// Services
import { StreamsService } from './streams.service';
import { StreamStudentsService } from './stream-students.service';
import { LessonScheduleService } from './lesson-schedule.service';

// Controllers
import { StreamsController } from './streams.controller';
import { StreamStudentsController, StudentActivationController } from './stream-students.controller';
import { LessonScheduleController, LessonAccessController } from './lesson-schedule.controller';

// Related modules
import { AuthModule } from '../auth/auth.module';
import { CoursesModule } from '../courses/courses.module';
import { UsersModule } from '../users/users.module';

// Related entities (для связей)
import { Course } from '../courses/entities/course.entity';
import { Lesson } from '../courses/entities/lesson.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Stream,
      StreamStudent,
      LessonSchedule,
      Course, // Для проверки владения курсом
      Lesson, // Для работы с расписанием
    ]),
    ConfigModule,
    forwardRef(() => AuthModule),
    forwardRef(() => CoursesModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [
    StreamsController,
    StreamStudentsController,
    StudentActivationController,
    LessonScheduleController,
    LessonAccessController,
  ],
  providers: [
    StreamsService,
    StreamStudentsService,
    LessonScheduleService,
  ],
  exports: [
    StreamsService,
    StreamStudentsService,
    LessonScheduleService,
  ],
})
export class StreamsModule {}


