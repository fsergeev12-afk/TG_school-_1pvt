import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { PromoCode } from './entities/promo-code.entity';
import { PromoCodeUsage } from './entities/promo-code-usage.entity';

// Services
import { PromoCodesService } from './promo-codes.service';

// Controllers
import { PromoCodesController, PromoCodesPublicController } from './promo-codes.controller';

// Related modules
import { AuthModule } from '../auth/auth.module';

// Related entities (для связей)
import { Stream } from '../streams/entities/stream.entity';
import { StreamStudent } from '../streams/entities/stream-student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PromoCode,
      PromoCodeUsage,
      Stream,
      StreamStudent,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [
    PromoCodesController,
    PromoCodesPublicController,
  ],
  providers: [
    PromoCodesService,
  ],
  exports: [
    PromoCodesService,
  ],
})
export class PromoCodesModule {}

