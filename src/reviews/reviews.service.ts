import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { BookingsRepository } from '../bookings/repositories/bookings.repository';
import {
  ReviewRecord,
  ReviewsRepository,
} from './repositories/reviews.repository';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly aiService: AiService,
  ) {}

  async createReview(
    userId: number,
    dto: CreateReviewDto,
  ): Promise<ReviewRecord> {
    this.validateUserId(userId);

    const booking =
      await this.bookingsRepository.findById(
        dto.bookingId,
      );

    if (!booking) {
      throw new NotFoundException(
        'Booking not found.',
      );
    }

    if (booking.userId !== userId) {
      throw new NotFoundException(
        'Booking not found.',
      );
    }

    if (booking.status !== 'COMPLETED') {
      throw new ConflictException(
        'Only completed bookings can be reviewed.',
      );
    }

    const existingReview =
      await this.reviewsRepository.findByBookingId(
        dto.bookingId,
      );

    if (existingReview) {
      throw new ConflictException(
        'This booking has already been reviewed.',
      );
    }

    const review =
      await this.reviewsRepository.create(
        dto.bookingId,
        dto.rating,
        dto.comment.trim(),
      );

    const sentiment =
      await this.aiService.analyzeSentiment({
        text: review.comment,
      });

    const analyzedReview =
      await this.reviewsRepository.updateSentiment(
        review.id,
        sentiment.label,
        sentiment.confidence,
        sentiment.modelVersion,
      );

    if (!analyzedReview) {
      throw new NotFoundException(
        'Review was created but sentiment analysis could not update the review.',
      );
    }

    return analyzedReview;
  }

  async getMyReviews(
    userId: number,
  ) {
    this.validateUserId(userId);

    return this.reviewsRepository.findByUserId(
      userId,
    );
  }

  async getMyReviewById(
    userId: number,
    reviewId: number,
  ) {
    this.validateUserId(userId);
    this.validateId(reviewId, 'review ID');

    const review =
      await this.reviewsRepository.findByIdAndUserId(
        reviewId,
        userId,
      );

    if (!review) {
      throw new NotFoundException(
        'Review not found.',
      );
    }

    return review;
  }

  async updateReview(
    userId: number,
    reviewId: number,
    dto: UpdateReviewDto,
  ): Promise<ReviewRecord> {
    this.validateUserId(userId);
    this.validateId(reviewId, 'review ID');

    const review =
      await this.reviewsRepository.findByIdAndUserId(
        reviewId,
        userId,
      );

    if (!review) {
      throw new NotFoundException(
        'Review not found.',
      );
    }

    const updatedReview =
      await this.reviewsRepository.update(
        reviewId,
        dto.rating,
        dto.comment.trim(),
      );

    if (!updatedReview) {
      throw new NotFoundException(
        'Review not found.',
      );
    }

    return updatedReview;
  }

  private validateUserId(userId: number): void {
    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      throw new BadRequestException(
        'Authenticated user is invalid.',
      );
    }
  }

  private validateId(
    id: number,
    fieldName: string,
  ): void {
    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new BadRequestException(
        `Invalid ${fieldName}.`,
      );
    }
  }
}
