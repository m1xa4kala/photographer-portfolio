import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { BestPhotosService } from '../services/best-photos.service';
import { CreateBestPhotoDto } from '../dtos/create-best-photo.dto';
import { UpdateBestPhotoDto } from '../dtos/update-best-photo.dto';
import { ReorderDto } from '../dtos/reorder.dto';

@Controller('admin/best-photos')
@UseGuards(JwtAuthGuard)
export class AdminBestPhotosController {
  constructor(private bestPhotosService: BestPhotosService) {}

  @Get()
  async findAll() {
    return this.bestPhotosService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bestPhotosService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateBestPhotoDto) {
    return this.bestPhotosService.create(createDto);
  }

  @Patch('reorder')
  async reorder(@Body() reorderDto: ReorderDto) {
    return this.bestPhotosService.reorder(reorderDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateBestPhotoDto,
  ) {
    return this.bestPhotosService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.bestPhotosService.delete(id);
  }
}
