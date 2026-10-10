import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export type SentimentLabel =
  | 'POSITIVE'
  | 'NEUTRAL'
  | 'NEGATIVE';

export interface ReviewRecord {
  id: number;
  bookingId: number;
  rating: number;
  comment: string;
  sentimentLabel: SentimentLabel | null;
  sentimentConfidence: number | null;
  sentimentModelVersion: string | null;
  sentimentAnalyzedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewWithTourRecord extends ReviewRecord {
  tourId: number;
  tourTitle: string;
  departureDate: string;
}

@Injectable()
export class ReviewsRepository {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async findByBookingId(
    bookingId: number,
  ): Promise<ReviewRecord | null> {
    const result =
      await this.databaseService.query<ReviewRecord>(
        `
          SELECT
            id,
            booking_id AS "bookingId",
            rating,
            comment,
            sentiment_label AS "sentimentLabel",
            sentiment_confidence AS "sentimentConfidence",
            sentiment_model_version AS "sentimentModelVersion",
            sentiment_analyzed_at AS "sentimentAnalyzedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM public.reviews
          WHERE booking_id = $1
          LIMIT 1
        `,
        [bookingId],
      );

    return result.rows[0] ?? null;
  }

  async findById(
    id: number,
  ): Promise<ReviewRecord | null> {
    const result =
      await this.databaseService.query<ReviewRecord>(
        `
          SELECT
            id,
            booking_id AS "bookingId",
            rating,
            comment,
            sentiment_label AS "sentimentLabel",
            sentiment_confidence AS "sentimentConfidence",
            sentiment_model_version AS "sentimentModelVersion",
            sentiment_analyzed_at AS "sentimentAnalyzedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM public.reviews
          WHERE id = $1
          LIMIT 1
        `,
        [id],
      );

    return result.rows[0] ?? null;
  }

  async findByUserId(
    userId: number,
  ): Promise<ReviewWithTourRecord[]> {
    const result =
      await this.databaseService.query<ReviewWithTourRecord>(
        `
          SELECT
            r.id,
            r.booking_id AS "bookingId",
            r.rating,
            r.comment,
            r.sentiment_label AS "sentimentLabel",
            r.sentiment_confidence AS "sentimentConfidence",
            r.sentiment_model_version AS "sentimentModelVersion",
            r.sentiment_analyzed_at AS "sentimentAnalyzedAt",
            r.created_at AS "createdAt",
            r.updated_at AS "updatedAt",
            t.id AS "tourId",
            t.title AS "tourTitle",
            td.departure_date AS "departureDate"
          FROM public.reviews r
          INNER JOIN public.bookings b
            ON b.id = r.booking_id
          INNER JOIN public.tour_departures td
            ON td.id = b.tour_departure_id
          INNER JOIN public.tours t
            ON t.id = td.tour_id
          WHERE b.user_id = $1
          ORDER BY r.created_at DESC
        `,
        [userId],
      );

    return result.rows;
  }

  async findByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<ReviewWithTourRecord | null> {
    const result =
      await this.databaseService.query<ReviewWithTourRecord>(
        `
          SELECT
            r.id,
            r.booking_id AS "bookingId",
            r.rating,
            r.comment,
            r.sentiment_label AS "sentimentLabel",
            r.sentiment_confidence AS "sentimentConfidence",
            r.sentiment_model_version AS "sentimentModelVersion",
            r.sentiment_analyzed_at AS "sentimentAnalyzedAt",
            r.created_at AS "createdAt",
            r.updated_at AS "updatedAt",
            t.id AS "tourId",
            t.title AS "tourTitle",
            td.departure_date AS "departureDate"
          FROM public.reviews r
          INNER JOIN public.bookings b
            ON b.id = r.booking_id
          INNER JOIN public.tour_departures td
            ON td.id = b.tour_departure_id
          INNER JOIN public.tours t
            ON t.id = td.tour_id
          WHERE r.id = $1
            AND b.user_id = $2
          LIMIT 1
        `,
        [id, userId],
      );

    return result.rows[0] ?? null;
  }

  async create(
    bookingId: number,
    rating: number,
    comment: string,
  ): Promise<ReviewRecord> {
    const result =
      await this.databaseService.query<ReviewRecord>(
        `
          INSERT INTO public.reviews (
            booking_id,
            rating,
            comment
          )
          VALUES ($1, $2, $3)
          RETURNING
            id,
            booking_id AS "bookingId",
            rating,
            comment,
            sentiment_label AS "sentimentLabel",
            sentiment_confidence AS "sentimentConfidence",
            sentiment_model_version AS "sentimentModelVersion",
            sentiment_analyzed_at AS "sentimentAnalyzedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
        [
          bookingId,
          rating,
          comment,
        ],
      );

    const review = result.rows[0];

    if (!review) {
      throw new Error(
        'Review creation returned no data.',
      );
    }

    return review;
  }

  async updateSentiment(
    reviewId: number,
    sentimentLabel:
      | 'POSITIVE'
      | 'NEUTRAL'
      | 'NEGATIVE',
    sentimentConfidence: number,
    sentimentModelVersion: string,
  ): Promise<ReviewRecord | null> {
    const result =
      await this.databaseService.query<ReviewRecord>(
        `
          UPDATE public.reviews
          SET
            sentiment_label = $2,
            sentiment_confidence = $3,
            sentiment_model_version = $4,
            sentiment_analyzed_at = NOW(),
            updated_at = NOW()
          WHERE id = $1
          RETURNING
            id,
            booking_id AS "bookingId",
            rating,
            comment,
            sentiment_label AS "sentimentLabel",
            sentiment_confidence AS "sentimentConfidence",
            sentiment_model_version AS "sentimentModelVersion",
            sentiment_analyzed_at AS "sentimentAnalyzedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
        [
          reviewId,
          sentimentLabel,
          sentimentConfidence,
          sentimentModelVersion,
        ],
      );

    return result.rows[0] ?? null;
  }

  async update(
    id: number,
    rating: number,
    comment: string,
  ): Promise<ReviewRecord | null> {
    const result =
      await this.databaseService.query<ReviewRecord>(
        `
          UPDATE public.reviews
          SET
            rating = $2,
            comment = $3,
            sentiment_label = NULL,
            sentiment_confidence = NULL,
            sentiment_model_version = NULL,
            sentiment_analyzed_at = NULL,
            updated_at = NOW()
          WHERE id = $1
          RETURNING
            id,
            booking_id AS "bookingId",
            rating,
            comment,
            sentiment_label AS "sentimentLabel",
            sentiment_confidence AS "sentimentConfidence",
            sentiment_model_version AS "sentimentModelVersion",
            sentiment_analyzed_at AS "sentimentAnalyzedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
        [
          id,
          rating,
          comment,
        ],
      );

    return result.rows[0] ?? null;
  }
}
