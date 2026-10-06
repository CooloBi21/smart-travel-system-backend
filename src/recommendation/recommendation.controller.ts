import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/auth-user.interface';

import { RecommendationService } from './recommendation.service';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
  ) {}

  @Get()
  async getRecommendations(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.recommendationService.generateRecommendations(
      user.id,
    );
  }
}