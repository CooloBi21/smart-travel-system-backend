import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CategoriesRepository,
  CategoryRecord,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './repositories/categories.repository';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async getAllActive(): Promise<CategoryRecord[]> {
    return this.categoriesRepository.findAllActive();
  }

  async getAll(): Promise<CategoryRecord[]> {
    return this.categoriesRepository.findAll();
  }

  async create(
    input: CreateCategoryInput,
  ): Promise<CategoryRecord> {
    const existing =
      await this.categoriesRepository.findByCode(
        input.code,
      );

    if (existing) {
      throw new ConflictException(
        'Category code already exists.',
      );
    }

    return this.categoriesRepository.create(input);
  }

  async update(
    id: number,
    input: UpdateCategoryInput,
  ): Promise<CategoryRecord> {
    const category =
      await this.categoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundException(
        'Category not found.',
      );
    }

    if (input.code) {
      const existing =
        await this.categoriesRepository.findByCode(
          input.code,
        );

      if (existing && existing.id !== id) {
        throw new ConflictException(
          'Category code already exists.',
        );
      }
    }

    const updated =
      await this.categoriesRepository.update(
        id,
        input,
      );

    if (!updated) {
      throw new NotFoundException(
        'Category not found.',
      );
    }

    return updated;
  }

  async updateActiveStatus(
    id: number,
    isActive: boolean,
  ): Promise<CategoryRecord> {
    const category =
      await this.categoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundException(
        'Category not found.',
      );
    }

    const updated =
      await this.categoriesRepository.updateActiveStatus(
        id,
        isActive,
      );

    if (!updated) {
      throw new NotFoundException(
        'Category not found.',
      );
    }

    return updated;
  }
}
