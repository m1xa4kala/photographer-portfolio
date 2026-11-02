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
import { WeddingFaqItemsService } from '../services/wedding-faq-items.service';
import { CreateWeddingFaqItemDto } from '../dtos/create-wedding-faq-item.dto';
import { UpdateWeddingFaqItemDto } from '../dtos/update-wedding-faq-item.dto';
import { ReorderDto } from '../dtos/reorder.dto';

@Controller('admin/wedding-faq')
@UseGuards(JwtAuthGuard)
export class AdminWeddingFaqController {
  constructor(private weddingFaqItemsService: WeddingFaqItemsService) {}

  @Get()
  async findAll() {
    return this.weddingFaqItemsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.weddingFaqItemsService.findOne(numericId);
  }

  @Post()
  async create(@Body() createDto: CreateWeddingFaqItemDto) {
    return this.weddingFaqItemsService.create(createDto);
  }

  @Patch('reorder')
  async reorder(@Body() reorderDto: ReorderDto) {
    return this.weddingFaqItemsService.reorder(reorderDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWeddingFaqItemDto,
  ) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.weddingFaqItemsService.update(numericId, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.weddingFaqItemsService.delete(numericId);
  }
}
