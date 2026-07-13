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
import { ReorderDto } from '../dto/reorder.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioPhoto } from '../entities/portfolio-photo.entity';

@Controller('admin/portfolio-photos')
@UseGuards(JwtAuthGuard)
export class AdminPortfolioPhotosController {
  constructor(
    private photosService: PortfolioPhotosService,
    @InjectRepository(PortfolioPhoto)
    private readonly photoRepo: Repository<PortfolioPhoto>,
  ) {}

  @Get()
  async findAll(@Query('sessionId') sessionId?: string) {
    if (sessionId) {
      const sId = parseInt(sessionId, 10);
      if (isNaN(sId)) {
        throw new BadRequestException('Invalid sessionId');
      }
      return this.photosService.findBySession(sId);
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
    const count = await this.photoRepo.count({
      where: { sessionId: createDto.sessionId },
    });
    if (count >= 15) {
      throw new BadRequestException(
        'В фотосессии не может быть больше 15 фото',
      );
    }
    return this.photosService.create(createDto);
  }

  @Patch('reorder')
  async reorder(@Body() reorderDto: ReorderDto) {
    return this.photosService.reorder(reorderDto);
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
