import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdatePlatformSettingsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  platformName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  platformDescription?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  supportEmail?: string;

  @IsOptional()
  @IsString()
  @IsIn(['vi-VN', 'en-US'])
  defaultLanguage?: string;

  @IsOptional()
  @IsString()
  @IsIn(['VND', 'USD'])
  defaultCurrency?: string;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsBoolean()
  allowCustomerRegistration?: boolean;
}
