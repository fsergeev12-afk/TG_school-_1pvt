import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramBotGateway } from './telegram-bot.gateway';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ConfigModule, UsersModule],
  providers: [TelegramBotService, TelegramBotGateway],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}


