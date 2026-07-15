import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

@Injectable()
export class S3Service {
  private client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.client = new S3Client({
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      region: this.configService.get<string>('S3_REGION') || 'ru-1',
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>(
          'S3_SECRET_ACCESS_KEY',
        )!,
      },
      forcePathStyle: true,
      // Retry up to 3 times with exponential backoff + jitter.
      // The manual retry loop in FullSessionsService handles the rest.
      maxAttempts: 3,
      // Keep-alive connection pool + increased timeouts for TLS stability
      requestHandler: new NodeHttpHandler({
        requestTimeout: 30_000,
        connectionTimeout: 15_000,
        httpAgent: new HttpAgent({ keepAlive: true, maxSockets: 50 }),
        httpsAgent: new HttpsAgent({ keepAlive: true, maxSockets: 50 }),
      }),
    });
    this.bucket = this.configService.get<string>('S3_BUCKET')!;
  }

  async upload(buffer: Buffer, key: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
      }),
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'NotFound') {
        return false;
      }
      throw err;
    }
  }

  async getStream(key: string): Promise<Readable> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    const body = response.Body;
    // Convert Web ReadableStream → Node.js Readable if needed
    if (body instanceof Readable) return body;
    if (
      typeof body === 'object' &&
      body !== null &&
      Symbol.asyncIterator in body
    ) {
      return Readable.from(body as AsyncIterable<Uint8Array>);
    }
    throw new Error('Unexpected S3 response body type');
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  generateKey(originalName: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `originals/${year}/${month}/${timestamp}-${random}_${originalName}`;
  }
}
