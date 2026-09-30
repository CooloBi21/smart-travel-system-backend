import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateDepartureDto {
  @IsOptional()
  @IsDateString()
  departureDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerPerson?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
