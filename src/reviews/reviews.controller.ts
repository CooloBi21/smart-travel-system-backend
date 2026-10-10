import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
  ) {}

  @Post()
  async createReview(
    @Req() request: { user: { id: number } },
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(
      request.user.id,
      dto,
    );
  }

  @Get('mine')
  async getMyReviews(
    @Req() request: { user: { id: number } },
  ) {
    return this.reviewsService.getMyReviews(
      request.user.id,
    );
  }

  @Get('mine/:reviewId')
  async getMyReviewById(
    @Req() request: { user: { id: number } },
    @Param('reviewId', ParseIntPipe) reviewId: number,
  ) {
    return this.reviewsService.getMyReviewById(
      request.user.id,
      reviewId,
    );
  }

  @Patch('mine/:reviewId')
  async updateReview(
    @Req() request: { user: { id: number } },
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(
      request.user.id,
      reviewId,
      dto,
    );
  }
}
