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
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PortfolioPhotosService } from '../services/portfolio-photos.service';
import { CreatePortfolioPhotoDto } from '../dtos/create-portfolio-photo.dto';
import { UpdatePortfolioPhotoDto } from '../dtos/update-portfolio-photo.dto';

@Controller('admin/portfolio-photos')
@UseGuards(JwtAuthGuard)
export class AdminPortfolioPhotosController {
  constructor(private photosService: PortfolioPhotosService) {}

  @Get()
  async findAll(@Query('categoryId') categoryId?: string) {
    if (categoryId) {
      const catId = parseInt(categoryId, 10);
      if (isNaN(catId)) {
        throw new BadRequestException('Invalid categoryId');
      }
      return this.photosService.findByCategory(catId);
    }
    return this.photosService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.photosService.findOne(numericId);
  }

  @Post()
  async create(@Body() createDto: CreatePortfolioPhotoDto) {
    return this.photosService.create(createDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePortfolioPhotoDto,
  ) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.photosService.update(numericId, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.photosService.delete(numericId);
  }
}
