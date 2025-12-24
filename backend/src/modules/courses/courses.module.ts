import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Course } from './entities/course.entity';
import { Block } from './entities/block.entity';
import { Lesson } from './entities/lesson.entity';
import { LessonMaterial } from './entities/lesson-material.entity';

// Services
import { CoursesService } from './courses.service';
import { BlocksService } from './blocks.service';
import { LessonsService } from './lessons.service';
import { LessonMaterialsService } from './lesson-materials.service';

// Controllers
import { CoursesController } from './courses.controller';
import { BlocksController, BlockController } from './blocks.controller';
import { LessonsController, LessonController } from './lessons.controller';

// Auth module for guards
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, Block, Lesson, LessonMaterial]),
    forwardRef(() => AuthModule), // Для TelegramAuthGuard
    forwardRef(() => UsersModule), // Для UsersService в guard
  ],
  controllers: [
    CoursesController,
    BlocksController,
    BlockController,
    LessonsController,
    LessonController,
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

