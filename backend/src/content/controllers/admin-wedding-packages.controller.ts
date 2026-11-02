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
import { WeddingPackagesService } from '../services/wedding-packages.service';
import { CreateWeddingPackageDto } from '../dtos/create-wedding-package.dto';
import { UpdateWeddingPackageDto } from '../dtos/update-wedding-package.dto';
import { ReorderDto } from '../dtos/reorder.dto';

@Controller('admin/wedding-packages')
@UseGuards(JwtAuthGuard)
export class AdminWeddingPackagesController {
  constructor(private weddingPackagesService: WeddingPackagesService) {}

  @Get()
  async findAll() {
    return this.weddingPackagesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.weddingPackagesService.findOne(numericId);
  }

  @Post()
  async create(@Body() createDto: CreateWeddingPackageDto) {
    return this.weddingPackagesService.create(createDto);
  }

  @Patch('reorder')
  async reorder(@Body() reorderDto: ReorderDto) {
    return this.weddingPackagesService.reorder(reorderDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWeddingPackageDto,
  ) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.weddingPackagesService.update(numericId, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.weddingPackagesService.delete(numericId);
  }
}
