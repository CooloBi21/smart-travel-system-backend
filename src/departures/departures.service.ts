import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ToursRepository } from '../tours/repositories/tours.repository';
import {
  CreateDepartureInput,
  DepartureStatus,
  DeparturesRepository,
  UpdateDepartureInput,
} from './repositories/departures.repository';

interface ActiveCompanyContext {
  id: number;
}

@Injectable()
export class DeparturesService {
  constructor(
    private readonly departuresRepository: DeparturesRepository,
    private readonly toursRepository: ToursRepository,
  ) {}

  async getDepartures(
    company: ActiveCompanyContext,
    tourId: number,
  ) {
    await this.ensureTourBelongsToCompany(company.id, tourId);

    return this.departuresRepository.findAllByTourId(tourId);
  }

  async getDeparture(
    company: ActiveCompanyContext,
    tourId: number,
    departureId: number,
  ) {
    await this.ensureTourBelongsToCompany(company.id, tourId);

    const departure =
      await this.departuresRepository.findByIdAndTourId(
        departureId,
        tourId,
      );

    if (!departure) {
      throw new NotFoundException(
        'Không tìm thấy ngày khởi hành.',
      );
    }

    return departure;
  }

  async createDeparture(
    company: ActiveCompanyContext,
    tourId: number,
    input: CreateDepartureInput,
  ) {
    await this.ensureTourBelongsToCompany(company.id, tourId);

    const existing =
      await this.departuresRepository.findByTourAndDate(
        tourId,
        input.departureDate,
      );

    if (existing) {
      throw new ConflictException(
        'Tour đã có ngày khởi hành này.',
      );
    }

    try {
      return await this.departuresRepository.create({
        ...input,
        tourId,
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Tour đã có ngày khởi hành này.',
        );
      }

      throw error;
    }
  }

  async updateDeparture(
    company: ActiveCompanyContext,
    tourId: number,
    departureId: number,
    input: UpdateDepartureInput,
  ) {
    await this.ensureTourBelongsToCompany(company.id, tourId);

    const existing =
      await this.departuresRepository.findByIdAndTourId(
        departureId,
        tourId,
      );

    if (!existing) {
      throw new NotFoundException(
        'Không tìm thấy ngày khởi hành.',
      );
    }

    if (
      input.departureDate !== undefined &&
      input.departureDate !== existing.departureDate
    ) {
      const duplicate =
        await this.departuresRepository.findByTourAndDate(
          tourId,
          input.departureDate,
        );

      if (
        duplicate &&
        duplicate.id !== departureId
      ) {
        throw new ConflictException(
          'Tour đã có ngày khởi hành này.',
        );
      }
    }

    try {
      return await this.departuresRepository.update(
        departureId,
        tourId,
        input,
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Tour đã có ngày khởi hành này.',
        );
      }

      throw error;
    }
  }

  async updateDepartureStatus(
    company: ActiveCompanyContext,
    tourId: number,
    departureId: number,
    status: DepartureStatus,
  ) {
    await this.ensureTourBelongsToCompany(company.id, tourId);

    const existing =
      await this.departuresRepository.findByIdAndTourId(
        departureId,
        tourId,
      );

    if (!existing) {
      throw new NotFoundException(
        'Không tìm thấy ngày khởi hành.',
      );
    }

    return this.departuresRepository.updateStatus(
      departureId,
      tourId,
      status,
    );
  }

  async deleteDeparture(
    company: ActiveCompanyContext,
    tourId: number,
    departureId: number,
  ) {
    await this.ensureTourBelongsToCompany(company.id, tourId);

    const existing =
      await this.departuresRepository.findByIdAndTourId(
        departureId,
        tourId,
      );

    if (!existing) {
      throw new NotFoundException(
        'Không tìm thấy ngày khởi hành.',
      );
    }

    const deleted =
      await this.departuresRepository.delete(
        departureId,
        tourId,
      );

    if (!deleted) {
      throw new NotFoundException(
        'Không tìm thấy ngày khởi hành.',
      );
    }

    return {
      status: 'success',
      message: 'Xóa ngày khởi hành thành công.',
    };
  }

  private async ensureTourBelongsToCompany(
    companyId: number,
    tourId: number,
  ): Promise<void> {
    const tour =
      await this.toursRepository.findByIdAndCompanyId(
        tourId,
        companyId,
      );

    if (!tour) {
      throw new NotFoundException(
        'Không tìm thấy tour trong doanh nghiệp hiện tại.',
      );
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    if (
      typeof error !== 'object' ||
      error === null
    ) {
      return false;
    }

    const databaseError =
      error as { code?: string };

    return databaseError.code === '23505';
  }
}
