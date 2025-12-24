import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { typeOrmConfig } from './config/typeorm.config';

// Модули приложения
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TelegramBotModule } from './modules/telegram-bot/telegram-bot.module';
import { CoursesModule } from './modules/courses/courses.module';
import { StreamsModule } from './modules/streams/streams.module';
import { PromoCodesModule } from './modules/promo-codes/promo-codes.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ChatsModule } from './modules/chats/chats.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    // Конфигурация
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // База данных (SQLite)
    TypeOrmModule.forRoot(typeOrmConfig),

    // Статические файлы (uploads)
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      exclude: ['/api/*'],
    }),

    // Модули приложения
    AuthModule,
    UsersModule,
    TelegramBotModule,
    CoursesModule, // ✅ Фаза 3
    StreamsModule, // ✅ Фаза 4
    PromoCodesModule, // ✅ Фаза 5
    PaymentsModule, // ✅ Фаза 6
    ChatsModule, // ✅ Фаза 7
    NotificationsModule, // ✅ Фаза 8
    FilesModule, // ✅ Фаза 9
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}


