import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UnsupportedMediaTypeException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { randomBytes } from 'crypto';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

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
];

function validateImageMagic(buffer: Buffer): boolean {
  return MAGIC_BYTES.some(
    ({ bytes, offset }) =>
      buffer.length >= offset + bytes.length &&
      bytes.every((b, i) => buffer[offset + i] === b),
  );
}

function generateFilename(): string {
  const unique = Date.now() + '-' + randomBytes(4).toString('hex');
  return `${unique}.webp`;
}

/**
 * Convert an image buffer to WebP (2000 px max, 85% quality).
 * Non-JPEG/PNG images are returned unchanged.
 */
async function convertToWebP(buffer: Buffer, mime: string): Promise<Buffer> {
  if (mime !== 'image/jpeg' && mime !== 'image/jpg' && mime !== 'image/png') {
    return buffer;
  }
  return sharp(buffer)
    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

@Controller('upload')
export class UploadController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File not uploaded');
    }

    if (!validateImageMagic(file.buffer)) {
      throw new UnsupportedMediaTypeException(
        `Only ${ALLOWED_MIMETYPES.join(', ')} files are allowed`,
      );
    }

    const converted = await convertToWebP(file.buffer, file.mimetype);
    const filename = generateFilename();
    await writeFile(join(UPLOAD_DIR, filename), converted);

    return { url: `/uploads/${filename}` };
  }

  @Post('multiple')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 50, { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      return { urls: [] };
    }

    const urls: string[] = [];

    for (const file of files) {
      if (!validateImageMagic(file.buffer)) {
        // Clean up already-saved files on validation failure
        for (const url of urls) {
          await unlink(join(UPLOAD_DIR, url.replace('/uploads/', ''))).catch(
            () => {},
          );
        }
        throw new UnsupportedMediaTypeException(
          `Only ${ALLOWED_MIMETYPES.join(', ')} files are allowed`,
        );
      }

      const converted = await convertToWebP(file.buffer, file.mimetype);
      const filename = generateFilename();
      await writeFile(join(UPLOAD_DIR, filename), converted);
      urls.push(`/uploads/${filename}`);
    }

    return { urls };
  }
}
