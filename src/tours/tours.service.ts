import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyRecord } from '../companies/repositories/companies.repository';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
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

  async getMyTours(
    company: CompanyRecord,
  ) {
    return this.toursRepository.findAllByCompanyId(
      company.id,
    );
  }

  async getMyTourById(
    company: CompanyRecord,
    tourId: number,
  ) {
    const tour =
      await this.toursRepository.findByIdAndCompanyId(
        tourId,
        company.id,
      );

    if (!tour) {
      throw new NotFoundException(
        'Không tìm thấy tour trong doanh nghiệp này.',
      );
    }

    return tour;
  }

  async updateMyTour(
    company: CompanyRecord,
    tourId: number,
    dto: UpdateTourDto,
  ) {
    const currentTour =
      await this.toursRepository.findByIdAndCompanyId(
        tourId,
        company.id,
      );

    if (!currentTour) {
      throw new NotFoundException(
        'Không tìm thấy tour trong doanh nghiệp này.',
      );
    }

    const destinationId =
      dto.destinationId ?? currentTour.destinationId;

    const categoryId =
      dto.categoryId ?? currentTour.categoryId;

    const destinationIsActive =
      await this.toursRepository.isActiveDestination(
        destinationId,
      );

    if (!destinationIsActive) {
      throw new BadRequestException(
        'Điểm đến không tồn tại hoặc chưa hoạt động.',
      );
    }

    const categoryIsActive =
      await this.toursRepository.isActiveCategory(
        categoryId,
      );

    if (!categoryIsActive) {
      throw new BadRequestException(
        'Danh mục tour không tồn tại hoặc chưa hoạt động.',
      );
    }

    const slug =
      dto.slug !== undefined
        ? dto.slug.trim().toLowerCase()
        : currentTour.slug;

    const existingTour =
      await this.toursRepository.findByCompanyAndSlug(
        company.id,
        slug,
      );

    if (
      existingTour &&
      existingTour.id !== currentTour.id
    ) {
      throw new ConflictException(
        'Slug tour đã được sử dụng trong doanh nghiệp này.',
      );
    }

    try {
      const updatedTour =
        await this.toursRepository.updateByIdAndCompanyId(
          currentTour.id,
          company.id,
          {
            destinationId,
            categoryId,
            title:
              dto.title !== undefined
                ? dto.title.trim()
                : currentTour.title,
            slug,
            description:
              dto.description !== undefined
                ? dto.description?.trim() || null
                : currentTour.description,
            durationDays:
              dto.durationDays ??
              currentTour.durationDays,
            travelStyle:
              dto.travelStyle ??
              currentTour.travelStyle,
            cancellationPolicy:
              dto.cancellationPolicy !== undefined
                ? dto.cancellationPolicy?.trim() || null
                : currentTour.cancellationPolicy,
          },
        );

      if (!updatedTour) {
        throw new NotFoundException(
          'Không tìm thấy tour trong doanh nghiệp này.',
        );
      }

      return updatedTour;
    } catch (error) {
      if (this.isCompanySlugViolation(error)) {
        throw new ConflictException(
          'Slug tour đã được sử dụng trong doanh nghiệp này.',
        );
      }

      throw error;
    }
  }

  async publishMyTour(
    company: CompanyRecord,
    tourId: number,
  ) {
    const tour =
      await this.toursRepository.findByIdAndCompanyId(
        tourId,
        company.id,
      );

    if (!tour) {
      throw new NotFoundException(
        'Không tìm thấy tour trong doanh nghiệp này.',
      );
    }

    if (
      tour.status !== 'DRAFT' &&
      tour.status !== 'PAUSED'
    ) {
      throw new BadRequestException(
        'Chỉ tour DRAFT hoặc PAUSED mới được publish.',
      );
    }

    const updatedTour =
      await this.toursRepository.updateStatusByIdAndCompanyId(
        tour.id,
        company.id,
        'PUBLISHED',
      );

    if (!updatedTour) {
      throw new NotFoundException(
        'Không tìm thấy tour trong doanh nghiệp này.',
      );
    }

    return updatedTour;
  }

  async pauseMyTour(
    company: CompanyRecord,
    tourId: number,
  ) {
    const tour =
      await this.toursRepository.findByIdAndCompanyId(
        tourId,
        company.id,
      );

    if (!tour) {
      throw new NotFoundException(
        'Không tìm thấy tour trong doanh nghiệp này.',
      );
    }

    if (tour.status !== 'PUBLISHED') {
      throw new BadRequestException(
        'Chỉ tour PUBLISHED mới được pause.',
      );
    }

    const updatedTour =
      await this.toursRepository.updateStatusByIdAndCompanyId(
        tour.id,
        company.id,
        'PAUSED',
      );

    if (!updatedTour) {
      throw new NotFoundException(
        'Không tìm thấy tour trong doanh nghiệp này.',
      );
    }

    return updatedTour;
  }

  async archiveMyTour(
    company: CompanyRecord,
    tourId: number,
  ) {
    const tour =
      await this.toursRepository.findByIdAndCompanyId(
        tourId,
        company.id,
      );

    if (!tour) {
      throw new NotFoundException(
        'Không tìm thấy tour trong doanh nghiệp này.',
      );
    }

    if (
      tour.status !== 'DRAFT' &&
      tour.status !== 'PAUSED'
    ) {
      throw new BadRequestException(
        'Chỉ tour DRAFT hoặc PAUSED mới được archive.',
      );
    }

    const updatedTour =
      await this.toursRepository.updateStatusByIdAndCompanyId(
        tour.id,
        company.id,
        'ARCHIVED',
      );

    if (!updatedTour) {
      throw new NotFoundException(
        'Không tìm thấy tour trong doanh nghiệp này.',
      );
    }

    return updatedTour;
  }

  async getPublishedTours() {
    return this.toursRepository.findAllPublished();
  }

  async getPublishedTour(
    companySlug: string,
    tourSlug: string,
  ) {
    const tour =
      await this.toursRepository.findPublishedByCompanyAndSlug(
        companySlug.trim().toLowerCase(),
        tourSlug.trim().toLowerCase(),
      );

    if (!tour) {
      throw new NotFoundException(
        'Không tìm thấy tour đang được công khai.',
      );
    }

    return tour;
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
