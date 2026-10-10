import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';

import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './repositories/bookings.repository';

@Module({
  imports: [
    AuthModule,
    RealtimeModule,
  ],

  controllers: [
    BookingsController,
  ],

  providers: [
    BookingsService,
    BookingsRepository,
  ],

  exports: [
    BookingsRepository,
  ],
})
export class BookingsModule {}
