import {
  Controller,
  Post,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UnsupportedMediaTypeException,
  BadRequestException,
} from '@nestjs/common';
import { UploadStatusService } from './upload-status.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { randomUUID } from 'crypto';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];

const UPLOAD_DIR = './uploads';

/** Magic bytes for supported image formats */
const MAGIC_BYTES: { mime: string; bytes: number[]; offset: number }[] = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff], offset: 0 },
  {
    mime: 'image/png',
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    offset: 0,
  },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // "RIFF" header
  { mime: 'image/webp', bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // "WEBP" tag
];

/**
 * Validate that the buffer's magic bytes match a known image format.
 * For formats with multiple entries (e.g. WebP: RIFF + WEBP), ALL entries
 * for that mime type must match — a single partial match is not enough.
 */
function validateImageMagic(buffer: Buffer): boolean {
  const mimeTypes = [...new Set(MAGIC_BYTES.map((e) => e.mime))];
  return mimeTypes.some((mime) => {
    const entries = MAGIC_BYTES.filter((e) => e.mime === mime);
    return entries.every(
      ({ bytes, offset }) =>
        buffer.length >= offset + bytes.length &&
        bytes.every((b, i) => buffer[offset + i] === b),
    );
  });
}

function generateFilename(): string {
  const unique = Date.now() + '-' + randomUUID();
  return `${unique}.webp`;
}

function imageFileFilter(
  _req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, accept: boolean) => void,
) {
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return callback(
      new UnsupportedMediaTypeException(
        `Only ${ALLOWED_MIMETYPES.join(', ')} files are allowed`,
      ),
      false,
    );
  }
  callback(null, true);
}

/**
 * Reprocess any image buffer through sharp and output WebP
 * (2000 px max, 85% quality). Always runs through sharp regardless
 * of the reported Content-Type — this prevents a spoofed
 * Content-Type from bypassing content sanitization.
 */
async function convertToWebP(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadStatusService: UploadStatusService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: imageFileFilter,
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('uploadId') uploadId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File not uploaded');
    }

    if (uploadId) {
      this.uploadStatusService.create(uploadId, 1);
    }

    let filename: string;

    try {
      if (!validateImageMagic(file.buffer)) {
        if (uploadId) {
          this.uploadStatusService.update(uploadId, { status: 'error' });
        }
        throw new UnsupportedMediaTypeException(
          `Only ${ALLOWED_MIMETYPES.join(', ')} files are allowed`,
        );
      }

      const converted = await convertToWebP(file.buffer);
      filename = generateFilename();
      await writeFile(join(UPLOAD_DIR, filename), converted);
    } catch (error) {
      if (uploadId) {
        this.uploadStatusService.update(uploadId, { status: 'error' });
      }
      throw error;
    }

    if (uploadId) {
      this.uploadStatusService.incrementCompleted(uploadId);
      this.uploadStatusService.update(uploadId, { status: 'completed' });
    }

    return { url: `/uploads/${filename}` };
  }

  @Post('multiple')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: imageFileFilter,
    }),
  )
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('uploadId') uploadId: string,
    @Query('total') total?: string,
  ) {
    if (!files || files.length === 0) {
      return { urls: [] };
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

    const urls: string[] = [];
    // Snapshot completed count before processing this batch — used for rollback
    const completedBeforeBatch = uploadId
      ? (this.uploadStatusService.get(uploadId)?.completed ?? 0)
      : 0;

    try {
      for (const file of files) {
        if (!validateImageMagic(file.buffer)) {
          throw new UnsupportedMediaTypeException(
            `Only ${ALLOWED_MIMETYPES.join(', ')} files are allowed`,
          );
        }

        const converted = await convertToWebP(file.buffer);
        const filename = generateFilename();
        await writeFile(join(UPLOAD_DIR, filename), converted);
        urls.push(`/uploads/${filename}`);

        if (uploadId) {
          this.uploadStatusService.incrementCompleted(uploadId);
        }
      }
    } catch (error) {
      if (uploadId) {
        // Rollback completed counter — any files processed before the error were already deleted
        this.uploadStatusService.update(uploadId, {
          status: 'error',
          completed: completedBeforeBatch,
        });
      }
      for (const url of urls) {
        await unlink(join(UPLOAD_DIR, url.replace('/uploads/', ''))).catch(
          () => {},
        );
      }
      throw error;
    }

    if (uploadId) {
      // Only auto-complete if total was NOT provided (single-batch upload).
      // Multi-batch uploads require the frontend to call POST /upload/status/:uploadId/complete.
      if (!total) {
        this.uploadStatusService.update(uploadId, { status: 'completed' });
      }
    }

    return { urls };
  }
}
