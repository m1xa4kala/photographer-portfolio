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
import { BestPhotosService } from '../services/best-photos.service';
import { CreateBestPhotoDto } from '../dtos/create-best-photo.dto';
import { UpdateBestPhotoDto } from '../dtos/update-best-photo.dto';

@Controller('admin/best-photos')
@UseGuards(JwtAuthGuard)
export class AdminBestPhotosController {
  constructor(private bestPhotosService: BestPhotosService) {}

  @Get()
  async findAll() {
    return this.bestPhotosService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.bestPhotosService.findOne(numericId);
  }

  @Post()
  async create(@Body() createDto: CreateBestPhotoDto) {
    return this.bestPhotosService.create(createDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateBestPhotoDto) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.bestPhotosService.update(numericId, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.bestPhotosService.delete(numericId);
  }
}
