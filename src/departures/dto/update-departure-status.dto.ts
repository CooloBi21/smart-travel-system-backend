import { IsIn } from 'class-validator';
import { DepartureStatus } from '../repositories/departures.repository';

export class UpdateDepartureStatusDto {
  @IsIn([
    'SCHEDULED',
    'CLOSED',
    'CANCELLED',
    'COMPLETED',
  ])
  status!: DepartureStatus;
}
