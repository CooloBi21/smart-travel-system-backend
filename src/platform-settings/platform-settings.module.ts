import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { PlatformSettingsController } from './platform-settings.controller';
import { PlatformSettingsService } from './platform-settings.service';
import { PlatformSettingsRepository } from './repositories/platform-settings.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [PlatformSettingsController],
  providers: [
    PlatformSettingsService,
    PlatformSettingsRepository,
  ],
  exports: [
    PlatformSettingsService,
    PlatformSettingsRepository,
  ],
})
export class PlatformSettingsModule {}
