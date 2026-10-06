import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { IngestionRepository } from './repositories/ingestion.repository';
import { IngestionService } from './ingestion.service';
import { VietnamTourismDestinationAdapter } from './adapters/vietnam-tourism-destination.adapter';
import { NominatimGeocodingAdapter } from './adapters/nominatim-geocoding.adapter';

@Module({
  imports: [DatabaseModule],
  providers: [
    IngestionRepository,
    IngestionService,
    VietnamTourismDestinationAdapter,
    NominatimGeocodingAdapter,
  ],
  exports: [
    IngestionRepository,
    IngestionService,
  ],
})
export class IngestionModule {}
