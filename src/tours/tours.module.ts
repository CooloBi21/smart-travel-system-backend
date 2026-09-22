import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { ToursController } from './tours.controller';
import { ToursRepository } from './repositories/tours.repository';
import { ToursService } from './tours.service';

@Module({
  imports: [
    AuthModule,
    CompaniesModule,
  ],
  controllers: [
    ToursController,
  ],
  providers: [
    ToursService,
    ToursRepository,
  ],
  exports: [
    ToursService,
    ToursRepository,
  ],
})
export class ToursModule {}
