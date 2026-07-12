import { Injectable, NotFoundException } from '@nestjs/common';
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
      relations: ['originalFiles'],
    });
  }

  async findOne(id: number): Promise<FullSession> {
    const session = await this.fullSessionRepo.findOne({
      where: { id },
      relations: ['originalFiles'],
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
    for (const file of session.originalFiles) {
      await this.s3Service.delete(file.s3Key).catch(() => {});
    }
    await this.fullSessionRepo.remove(session);
  }

  async uploadFile(
    fullSessionId: number,
    buffer: Buffer,
    originalName: string,
    fileSize: number,
  ): Promise<SessionOriginalFile> {
    const session = await this.findOne(fullSessionId);
    const s3Key = this.s3Service.generateKey(originalName);
    await this.s3Service.upload(buffer, s3Key);
    const file = this.originalFileRepo.create({
      fullSessionId: session.id,
      originalName,
      s3Key,
      fileSize,
    });
    return this.originalFileRepo.save(file);
  }

  async deleteFile(fileId: number): Promise<void> {
    const file = await this.originalFileRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    await this.s3Service.delete(file.s3Key).catch(() => {});
    await this.originalFileRepo.remove(file);
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
      relations: ['originalFiles'],
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }
}
