import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AnalyticsRepository {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async getPlatformOverview() {
    const result = await this.databaseService.query<{
      total_bookings: string;
      confirmed_bookings: string;
      completed_bookings: string;
      cancelled_bookings: string;
      total_revenue: string | null;
      total_tours: string;
      published_tours: string;
      total_companies: string;
      active_companies: string;
      total_customers: string;
    }>(
      `
        SELECT
          (
            SELECT COUNT(*)
            FROM bookings
          ) AS total_bookings,

          (
            SELECT COUNT(*)
            FROM bookings
            WHERE status = 'CONFIRMED'
          ) AS confirmed_bookings,

          (
            SELECT COUNT(*)
            FROM bookings
            WHERE status = 'COMPLETED'
          ) AS completed_bookings,

          (
            SELECT COUNT(*)
            FROM bookings
            WHERE status = 'CANCELLED'
          ) AS cancelled_bookings,

          (
            SELECT COALESCE(
              SUM(
                b.guest_count * b.unit_price
              ),
              0
            )
            FROM bookings b
            WHERE b.status IN (
              'CONFIRMED',
              'COMPLETED'
            )
          ) AS total_revenue,

          (
            SELECT COUNT(*)
            FROM tours
          ) AS total_tours,

          (
            SELECT COUNT(*)
            FROM tours
            WHERE status = 'PUBLISHED'
          ) AS published_tours,

          (
            SELECT COUNT(*)
            FROM companies
          ) AS total_companies,

          (
            SELECT COUNT(*)
            FROM companies
            WHERE status = 'ACTIVE'
          ) AS active_companies,

          (
            SELECT COUNT(*)
            FROM users
            WHERE role_id = (
              SELECT id
              FROM roles
              WHERE code = 'CUSTOMER'
              LIMIT 1
            )
          ) AS total_customers
      `,
    );

    return result.rows[0];
  }

  async getBookingStatusStatistics() {
    const result = await this.databaseService.query<{
      status: string;
      booking_count: string;
    }>(
      `
        SELECT
          status,
          COUNT(*) AS booking_count
        FROM bookings
        GROUP BY status
        ORDER BY status
      `,
    );

    return result.rows;
  }

  async getMonthlyBookings() {
    const result = await this.databaseService.query<{
      month: string;
      booking_count: string;
      revenue: string | null;
    }>(
      `
        SELECT
          TO_CHAR(
            DATE_TRUNC('month', created_at),
            'YYYY-MM'
          ) AS month,

          COUNT(*) AS booking_count,

          COALESCE(
            SUM(
              guest_count * unit_price
            ) FILTER (
              WHERE status IN (
                'CONFIRMED',
                'COMPLETED'
              )
            ),
            0
          ) AS revenue

        FROM bookings

        GROUP BY DATE_TRUNC(
          'month',
          created_at
        )

        ORDER BY DATE_TRUNC(
          'month',
          created_at
        )
      `,
    );

    return result.rows;
  }
}
