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
  ],
})
export class AppModule {}
