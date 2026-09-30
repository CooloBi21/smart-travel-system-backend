import {
  IsDateString,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateDepartureDto {
  @IsDateString()
  departureDate!: string;

  @IsNumber()
  @Min(0)
  pricePerPerson!: number;

  @IsInt()
  @Min(1)
  capacity!: number;
}
