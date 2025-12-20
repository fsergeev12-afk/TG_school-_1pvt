import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { Notification } from './entities/notification.entity';
import { LessonSchedule } from '../streams/entities/lesson-schedule.entity';

// Services
import { NotificationsService } from './notifications.service';
import { ScheduleCronService } from './schedule-cron.service';

// Controllers
import { NotificationsController } from './notifications.controller';

// Related modules
import { AuthModule } from '../auth/auth.module';
import { TelegramBotModule } from '../telegram-bot/telegram-bot.module';
import { UsersModule } from '../users/users.module';

// Related entities
import { Stream } from '../streams/entities/stream.entity';
import { StreamStudent } from '../streams/entities/stream-student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      LessonSchedule,
      Stream,
      StreamStudent,
    ]),
    ScheduleModule.forRoot(), // Включаем @nestjs/schedule
    forwardRef(() => AuthModule),
    forwardRef(() => TelegramBotModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [
    NotificationsController,
  ],
  providers: [
    NotificationsService,
    ScheduleCronService,
  ],
  exports: [
    NotificationsService,
  ],
})
export class NotificationsModule {}


