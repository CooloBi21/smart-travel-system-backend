import {
  IsEmail,
  IsInt,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  @Min(1)
  tourDepartureId!: number;

  @IsInt()
  @Min(1)
  guestCount!: number;

  @IsString()
  @MinLength(1)
  contactName!: string;

  @IsEmail()
  contactEmail!: string;

  @IsPhoneNumber('VN')
  contactPhone!: string;

  @IsOptional()
  @IsString()
  specialRequest?: string;
}
