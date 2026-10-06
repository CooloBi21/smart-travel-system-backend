import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { ToursModule } from './tours/tours.module';
import { DeparturesModule } from './departures/departures.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { DestinationsModule } from './destinations/destinations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    CompaniesModule,
    ToursModule,
    DeparturesModule,
    BookingsModule,
    PaymentsModule,
    RealtimeModule,
    RecommendationModule,
    IngestionModule,
    DestinationsModule,
  ],
})
export class AppModule {}
