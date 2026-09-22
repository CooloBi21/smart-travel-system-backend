import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { ActiveCompanyGuard } from './guards/active-company.guard';
import { CompaniesRepository } from './repositories/companies.repository';

@Module({
  imports: [
    AuthModule,
  ],
  controllers: [
    CompaniesController,
  ],
  providers: [
    CompaniesService,
    CompaniesRepository,
    ActiveCompanyGuard,
  ],
  exports: [
    CompaniesService,
    CompaniesRepository,
    ActiveCompanyGuard,
  ],
})
export class CompaniesModule {}
