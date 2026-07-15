import {
  Injectable,
  NotFoundException,
  BadGatewayException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { FullSession } from '../entities/full-session.entity';
import { SessionOriginalFile } from '../entities/session-original-file.entity';
import { CreateFullSessionDto } from '../dtos/create-full-session.dto';
import { UpdateFullSessionDto } from '../dtos/update-full-session.dto';
import { S3Service } from '../../s3/s3.service';

@Injectable()
export class FullSessionsService {
  constructor(
    @InjectRepository(FullSession)
    private readonly fullSessionRepo: Repository<FullSession>,
    @InjectRepository(SessionOriginalFile)
    private readonly originalFileRepo: Repository<SessionOriginalFile>,
    private readonly s3Service: S3Service,
  ) {}

  async findAll(): Promise<FullSession[]> {
    return this.fullSessionRepo.find({
      order: { createdAt: 'DESC' },
      relations: { originalFiles: true },
    });
  }

  async findOne(id: number): Promise<FullSession> {
    const session = await this.fullSessionRepo.findOne({
      where: { id },
      relations: { originalFiles: true },
    });
    if (!session) throw new NotFoundException('FullSession not found');
    return session;
  }

  async create(dto: CreateFullSessionDto): Promise<FullSession> {
    const session = this.fullSessionRepo.create(dto);
    return this.fullSessionRepo.save(session);
  }

  async update(id: number, dto: UpdateFullSessionDto): Promise<FullSession> {
    const session = await this.findOne(id);
    Object.assign(session, dto);
    return this.fullSessionRepo.save(session);
  }

  async delete(id: number): Promise<void> {
    const session = await this.findOne(id);
    await Promise.allSettled(
      session.originalFiles.map((file) =>
        this.s3Service.delete(file.s3Key).catch(() => {}),
      ),
    );
    await this.fullSessionRepo.remove(session);
  }

  async uploadFileWithRetry(
    fullSessionId: number,
    buffer: Buffer,
    originalName: string,
    fileSize: number,
    onRetry?: (attempt: number) => void,
  ): Promise<SessionOriginalFile> {
    const session = await this.findOne(fullSessionId);
    const s3Key = this.s3Service.generateKey(originalName);

    // Save to DB first
    const file = this.originalFileRepo.create({
      fullSessionId: session.id,
      originalName,
      s3Key,
      fileSize,
    });
    const savedFile = await this.originalFileRepo.save(file);

    // Manual retry loop with exponential backoff
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.s3Service.upload(buffer, s3Key);
        return savedFile;
      } catch {
        if (attempt < maxAttempts) {
          onRetry?.(attempt);
          // Exponential backoff: 1s, 2s, 4s, 8s
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)),
          );
        } else {
          // All attempts failed — clean up DB record and throw
          await this.originalFileRepo.remove(savedFile).catch(() => {});
          const msg = `Не удалось загрузить файл после ${maxAttempts} попыток. Проблема с подключением к хранилищу.`;
          throw new BadGatewayException(msg);
        }
      }
    }

    // Should never reach here
    throw new Error('Unexpected error in uploadFileWithRetry');
  }

  async deleteFile(fileId: number): Promise<void> {
    const file = await this.originalFileRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    await this.s3Service.delete(file.s3Key).catch(() => {});
    await this.originalFileRepo.remove(file);
  }

  async syncWithBucket(): Promise<{ deleted: number; total: number }> {
    const files = await this.originalFileRepo.find();
    let deleted = 0;

    // Parallelize S3 existence checks with concurrency limit
    const CONCURRENCY = 10;
    const results = await Promise.allSettled(
      Array.from(
        { length: Math.ceil(files.length / CONCURRENCY) },
        (_, batch) =>
          Promise.all(
            files
              .slice(batch * CONCURRENCY, (batch + 1) * CONCURRENCY)
              .map(async (file) => {
                const exists = await this.s3Service.exists(file.s3Key);
                if (!exists) {
                  await this.originalFileRepo.remove(file);
                  return true;
                }
                return false;
              }),
          ),
      ),
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        deleted += result.value.filter(Boolean).length;
      }
    }

    return { deleted, total: files.length };
  }

  async generateToken(id: number): Promise<string> {
    const session = await this.findOne(id);
    session.downloadToken = crypto.randomUUID();
    await this.fullSessionRepo.save(session);
    return session.downloadToken;
  }

  async revokeToken(id: number): Promise<void> {
    const session = await this.findOne(id);
    session.downloadToken = null;
    session.downloadsEnabled = false;
    await this.fullSessionRepo.save(session);
  }

  async toggleDownloads(id: number, enabled: boolean): Promise<void> {
    const session = await this.findOne(id);
    session.downloadsEnabled = enabled;
    await this.fullSessionRepo.save(session);
  }

  async findByToken(token: string): Promise<FullSession> {
    const session = await this.fullSessionRepo.findOne({
      where: { downloadToken: token },
      relations: { originalFiles: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }
}
