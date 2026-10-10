import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('platform')
  @Roles('PLATFORM_ADMIN')
  async getPlatformAnalytics() {
    return this.analyticsService.getPlatformAnalytics();
  }
}
