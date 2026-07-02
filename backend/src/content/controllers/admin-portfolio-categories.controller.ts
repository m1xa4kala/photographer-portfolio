import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PortfolioCategoriesService } from '../services/portfolio-categories.service';
import { CreatePortfolioCategoryDto } from '../dtos/create-portfolio-category.dto';
import { UpdatePortfolioCategoryDto } from '../dtos/update-portfolio-category.dto';
import { ReorderDto } from '../dto/reorder.dto';

@Controller('admin/portfolio-categories')
@UseGuards(JwtAuthGuard)
export class AdminPortfolioCategoriesController {
  constructor(private categoriesService: PortfolioCategoriesService) {}

  @Get()
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.categoriesService.findOne(numericId);
  }

  @Post()
  async create(@Body() createDto: CreatePortfolioCategoryDto) {
    return this.categoriesService.create(createDto);
  }

  @Patch('reorder')
  async reorder(@Body() reorderDto: ReorderDto) {
    return this.categoriesService.reorder(reorderDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePortfolioCategoryDto,
  ) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.categoriesService.update(numericId, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.categoriesService.delete(numericId);
  }
}
