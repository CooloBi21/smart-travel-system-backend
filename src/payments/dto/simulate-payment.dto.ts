import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class SimulatePaymentDto {
  @IsIn(['SUCCESS', 'FAILED'])
  result!: 'SUCCESS' | 'FAILED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  failureReason?: string;
}
