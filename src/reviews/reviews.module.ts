import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { BookingsModule } from '../bookings/bookings.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsRepository } from './repositories/reviews.repository';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    BookingsModule,
    AiModule,
  ],
  controllers: [ReviewsController],
  providers: [
    ReviewsRepository,
    ReviewsService,
  ],
  exports: [ReviewsService],
})
export class ReviewsModule {}
