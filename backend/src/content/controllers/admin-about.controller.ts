import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AboutService } from '../services/about.service';
import { UpdateAboutDto } from '../dtos/update-about.dto';

@Controller('admin/about')
@UseGuards(JwtAuthGuard)
export class AdminAboutController {
  constructor(private aboutService: AboutService) {}

  @Get()
  async get() {
    return this.aboutService.get();
  }

  @Put()
  async update(@Body() updateDto: UpdateAboutDto) {
    return this.aboutService.update(updateDto);
  }
}
