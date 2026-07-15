import {
  Controller,
  Get,
  Post,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { UploadStatusService } from './upload-status.service';

@Controller('upload/status')
export class UploadStatusController {
  constructor(private readonly uploadStatusService: UploadStatusService) {}

  @Get(':uploadId')
  getStatus(@Param('uploadId') uploadId: string) {
    const status = this.uploadStatusService.get(uploadId);
    if (!status) {
      throw new NotFoundException('Upload not found or already cleaned up');
    }
    return status;
  }

  @Post(':uploadId/complete')
  complete(@Param('uploadId') uploadId: string) {
    this.uploadStatusService.getOrThrow(uploadId);
    this.uploadStatusService.update(uploadId, { status: 'completed' });
    return { success: true };
  }
}
