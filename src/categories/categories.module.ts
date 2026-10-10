import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './repositories/categories.repository';

@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [
    CategoriesController,
  ],
  providers: [
    CategoriesService,
    CategoriesRepository,
  ],
  exports: [
    CategoriesService,
    CategoriesRepository,
  ],
})
export class CategoriesModule {}
