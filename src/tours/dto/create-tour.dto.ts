import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';

export type TravelStyle =
  | 'BEACH'
  | 'CULTURE'
  | 'EXPLORE'
  | 'RELAX'
  | 'ADVENTURE';

export class CreateTourDto {
  @IsInt()
  @Min(1)
  destinationId!: number;

  @IsInt()
  @Min(1)
  categoryId!: number;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(2)
  @Matches(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    {
      message:
        'slug chỉ được chứa chữ thường, số và dấu gạch ngang.',
    },
  )
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  durationDays!: number;

  @IsString()
  @IsIn([
    'BEACH',
    'CULTURE',
    'EXPLORE',
    'RELAX',
    'ADVENTURE',
  ])
  travelStyle!: TravelStyle;

  @IsOptional()
  @IsString()
  cancellationPolicy?: string;
}
