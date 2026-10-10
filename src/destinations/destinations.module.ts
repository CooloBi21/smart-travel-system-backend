import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { IngestionModule } from '../ingestion/ingestion.module';

import { DestinationsController } from './destinations.controller';
import { DestinationsService } from './destinations.service';
import { DestinationsRepository } from './repositories/destinations.repository';

@Module({
  imports: [
    DatabaseModule,
    IngestionModule,
  ],
  controllers: [
    DestinationsController,
  ],
  providers: [
    DestinationsService,
    DestinationsRepository,
  ],
  exports: [
    DestinationsService,
    DestinationsRepository,
  ],
})
export class DestinationsModule {}
