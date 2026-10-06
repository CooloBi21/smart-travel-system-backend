import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';

import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { RecommendationRepository } from './repositories/recommendation.repository';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
  ],
  controllers: [
    RecommendationController,
  ],
  providers: [
    RecommendationService,
    RecommendationRepository,
  ],
  exports: [
    RecommendationService,
    RecommendationRepository,
  ],
})
export class RecommendationModule {}
