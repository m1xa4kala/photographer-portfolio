import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Response } from 'express';
import { ZipArchive } from 'archiver';
import { FullSession } from '../entities/full-session.entity';
import { S3Service } from '../../s3/s3.service';

@Injectable()
export class DownloadService {
  constructor(
    @InjectRepository(FullSession)
    private readonly fullSessionRepo: Repository<FullSession>,
    private readonly s3Service: S3Service,
  ) {}

  async getSessionByToken(token: string) {
    const session = await this.fullSessionRepo.findOne({
      where: { downloadToken: token },
      relations: ['originalFiles'],
    });
    if (!session) throw new NotFoundException('Сессия не найдена');
    if (!session.downloadsEnabled)
      throw new ForbiddenException('Скачивание отключено');

    const totalSize = session.originalFiles.reduce(
      (sum, f) => sum + Number(f.fileSize),
      0,
    );
    return {
      title: session.title,
      description: session.description,
      fileCount: session.originalFiles.length,
      totalSize,
    };
  }

  async streamZip(token: string, res: Response): Promise<void> {
    const session = await this.fullSessionRepo.findOne({
      where: { downloadToken: token },
      relations: ['originalFiles'],
    });
    if (!session) throw new NotFoundException('Сессия не найдена');
    if (!session.downloadsEnabled)
      throw new ForbiddenException('Скачивание отключено');
    if (session.originalFiles.length === 0)
      throw new NotFoundException('Оригиналы ещё не загружены');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(session.title)}.zip"`,
    );

    const archive = new ZipArchive({ zlib: { level: 5 } });
    archive.pipe(res);

    for (const file of session.originalFiles) {
      const stream = await this.s3Service.getStream(file.s3Key);
      archive.append(stream, { name: file.originalName });
    }

    await archive.finalize();
  }
}
