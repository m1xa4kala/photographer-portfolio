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
import { ReviewsService } from '../services/reviews.service';
import { CreateReviewDto } from '../dtos/create-review.dto';
import { UpdateReviewDto } from '../dtos/update-review.dto';

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard)
export class AdminReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get()
  async findAll() {
    return this.reviewsService.findAll(); // предполагаем метод findAll для админа (включая неактивные)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.reviewsService.findOne(numericId);
  }

  @Post()
  async create(@Body() createDto: CreateReviewDto) {
    return this.reviewsService.create(createDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateReviewDto) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.reviewsService.update(numericId, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.reviewsService.delete(numericId);
  }
}
