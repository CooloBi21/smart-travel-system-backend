import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateCompanyBookingStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
  status!: string;
}
