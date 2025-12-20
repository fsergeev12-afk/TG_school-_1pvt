import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

// Services
import { ChatsService } from './chats.service';

// Controllers
import { ChatsController } from './chats.controller';

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
      Conversation,
      Message,
      Stream,
      StreamStudent,
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => TelegramBotModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [
    ChatsController,
  ],
  providers: [
    ChatsService,
  ],
  exports: [
    ChatsService,
  ],
})
export class ChatsModule {}


