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
import { SocialLinksService } from '../services/social-links.service';
import { CreateSocialLinkDto } from '../dtos/create-social-link.dto';
import { UpdateSocialLinkDto } from '../dtos/update-social-link.dto';
import { ReorderDto } from '../dtos/reorder.dto';

@Controller('admin/social-links')
@UseGuards(JwtAuthGuard)
export class AdminSocialLinksController {
  constructor(private socialLinksService: SocialLinksService) {}

  @Get()
  async findAll() {
    return this.socialLinksService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.socialLinksService.findOne(numericId);
  }

  @Post()
  async create(@Body() createDto: CreateSocialLinkDto) {
    return this.socialLinksService.create(createDto);
  }

  @Patch('reorder')
  async reorder(@Body() reorderDto: ReorderDto) {
    return this.socialLinksService.reorder(reorderDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSocialLinkDto,
  ) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.socialLinksService.update(numericId, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.socialLinksService.delete(numericId);
  }
}
