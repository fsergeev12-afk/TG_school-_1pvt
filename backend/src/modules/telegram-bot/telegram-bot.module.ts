import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramBotGateway } from './telegram-bot.gateway';
import { TelegramBotController } from './telegram-bot.controller';
import { UsersModule } from '../users/users.module';
import { ChatsModule } from '../chats/chats.module';
import { StreamStudent } from '../streams/entities/stream-student.entity';

@Module({
  imports: [
    ConfigModule, 
    UsersModule,
    forwardRef(() => ChatsModule),
    TypeOrmModule.forFeature([StreamStudent]),
  ],
  controllers: [TelegramBotController],
  providers: [TelegramBotService, TelegramBotGateway],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}


