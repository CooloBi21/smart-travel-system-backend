import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './repositories/analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly analyticsRepository: AnalyticsRepository,
  ) {}

  async getPlatformAnalytics() {
    const [
      overview,
      bookingStatuses,
      monthlyBookings,
    ] = await Promise.all([
      this.analyticsRepository.getPlatformOverview(),
      this.analyticsRepository.getBookingStatusStatistics(),
      this.analyticsRepository.getMonthlyBookings(),
    ]);

    return {
      overview: {
        totalBookings: Number(
          overview.total_bookings,
        ),

        confirmedBookings: Number(
          overview.confirmed_bookings,
        ),

        completedBookings: Number(
          overview.completed_bookings,
        ),

        cancelledBookings: Number(
          overview.cancelled_bookings,
        ),

        totalRevenue: Number(
          overview.total_revenue ?? 0,
        ),

        totalTours: Number(
          overview.total_tours,
        ),

        publishedTours: Number(
          overview.published_tours,
        ),

        totalCompanies: Number(
          overview.total_companies,
        ),

        activeCompanies: Number(
          overview.active_companies,
        ),

        totalCustomers: Number(
          overview.total_customers,
        ),
      },

      bookingStatuses: bookingStatuses.map(
        (item) => ({
          status: item.status,
          count: Number(item.booking_count),
        }),
      ),

      monthlyBookings: monthlyBookings.map(
        (item) => ({
          month: item.month,
          bookingCount: Number(
            item.booking_count,
          ),
          revenue: Number(
            item.revenue ?? 0,
          ),
        }),
      ),
    };
  }
}
