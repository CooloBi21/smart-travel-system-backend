import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { DatabaseModule } from '../database/database.module';
import { ToursModule } from '../tours/tours.module';

import { DeparturesController } from './departures.controller';
import { DeparturesService } from './departures.service';
import { DeparturesRepository } from './repositories/departures.repository';
import { PublicDeparturesController } from './public-departures.controller';

@Module({
  imports: [
    AuthModule,
    CompaniesModule,
    DatabaseModule,
    ToursModule,
  ],
  controllers: [
    DeparturesController,
    PublicDeparturesController,
  ],
  providers: [
    DeparturesService,
    DeparturesRepository,
  ],
})
export class DeparturesModule {}
