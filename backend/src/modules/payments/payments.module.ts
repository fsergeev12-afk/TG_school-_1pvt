import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Payment } from './entities/payment.entity';

// Services
import { PaymentsService } from './payments.service';

// Controllers
import {
  PaymentsController,
  PaymentsPublicController,
  PaymentsWebhookController,
} from './payments.controller';

// Related modules
import { AuthModule } from '../auth/auth.module';
import { PromoCodesModule } from '../promo-codes/promo-codes.module';

// Related entities
import { Stream } from '../streams/entities/stream.entity';
import { StreamStudent } from '../streams/entities/stream-student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Stream,
      StreamStudent,
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => PromoCodesModule),
  ],
  controllers: [
    PaymentsController,
    PaymentsPublicController,
    PaymentsWebhookController,
  ],
  providers: [
    PaymentsService,
  ],
  exports: [
    PaymentsService,
  ],
})
export class PaymentsModule {}

