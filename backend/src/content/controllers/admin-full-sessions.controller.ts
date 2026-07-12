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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { FullSessionsService } from '../services/full-sessions.service';
import { CreateFullSessionDto } from '../dtos/create-full-session.dto';
import { UpdateFullSessionDto } from '../dtos/update-full-session.dto';

@Controller('admin/full-sessions')
@UseGuards(JwtAuthGuard)
export class AdminFullSessionsController {
  constructor(private readonly fullSessionsService: FullSessionsService) {}

  @Get()
  async findAll() {
    return this.fullSessionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.fullSessionsService.findOne(+id);
  }

  @Post()
  async create(@Body() dto: CreateFullSessionDto) {
    return this.fullSessionsService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateFullSessionDto) {
    return this.fullSessionsService.update(+id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.fullSessionsService.delete(+id);
    return { success: true };
  }

  @Post(':id/upload-files')
  @UseInterceptors(FilesInterceptor('files', 100))
  async uploadFiles(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    const results: any[] = [];
    for (const file of files) {
      const result = await this.fullSessionsService.uploadFile(
        +id,
        file.buffer,
        file.originalname,
        file.size,
      );
      results.push(result);
    }
    return results;
  }

  @Delete(':id/files/:fileId')
  async deleteFile(@Param('id') id: string, @Param('fileId') fileId: string) {
    await this.fullSessionsService.deleteFile(+fileId);
    return { success: true };
  }

  @Post(':id/generate-token')
  async generateToken(@Param('id') id: string) {
    const token = await this.fullSessionsService.generateToken(+id);
    return { token, url: `/download/${token}` };
  }

  @Post(':id/revoke-token')
  async revokeToken(@Param('id') id: string) {
    await this.fullSessionsService.revokeToken(+id);
    return { success: true };
  }

  @Patch(':id/toggle-downloads')
  async toggleDownloads(
    @Param('id') id: string,
    @Body() body: { enabled: boolean },
  ) {
    await this.fullSessionsService.toggleDownloads(+id, body.enabled);
    return { success: true };
  }
}
