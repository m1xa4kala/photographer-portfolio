import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: (error: Error | null, accept: boolean) => void) => {
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return cb(
      new UnsupportedMediaTypeException(
        `Only ${ALLOWED_MIMETYPES.join(', ')} files are allowed`,
      ),
      false,
    );
  }
  cb(null, true);
};

@Controller('upload')
export class UploadController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', { storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { error: 'File not uploaded' };
    }
    return { url: `/uploads/${file.filename}` };
  }

  @Post('multiple')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 50, { storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } }),
  )
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      return { urls: [] };
    }
    return { urls: files.map((f) => `/uploads/${f.filename}`) };
  }
}
