import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

// Services
import { FilesService } from './files.service';

// Controllers
import { FilesController } from './files.controller';

// Related modules
import { AuthModule } from '../auth/auth.module';
import { TelegramBotModule } from '../telegram-bot/telegram-bot.module';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      storage: memoryStorage(), // Храним в памяти для последующей обработки
    }),
    forwardRef(() => AuthModule),
    forwardRef(() => TelegramBotModule),
  ],
  controllers: [
    FilesController,
  ],
  providers: [
    FilesService,
  ],
  exports: [
    FilesService,
  ],
})
export class FilesModule {}

