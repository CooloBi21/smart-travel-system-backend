import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PlatformSettingsRepository,
  PlatformSettingsRecord,
  UpdatePlatformSettingsInput,
} from './repositories/platform-settings.repository';

@Injectable()
export class PlatformSettingsService {
  constructor(
    private readonly platformSettingsRepository: PlatformSettingsRepository,
  ) {}

  async getSettings(): Promise<PlatformSettingsRecord> {
    const settings =
      await this.platformSettingsRepository.find();

    if (!settings) {
      throw new NotFoundException(
        'Platform settings not found.',
      );
    }

    return settings;
  }

  async updateSettings(
    input: UpdatePlatformSettingsInput,
  ): Promise<PlatformSettingsRecord> {
    const current =
      await this.platformSettingsRepository.find();

    if (!current) {
      throw new NotFoundException(
        'Platform settings not found.',
      );
    }

    const updated =
      await this.platformSettingsRepository.update(input);

    if (!updated) {
      throw new NotFoundException(
        'Platform settings not found.',
      );
    }

    return updated;
  }
}
