import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  sessionId?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;
}
