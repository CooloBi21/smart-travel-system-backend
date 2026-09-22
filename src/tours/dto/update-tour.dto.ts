import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { TravelStyle } from './create-tour.dto';

export class UpdateTourDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  destinationId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @Matches(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    {
      message:
        'slug chỉ được chứa chữ thường, số và dấu gạch ngang.',
    },
  )
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsString()
  @IsIn([
    'BEACH',
    'CULTURE',
    'EXPLORE',
    'RELAX',
    'ADVENTURE',
  ])
  travelStyle?: TravelStyle;

  @IsOptional()
  @IsString()
  cancellationPolicy?: string;
}
