import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';

import { ToursRepository } from '../tours/repositories/tours.repository';
import { DeparturesRepository } from './repositories/departures.repository';

@Controller('tours/public/:companySlug/:tourSlug/departures')
export class PublicDeparturesController {
  constructor(
    private readonly toursRepository: ToursRepository,
    private readonly departuresRepository: DeparturesRepository,
  ) {}

  @Get()
  async getPublicDepartures(
    @Param('companySlug') companySlug: string,
    @Param('tourSlug') tourSlug: string,
  ) {
    const tour =
      await this.toursRepository.findPublishedByCompanyAndSlug(
        companySlug,
        tourSlug,
      );

    if (!tour) {
      throw new NotFoundException(
        'Published tour not found.',
      );
    }

    return this.departuresRepository.findAllByTourId(
      tour.id,
    );
  }
}
