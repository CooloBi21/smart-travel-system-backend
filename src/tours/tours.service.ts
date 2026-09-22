import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CompanyRecord } from '../companies/repositories/companies.repository';
import { CreateTourDto } from './dto/create-tour.dto';
import { ToursRepository } from './repositories/tours.repository';

@Injectable()
export class ToursService {
  constructor(
    private readonly toursRepository: ToursRepository,
  ) {}

  async createTour(
    company: CompanyRecord,
    dto: CreateTourDto,
  ) {
    const destinationIsActive =
      await this.toursRepository.isActiveDestination(
        dto.destinationId,
      );

    if (!destinationIsActive) {
      throw new BadRequestException(
        'Điểm đến không tồn tại hoặc chưa hoạt động.',
      );
    }

    const categoryIsActive =
      await this.toursRepository.isActiveCategory(
        dto.categoryId,
      );

    if (!categoryIsActive) {
      throw new BadRequestException(
        'Danh mục tour không tồn tại hoặc chưa hoạt động.',
      );
    }

    const slug = dto.slug.trim().toLowerCase();

    const existingTour =
      await this.toursRepository.findByCompanyAndSlug(
        company.id,
        slug,
      );

    if (existingTour) {
      throw new ConflictException(
        'Slug tour đã được sử dụng trong doanh nghiệp này.',
      );
    }

    try {
      return await this.toursRepository.create({
        companyId: company.id,
        destinationId: dto.destinationId,
        categoryId: dto.categoryId,
        title: dto.title.trim(),
        slug,
        description:
          dto.description?.trim() || null,
        durationDays: dto.durationDays,
        travelStyle: dto.travelStyle,
        cancellationPolicy:
          dto.cancellationPolicy?.trim() || null,
      });
    } catch (error) {
      if (this.isCompanySlugViolation(error)) {
        throw new ConflictException(
          'Slug tour đã được sử dụng trong doanh nghiệp này.',
        );
      }

      throw error;
    }
  }

  private isCompanySlugViolation(
    error: unknown,
  ): boolean {
    if (
      typeof error !== 'object' ||
      error === null
    ) {
      return false;
    }

    const postgresError = error as {
      code?: unknown;
      constraint?: unknown;
    };

    return (
      postgresError.code === '23505' &&
      postgresError.constraint ===
        'uq_tours_company_slug'
    );
  }
}
