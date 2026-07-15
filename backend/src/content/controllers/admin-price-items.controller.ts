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
import { PriceItemsService } from '../services/price-items.service';
import { CreatePriceItemDto } from '../dtos/create-price-item.dto';
import { UpdatePriceItemDto } from '../dtos/update-price-item.dto';
import { ReorderDto } from '../dtos/reorder.dto';

@Controller('admin/price-items')
@UseGuards(JwtAuthGuard)
export class AdminPriceItemsController {
  constructor(private priceItemsService: PriceItemsService) {}

  @Get()
  async findAll() {
    return this.priceItemsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.priceItemsService.findOne(numericId);
  }

  @Post()
  async create(@Body() createDto: CreatePriceItemDto) {
    return this.priceItemsService.create(createDto);
  }

  @Patch('reorder')
  async reorder(@Body() reorderDto: ReorderDto) {
    return this.priceItemsService.reorder(reorderDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdatePriceItemDto) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.priceItemsService.update(numericId, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.priceItemsService.delete(numericId);
  }
}
