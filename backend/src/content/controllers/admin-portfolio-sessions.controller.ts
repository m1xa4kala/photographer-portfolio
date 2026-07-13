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
import { PortfolioSessionsService } from '../services/portfolio-sessions.service';
import { CreatePortfolioSessionDto } from '../dtos/create-portfolio-session.dto';
import { UpdatePortfolioSessionDto } from '../dtos/update-portfolio-session.dto';
import { ReorderDto } from '../dto/reorder.dto';

@Controller('admin/portfolio-sessions')
@UseGuards(JwtAuthGuard)
export class AdminPortfolioSessionsController {
  constructor(private sessionsService: PortfolioSessionsService) {}

  @Get()
  async findAll(@Query('categoryId') categoryId?: string) {
    if (categoryId) {
      const catId = parseInt(categoryId, 10);
      if (isNaN(catId)) {
        throw new BadRequestException('Invalid categoryId');
      }
      return this.sessionsService.findByCategory(catId);
    }
    return this.sessionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.sessionsService.findOne(numericId);
  }

  @Post()
  async create(@Body() createDto: CreatePortfolioSessionDto) {
    return this.sessionsService.create(createDto);
  }

  @Patch('reorder')
  async reorder(@Body() reorderDto: ReorderDto) {
    return this.sessionsService.reorder(reorderDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePortfolioSessionDto,
  ) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.sessionsService.update(numericId, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.sessionsService.delete(numericId);
  }
}
