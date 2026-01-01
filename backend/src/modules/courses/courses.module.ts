import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Course } from './entities/course.entity';
import { Block } from './entities/block.entity';
import { Lesson } from './entities/lesson.entity';
import { LessonMaterial } from './entities/lesson-material.entity';

// Entities from other modules (for StudentCourseController and cascade delete)
import { Stream } from '../streams/entities/stream.entity';
import { StreamStudent } from '../streams/entities/stream-student.entity';
import { LessonSchedule } from '../streams/entities/lesson-schedule.entity';

// Services
import { CoursesService } from './courses.service';
import { BlocksService } from './blocks.service';
import { LessonsService } from './lessons.service';
import { LessonMaterialsService } from './lesson-materials.service';

// Controllers
import { CoursesController } from './courses.controller';
import { BlocksController, BlockController } from './blocks.controller';
import { LessonsController, LessonController } from './lessons.controller';
import { StudentCourseController } from './student-course.controller';

// Auth module for guards
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, Block, Lesson, LessonMaterial, Stream, StreamStudent, LessonSchedule]),
    forwardRef(() => AuthModule), // Для TelegramAuthGuard
    forwardRef(() => UsersModule), // Для UsersService в guard
  ],
  controllers: [
    CoursesController,
    BlocksController,
    BlockController,
    LessonsController,
    LessonController,
    StudentCourseController,
  ],
  providers: [
    CoursesService,
    BlocksService,
    LessonsService,
    LessonMaterialsService,
  ],
  exports: [
    CoursesService,
    BlocksService,
    LessonsService,
    LessonMaterialsService,
  ],
})
export class CoursesModule {}

