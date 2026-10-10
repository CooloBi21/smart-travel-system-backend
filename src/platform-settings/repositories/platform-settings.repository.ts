import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';

export interface PlatformSettingsRecord {
  id: number;
  platformName: string;
  platformDescription: string;
  supportEmail: string;
  defaultLanguage: string;
  defaultCurrency: string;
  maintenanceMode: boolean;
  allowCustomerRegistration: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdatePlatformSettingsInput {
  platformName?: string;
  platformDescription?: string;
  supportEmail?: string;
  defaultLanguage?: string;
  defaultCurrency?: string;
  maintenanceMode?: boolean;
  allowCustomerRegistration?: boolean;
}

@Injectable()
export class PlatformSettingsRepository {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async find(): Promise<PlatformSettingsRecord | null> {
    const result =
      await this.databaseService.query<PlatformSettingsRecord>(
        `
        SELECT
          id,
          platform_name AS "platformName",
          platform_description AS "platformDescription",
          support_email AS "supportEmail",
          default_language AS "defaultLanguage",
          default_currency AS "defaultCurrency",
          maintenance_mode AS "maintenanceMode",
          allow_customer_registration AS "allowCustomerRegistration",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM public.platform_settings
        WHERE id = 1
        LIMIT 1
        `,
      );

    return result.rows[0] ?? null;
  }

  async update(
    input: UpdatePlatformSettingsInput,
  ): Promise<PlatformSettingsRecord | null> {
    const result =
      await this.databaseService.query<PlatformSettingsRecord>(
        `
        UPDATE public.platform_settings
        SET
          platform_name = COALESCE($1, platform_name),
          platform_description = COALESCE(
            $2,
            platform_description
          ),
          support_email = COALESCE($3, support_email),
          default_language = COALESCE(
            $4,
            default_language
          ),
          default_currency = COALESCE(
            $5,
            default_currency
          ),
          maintenance_mode = COALESCE(
            $6,
            maintenance_mode
          ),
          allow_customer_registration = COALESCE(
            $7,
            allow_customer_registration
          ),
          updated_at = NOW()
        WHERE id = 1
        RETURNING
          id,
          platform_name AS "platformName",
          platform_description AS "platformDescription",
          support_email AS "supportEmail",
          default_language AS "defaultLanguage",
          default_currency AS "defaultCurrency",
          maintenance_mode AS "maintenanceMode",
          allow_customer_registration AS "allowCustomerRegistration",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        `,
        [
          input.platformName ?? null,
          input.platformDescription ?? null,
          input.supportEmail ?? null,
          input.defaultLanguage ?? null,
          input.defaultCurrency ?? null,
          input.maintenanceMode ?? null,
          input.allowCustomerRegistration ?? null,
        ],
      );

    return result.rows[0] ?? null;
  }
}
