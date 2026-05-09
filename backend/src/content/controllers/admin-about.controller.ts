import { Controller, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AboutService } from '../services/about.service';
import { UpdateAboutDto } from '../dtos/update-about.dto';

@Controller('admin/about')
@UseGuards(JwtAuthGuard)
export class AdminAboutController {
  constructor(private aboutService: AboutService) {}

  @Put()
  async update(@Body() updateDto: UpdateAboutDto) {
    return this.aboutService.update(updateDto);
  }
}
