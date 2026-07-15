import { Injectable, NotFoundException } from '@nestjs/common';

export interface UploadStatus {
  uploadId: string;
  total: number;
  completed: number;
  failed: number;
  errors: string[];
  status: 'uploading' | 'completed' | 'error' | 'partial';
  message?: string;
  retryCount: number;
}

@Injectable()
export class UploadStatusService {
  private store = new Map<string, UploadStatus>();

  create(uploadId: string, total: number): UploadStatus {
    const status: UploadStatus = {
      uploadId,
      total,
      completed: 0,
      failed: 0,
      errors: [],
      status: 'uploading',
      retryCount: 0,
    };
    this.store.set(uploadId, status);
    return status;
  }

  update(uploadId: string, partial: Partial<UploadStatus>): UploadStatus {
    const existing = this.store.get(uploadId);
    if (!existing) {
      throw new NotFoundException(`Upload ${uploadId} not found`);
    }
    Object.assign(existing, partial);
    return existing;
  }

  get(uploadId: string): UploadStatus | undefined {
    return this.store.get(uploadId);
  }

  getOrThrow(uploadId: string): UploadStatus {
    const status = this.store.get(uploadId);
    if (!status) {
      throw new NotFoundException(`Upload ${uploadId} not found`);
    }
    return status;
  }

  delete(uploadId: string): void {
    this.store.delete(uploadId);
  }

  incrementCompleted(uploadId: string): UploadStatus {
    const status = this.getOrThrow(uploadId);
    status.completed++;
    return status;
  }

  incrementFailed(uploadId: string, error: string): UploadStatus {
    const status = this.getOrThrow(uploadId);
    status.failed++;
    status.errors.push(error);
    return status;
  }

  incrementRetry(uploadId: string): UploadStatus {
    const status = this.getOrThrow(uploadId);
    status.retryCount++;
    return status;
  }
}
