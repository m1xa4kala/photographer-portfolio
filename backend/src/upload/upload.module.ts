import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadController } from './upload.controller';
import { UploadStatusController } from './upload-status.controller';
import { UploadStatusService } from './upload-status.service';

@Module({
  imports: [MulterModule.register({ storage: memoryStorage() })],
  controllers: [UploadController, UploadStatusController],
  providers: [UploadStatusService],
  exports: [UploadStatusService],
})
export class UploadModule {}
