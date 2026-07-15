import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { FullSessionsService } from '../services/full-sessions.service';
import { S3Service } from '../../s3/s3.service';
import { UploadStatusService } from '../../upload/upload-status.service';
import type { SessionOriginalFile } from '../entities/session-original-file.entity';
import { CreateFullSessionDto } from '../dtos/create-full-session.dto';
import { UpdateFullSessionDto } from '../dtos/update-full-session.dto';
import { ToggleDownloadsDto } from '../dtos/toggle-downloads.dto';

@Controller('admin/full-sessions')
@UseGuards(JwtAuthGuard)
export class AdminFullSessionsController {
  constructor(
    private readonly fullSessionsService: FullSessionsService,
    private readonly s3Service: S3Service,
    private readonly uploadStatusService: UploadStatusService,
  ) {}

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
  @UseInterceptors(
    FilesInterceptor('files', 50, { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async uploadFiles(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Query('uploadId') uploadId?: string,
    @Query('total') total?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    if (uploadId) {
      const existing = this.uploadStatusService.get(uploadId);
      if (existing) {
        existing.total = Math.max(
          existing.total,
          parseInt(total || '') || files.length,
        );
      } else {
        this.uploadStatusService.create(
          uploadId,
          parseInt(total || '') || files.length,
        );
      }
    }

    const uploadedKeys: string[] = [];
    const uploadedFileIds: number[] = [];
    try {
      const results: SessionOriginalFile[] = [];
      for (const file of files) {
        const result = await this.fullSessionsService.uploadFileWithRetry(
          +id,
          file.buffer,
          file.originalname,
          file.size,
          uploadId
            ? () => this.uploadStatusService.incrementRetry(uploadId)
            : undefined,
        );
        uploadedKeys.push(result.s3Key);
        uploadedFileIds.push(result.id);
        results.push(result);

        if (uploadId) {
          this.uploadStatusService.incrementCompleted(uploadId);
        }
      }

      if (uploadId) {
        // Only auto-complete if total was NOT provided (single-batch upload).
        // Multi-batch uploads require the frontend to call POST /upload/status/:uploadId/complete.
        if (!total) {
          this.uploadStatusService.update(uploadId, { status: 'completed' });
        }
      }

      return results;
    } catch (error) {
      // Rollback: удалить из S3 и из БД всё, что успели загрузить
      for (const key of uploadedKeys) {
        await this.s3Service.delete(key).catch(() => {});
      }
      for (const fileId of uploadedFileIds) {
        await this.fullSessionsService.deleteFile(fileId).catch(() => {});
      }

      if (uploadId) {
        this.uploadStatusService.update(uploadId, { status: 'error' });
      }

      throw error;
    }
  }

  @Delete(':id/files/:fileId')
  async deleteFile(@Param('id') id: string, @Param('fileId') fileId: string) {
    await this.fullSessionsService.deleteFile(+fileId);
    return { success: true };
  }

  @Post('sync')
  async syncWithBucket() {
    return this.fullSessionsService.syncWithBucket();
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
    @Body() dto: ToggleDownloadsDto,
  ) {
    await this.fullSessionsService.toggleDownloads(+id, dto.enabled);
    return { success: true };
  }
}
