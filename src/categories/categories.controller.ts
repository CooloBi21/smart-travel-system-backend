import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateCategoryStatusDto } from './dto/update-category-status.dto';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
  ) {}

  /**
   * Public/reference-data endpoint.
   * Used by TourFormPage.
   */
  @Get()
  async getAllActive() {
    return this.categoriesService.getAllActive();
  }

  /**
   * Platform Admin only.
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  async getAll() {
    return this.categoriesService.getAll();
  }

  /**
   * Platform Admin only.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  async create(
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create({
      code: dto.code.trim(),
      name: dto.name.trim(),
      description:
        dto.description?.trim() || null,
    });
  }

  /**
   * Platform Admin only.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, {
      code: dto.code?.trim(),
      name: dto.name?.trim(),
      description:
        dto.description === undefined
          ? undefined
          : dto.description.trim() || null,
    });
  }

  /**
   * Platform Admin only.
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryStatusDto,
  ) {
    return this.categoriesService.updateActiveStatus(
      id,
      dto.isActive,
    );
  }
}
