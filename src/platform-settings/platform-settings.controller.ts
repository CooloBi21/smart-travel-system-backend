import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { PlatformSettingsService } from './platform-settings.service';

@Controller('platform/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN')
export class PlatformSettingsController {
  constructor(
    private readonly platformSettingsService: PlatformSettingsService,
  ) {}

  @Get()
  async getSettings() {
    return this.platformSettingsService.getSettings();
  }

  @Patch()
  async updateSettings(
    @Body() dto: UpdatePlatformSettingsDto,
  ) {
    return this.platformSettingsService.updateSettings({
      platformName: dto.platformName?.trim(),
      platformDescription:
        dto.platformDescription?.trim(),
      supportEmail: dto.supportEmail?.trim(),
      defaultLanguage: dto.defaultLanguage,
      defaultCurrency: dto.defaultCurrency,
      maintenanceMode: dto.maintenanceMode,
      allowCustomerRegistration:
        dto.allowCustomerRegistration,
    });
  }
}
