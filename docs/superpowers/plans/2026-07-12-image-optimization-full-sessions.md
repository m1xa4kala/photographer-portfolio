# Image Optimization & Full Sessions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement WebP image optimization, 15-photo limit, and Full Session management with S3 storage and client download links.

**Architecture:** Three independent phases — (1) WebP compression in UploadController via Sharp, (2) 15-photo limit per PortfolioSession, (3) FullSession entity + S3 storage + admin page + public download page.

**Tech Stack:** NestJS, TypeORM, PostgreSQL, React 19, Vite, Sharp, @aws-sdk/client-s3, archiver

## Global Constraints

- All new backend files in `backend/src/` follow existing NestJS module conventions
- All new frontend files in `frontend/src/` follow existing hook/component patterns
- DTOs use `class-validator` decorators
- Admin endpoints prefixed `/api/admin/...` and guarded by `JwtAuthGuard`
- New entities go through TypeORM migration generation
- Frontend API calls through `api.ts` (Axios with JWT interceptor)
- Russian locale for all user-facing messages

---

## File Structure

### Phase 1 — WebP Optimization
| Action | File | Responsibility |
|--------|------|---------------|
| Install | `backend/package.json` | Add `sharp` dependency |
| Modify | `backend/src/upload/upload.controller.ts` | Add Sharp WebP conversion + resize |

### Phase 2 — 15 Photo Limit
| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `backend/src/content/controllers/admin-portfolio-photos.controller.ts` | Add count check before create |
| Modify | `frontend/src/pages/admin/PortfolioPhotosAdmin.tsx` | Hide DropZone when limit reached |
| Modify | `frontend/src/pages/admin/adminCrud.module.css` | Add limit message styles |

### Phase 3 — Full Sessions
| Action | File | Responsibility |
|--------|------|---------------|
| Install | `backend/package.json` | Add `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `archiver` |
| Create | `backend/src/s3/s3.module.ts` | NestJS module for S3 |
| Create | `backend/src/s3/s3.service.ts` | S3 upload/stream/delete methods |
| Create | `backend/src/content/entities/full-session.entity.ts` | FullSession entity |
| Create | `backend/src/content/entities/session-original-file.entity.ts` | SessionOriginalFile entity |
| Create | `backend/src/content/dtos/create-full-session.dto.ts` | Create DTO |
| Create | `backend/src/content/dtos/update-full-session.dto.ts` | Update DTO |
| Create | `backend/src/content/services/full-sessions.service.ts` | Business logic |
| Create | `backend/src/content/controllers/admin-full-sessions.controller.ts` | Admin CRUD + token endpoints |
| Modify | `backend/src/content/content.module.ts` | Register FullSession + controller + service |
| Modify | `backend/src/app.module.ts` | Import S3Module |
| Create | `backend/src/content/controllers/download.controller.ts` | Public download endpoints |
| Create | `backend/src/content/services/download.service.ts` | ZIP stream assembly |
| Create | `frontend/src/pages/admin/FullSessionsAdmin.tsx` | Admin page |
| Create | `frontend/src/pages/SessionDownload.tsx` | Public download page |
| Create | `frontend/src/pages/SessionDownload.module.css` | Download page styles |
| Modify | `frontend/src/types/index.ts` | Add FullSession + SessionOriginalFile types |
| Create | `frontend/src/hooks/admin/useAdminFullSessions.ts` | CRUD hook |
| Create | `frontend/src/hooks/admin/useAdminFullSessionFiles.ts` | File upload/delete hook |
| Modify | `frontend/src/hooks/index.ts` | Export new hooks |
| Modify | `frontend/src/App.tsx` | Add full-sessions + download routes |
| Modify | `frontend/src/pages/admin/AdminLayout.tsx` | Add sidebar link |

---

## Phase 1: WebP Optimization

### Task 1: Install Sharp dependency

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Install sharp**

```bash
cd backend && npm install sharp
```

- [ ] **Step 2: Verify installation**

```bash
cd backend && node -e "require('sharp')" && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/package.json backend/package-lock.json
git commit -m "chore: add sharp dependency for WebP conversion"
```

### Task 2: Update UploadController with Sharp WebP conversion

**Files:**
- Modify: `backend/src/upload/upload.controller.ts`

**Interfaces:**
- Produces: Upload endpoint returns WebP file URLs (same shape: `{ url: string }` / `{ urls: string[] }`)

- [ ] **Step 1: Read current UploadController**

Open and understand the current upload flow. It uses `FileInterceptor` / `FilesInterceptor` with multer and saves files via `fs.writeFileSync`. We intercept after multer writes the buffer, before the file is finalized.

- [ ] **Step 2: Update to convert via Sharp**

Import sharp, add a helper, and modify the save logic:

```typescript
import sharp from 'sharp';
import { randomBytes } from 'crypto';

// Helper: convert buffer to WebP (max 2000px, quality 85)
private async convertToWebP(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}
```

In the upload route, after receiving the file buffer:
1. Check if mime is `image/jpeg` or `image/png` (skip non-image files)
2. Call `convertToWebP(file.buffer)`
3. Generate WebP filename: `{timestamp}-{random6}.webp`
4. Write WebP buffer to disk
5. Return the WebP URL

Keep only the WebP file — delete the original. Non-image files pass through unchanged.

- [ ] **Step 3: Run tests to verify**

```bash
cd backend && npm test
cd backend && npm run build
```

Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add WebP conversion in UploadController via Sharp"
```

---

## Phase 2: 15 Photo Limit

### Task 3: Add backend check for 15-photo limit

**Files:**
- Modify: `backend/src/content/controllers/admin-portfolio-photos.controller.ts`

**Interfaces:**
- Produces: `AdminPortfolioPhotosController` rejects `POST` when session has >=15 photos with 400 error

- [ ] **Step 1: Read current controller**

Open `backend/src/content/controllers/admin-portfolio-photos.controller.ts` to see current structure.

- [ ] **Step 2: Add count check in create method**

Inject `@InjectRepository(PortfolioPhoto)` and check count before calling service:

```typescript
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioPhoto } from '../entities/portfolio-photo.entity';
import { BadRequestException } from '@nestjs/common';

// In constructor:
constructor(
  private readonly photosService: PortfolioPhotosService,
  @InjectRepository(PortfolioPhoto)
  private readonly photoRepo: Repository<PortfolioPhoto>,
) {}

// In create method:
@Post()
async create(@Body() createDto: CreatePortfolioPhotoDto) {
  const count = await this.photoRepo.count({ where: { sessionId: createDto.sessionId } });
  if (count >= 15) {
    throw new BadRequestException('В фотосессии не может быть больше 15 фото');
  }
  return this.photosService.create(createDto);
}
```

- [ ] **Step 3: Verify build**

```bash
cd backend && npm run build
```

Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add 15-photo limit per PortfolioSession"
```

### Task 4: Frontend — hide DropZone when limit reached

**Files:**
- Modify: `frontend/src/pages/admin/PortfolioPhotosAdmin.tsx`
- Modify: `frontend/src/pages/admin/adminCrud.module.css`

- [ ] **Step 1: Read current component**

Open `frontend/src/pages/admin/PortfolioPhotosAdmin.tsx` to understand the current flow.

- [ ] **Step 2: Add limit logic**

Find where `bulkSessionId` is used and after the filter, add:

```typescript
const selectedSessionPhotos = bulkSessionId
  ? items.filter(p => p.sessionId === bulkSessionId)
  : [];
const photoLimitReached = selectedSessionPhotos.length >= 15;
const remainingSlots = 15 - selectedSessionPhotos.length;
```

Replace the DropZone rendering section to conditionally show/hide:

```tsx
{bulkSessionId ? (
  photoLimitReached ? (
    <p className={styles.limitMessage}>
      ❌ Достигнут лимит в 15 фото для этой сессии.
    </p>
  ) : (
    <>
      <p className={styles.limitHint}>Осталось мест: {remainingSlots} / 15</p>
      <DropZone onUploadComplete={handleBulkUpload} />
    </>
  )
) : (
  <p className={styles.limitHint}>Выберите категорию и фотосессию</p>
)}
```

- [ ] **Step 3: Add CSS**

In `frontend/src/pages/admin/adminCrud.module.css`:

```css
.limitMessage {
  padding: 1rem;
  background: #fff3f3;
  border: 1px solid #ffcccc;
  border-radius: 8px;
  color: #cc3333;
  text-align: center;
  margin-top: 1rem;
}

.limitHint {
  color: #868e96;
  font-style: italic;
  margin-top: 1rem;
}
```

- [ ] **Step 4: Verify build**

```bash
cd frontend && npm run build
```

Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: hide DropZone and show limit message at 15 photos"
```

---

## Phase 3: Full Sessions

### Task 5: Install S3 and archiver dependencies

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Install dependencies**

```bash
cd backend && npm install @aws-sdk/client-s3 @aws-sdk/lib-storage archiver
```

- [ ] **Step 2: Verify**

```bash
cd backend && node -e "require('@aws-sdk/client-s3'); require('archiver'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/package.json backend/package-lock.json
git commit -m "chore: add @aws-sdk/client-s3 and archiver dependencies"
```

### Task 6: Create S3Module + S3Service

**Files:**
- Create: `backend/src/s3/s3.module.ts`
- Create: `backend/src/s3/s3.service.ts`

- [ ] **Step 1: Create S3Service**

```typescript
// backend/src/s3/s3.service.ts
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

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
        secretAccessKey: this.configService.get<string>('S3_SECRET_ACCESS_KEY')!,
      },
      forcePathStyle: true,
    });
    this.bucket = this.configService.get<string>('S3_BUCKET')!;
  }

  async upload(buffer: Buffer, key: string): Promise<void> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
    }));
  }

  async getStream(key: string): Promise<ReadableStream> {
    const response = await this.client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
    return response.Body as ReadableStream;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
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
```

- [ ] **Step 2: Create S3Module**

```typescript
// backend/src/s3/s3.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './s3.service';

@Module({
  imports: [ConfigModule],
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
```

- [ ] **Step 3: Verify build**

```bash
cd backend && npm run build
```

Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add S3Module and S3Service"
```

### Task 7: Create FullSession + SessionOriginalFile entities

**Files:**
- Create: `backend/src/content/entities/full-session.entity.ts`
- Create: `backend/src/content/entities/session-original-file.entity.ts`
- Modify: `backend/src/content/entities/index.ts`

- [ ] **Step 1: Create FullSession entity**

```typescript
// backend/src/content/entities/full-session.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { SessionOriginalFile } from './session-original-file.entity';

@Entity('full_sessions')
export class FullSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ nullable: true, type: 'text' })
  description!: string | null;

  @Column({ nullable: true, unique: true, type: 'varchar' })
  @Index()
  downloadToken!: string | null;

  @Column({ default: false })
  downloadsEnabled!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @OneToMany(() => SessionOriginalFile, (file) => file.fullSession)
  originalFiles!: SessionOriginalFile[];
}
```

- [ ] **Step 2: Create SessionOriginalFile entity**

```typescript
// backend/src/content/entities/session-original-file.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { FullSession } from './full-session.entity';

@Entity('session_original_files')
export class SessionOriginalFile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  fullSessionId!: number;

  @ManyToOne(() => FullSession, (session) => session.originalFiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fullSessionId' })
  fullSession!: FullSession;

  @Column()
  originalName!: string;

  @Column()
  s3Key!: string;

  @Column({ type: 'bigint', default: 0 })
  fileSize!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt!: Date;
}
```

- [ ] **Step 3: Register in index.ts**

```typescript
// backend/src/content/entities/index.ts — add:
export { FullSession } from './full-session.entity';
export { SessionOriginalFile } from './session-original-file.entity';
```

- [ ] **Step 4: Verify build**

```bash
cd backend && npm run build
```

Expected: Build succeeds

- [ ] **Step 5: Generate migration**

```bash
cd backend && npm run migration:generate -- src/migrations/AddFullSessionAndOriginalFiles
```

Check the generated migration — it should create `full_sessions` and `session_original_files` tables with all columns listed above.

- [ ] **Step 6: Run migration**

```bash
cd backend && npm run migration:run
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add FullSession and SessionOriginalFile entities with migration"
```

### Task 8: Create DTOs and FullSessionsService

**Files:**
- Create: `backend/src/content/dtos/create-full-session.dto.ts`
- Create: `backend/src/content/dtos/update-full-session.dto.ts`
- Create: `backend/src/content/services/full-sessions.service.ts`

- [ ] **Step 1: Create DTOs**

```typescript
// backend/src/content/dtos/create-full-session.dto.ts
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateFullSessionDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
```

```typescript
// backend/src/content/dtos/update-full-session.dto.ts
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateFullSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
```

- [ ] **Step 2: Create FullSessionsService**

```typescript
// backend/src/content/services/full-sessions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FullSession } from '../entities/full-session.entity';
import { SessionOriginalFile } from '../entities/session-original-file.entity';
import { CreateFullSessionDto } from '../dtos/create-full-session.dto';
import { UpdateFullSessionDto } from '../dtos/update-full-session.dto';
import { S3Service } from '../../s3/s3.service';
import * as crypto from 'crypto';

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

  async uploadFile(fullSessionId: number, buffer: Buffer, originalName: string, fileSize: number): Promise<SessionOriginalFile> {
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
```

- [ ] **Step 3: Verify build**

```bash
cd backend && npm run build
```

Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add FullSessionsService and DTOs"
```

### Task 9: Create AdminFullSessionsController

**Files:**
- Create: `backend/src/content/controllers/admin-full-sessions.controller.ts`
- Modify: `backend/src/content/content.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Create controller**

```typescript
// backend/src/content/controllers/admin-full-sessions.controller.ts
import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards,
  BadRequestException, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { FullSessionsService } from '../services/full-sessions.service';
import { CreateFullSessionDto } from '../dtos/create-full-session.dto';
import { UpdateFullSessionDto } from '../dtos/update-full-session.dto';

@Controller('admin/full-sessions')
@UseGuards(JwtAuthGuard)
export class AdminFullSessionsController {
  constructor(private readonly fullSessionsService: FullSessionsService) {}

  @Get()
  async findAll() {
    return this.fullSessionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.fullSessionsService.findOne(+id);
  }

  @Post()
  async create(@Body() dto: CreateFullSessionDto) {
    return this.fullSessionsService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateFullSessionDto) {
    return this.fullSessionsService.update(+id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.fullSessionsService.delete(+id);
    return { success: true };
  }

  @Post(':id/upload-files')
  @UseInterceptors(FilesInterceptor('files', 100))
  async uploadFiles(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    const results: any[] = [];
    for (const file of files) {
      const result = await this.fullSessionsService.uploadFile(+id, file.buffer, file.originalname, file.size);
      results.push(result);
    }
    return results;
  }

  @Delete(':id/files/:fileId')
  async deleteFile(@Param('id') id: string, @Param('fileId') fileId: string) {
    await this.fullSessionsService.deleteFile(+fileId);
    return { success: true };
  }

  @Post(':id/generate-token')
  async generateToken(@Param('id') id: string) {
    const token = await this.fullSessionsService.generateToken(+id);
    return { token, url: `/download/${token}` };
  }

  @Post(':id/revoke-token')
  async revokeToken(@Param('id') id: string) {
    await this.fullSessionsService.revokeToken(+id);
    return { success: true };
  }

  @Patch(':id/toggle-downloads')
  async toggleDownloads(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    await this.fullSessionsService.toggleDownloads(+id, body.enabled);
    return { success: true };
  }
}
```

- [ ] **Step 2: Register in ContentModule**

Update `backend/src/content/content.module.ts`:
- Add imports: `S3Module`, `TypeOrmModule.forFeature([FullSession, SessionOriginalFile])`, `MulterModule.register({ storage: memoryStorage() })`
- Add `AdminFullSessionsController` to controllers
- Add `FullSessionsService` to providers
- Add entities to TypeOrmModule.forFeature

- [ ] **Step 3: Register S3Module in AppModule**

In `backend/src/app.module.ts`, add `S3Module` to the imports array:

```typescript
import { S3Module } from './s3/s3.module';
// in @Module imports:
S3Module,
```

- [ ] **Step 4: Verify build**

```bash
cd backend && npm run build
```

Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add AdminFullSessionsController"
```

### Task 10: Add FullSession types and hooks

**Files:**
- Modify: `frontend/src/types/index.ts`
- Create: `frontend/src/hooks/admin/useAdminFullSessions.ts`
- Create: `frontend/src/hooks/admin/useAdminFullSessionFiles.ts`
- Modify: `frontend/src/hooks/index.ts`

- [ ] **Step 1: Add types to frontend**

```typescript
// In frontend/src/types/index.ts, add:

export interface FullSession {
  id: number;
  title: string;
  description: string | null;
  downloadToken: string | null;
  downloadsEnabled: boolean;
  createdAt: string;
  originalFiles?: SessionOriginalFile[];
}

export interface SessionOriginalFile {
  id: number;
  fullSessionId: number;
  originalName: string;
  s3Key: string;
  fileSize: number;
  uploadedAt: string;
}
```

- [ ] **Step 2: Create useAdminFullSessions hook**

```typescript
// frontend/src/hooks/admin/useAdminFullSessions.ts
import { useAdminCrud } from '../useAdminCrud';
import type { FullSession } from '../../types';

export const useAdminFullSessions = () => useAdminCrud<FullSession>('/admin/full-sessions');
```

- [ ] **Step 3: Create useAdminFullSessionFiles hook**

```typescript
// frontend/src/hooks/admin/useAdminFullSessionFiles.ts
import { useState, useCallback } from 'react';
import api from '../../services/api';
import type { SessionOriginalFile } from '../../types';

interface UseAdminFullSessionFilesReturn {
  files: SessionOriginalFile[];
  loading: boolean;
  error: string | null;
  fetchFiles: (sessionId: number) => Promise<void>;
  uploadFiles: (sessionId: number, fileList: File[]) => Promise<void>;
  deleteFile: (sessionId: number, fileId: number) => Promise<void>;
}

export const useAdminFullSessionFiles = (): UseAdminFullSessionFilesReturn => {
  const [files, setFiles] = useState<SessionOriginalFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async (sessionId: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/full-sessions/${sessionId}`);
      setFiles(res.data.originalFiles || []);
      setError(null);
    } catch {
      setError('Не удалось загрузить файлы');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFiles = useCallback(async (sessionId: number, fileList: File[]) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      fileList.forEach(f => formData.append('files', f));
      await api.post(`/admin/full-sessions/${sessionId}/upload-files`, formData);
      await fetchFiles(sessionId);
    } catch {
      setError('Не удалось загрузить файлы');
    } finally {
      setLoading(false);
    }
  }, [fetchFiles]);

  const deleteFile = useCallback(async (sessionId: number, fileId: number) => {
    try {
      await api.delete(`/admin/full-sessions/${sessionId}/files/${fileId}`);
      await fetchFiles(sessionId);
    } catch {
      setError('Не удалось удалить файл');
    }
  }, [fetchFiles]);

  return { files, loading, error, fetchFiles, uploadFiles, deleteFile };
};
```

- [ ] **Step 4: Export new hooks**

In `frontend/src/hooks/index.ts`:

```typescript
export { useAdminFullSessions } from './admin/useAdminFullSessions';
export { useAdminFullSessionFiles } from './admin/useAdminFullSessionFiles';
```

- [ ] **Step 5: Verify build**

```bash
cd frontend && npm run build
```

Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add FullSession types and frontend hooks"
```

### Task 11: Create FullSessionsAdmin page

**Files:**
- Create: `frontend/src/pages/admin/FullSessionsAdmin.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/admin/AdminLayout.tsx`

- [ ] **Step 1: Create FullSessionsAdmin page**

```tsx
// frontend/src/pages/admin/FullSessionsAdmin.tsx
import React, { useState, useEffect } from 'react';
import { useAdminFullSessions, useAdminFullSessionFiles } from '../../hooks';
import { confirmDelete } from '../../utils/confirmDelete';
import DropZone from '../../components/DropZone';
import type { FullSession } from '../../types';
import styles from './adminCrud.module.css';

const FullSessionsAdmin: React.FC = () => {
  const { items: sessions, loading, error, createItem, updateItem, deleteItem } = useAdminFullSessions();
  const { files, loading: filesLoading, uploadFiles, deleteFile } = useAdminFullSessionFiles();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<FullSession | null>(null);
  const [form, setForm] = useState({ title: '', description: '' });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [tokenUrl, setTokenUrl] = useState<string | null>(null);
  const [downloadsEnabled, setDownloadsEnabled] = useState(false);

  const selectedSession = sessions.find(s => s.id === selectedId);

  // Refresh when selection changes
  useEffect(() => {
    if (selectedId) {
      const s = sessions.find(x => x.id === selectedId);
      setTokenUrl(s?.downloadToken ? `/download/${s.downloadToken}` : null);
      setDownloadsEnabled(s?.downloadsEnabled ?? false);
    }
  }, [selectedId, sessions]);

  const handleSubmit = async () => {
    await (editing ? updateItem(editing.id, form) : createItem(form));
    setEditing(null);
    setForm({ title: '', description: '' });
  };

  const handleEdit = (s: FullSession) => {
    setEditing(s);
    setForm({ title: s.title, description: s.description || '' });
  };

  const handleFileUpload = async (uploadedFiles: { file: File }[]) => {
    if (!selectedId) return;
    setUploadError(null);
    try {
      await uploadFiles(selectedId, uploadedFiles.map(u => u.file));
    } catch {
      setUploadError('Ошибка загрузки файлов');
    }
  };

  const handleGenerateToken = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/admin/full-sessions/${selectedId}/generate-token`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      const data = await res.json();
      setTokenUrl(data.url);
    } catch { /* ignore */ }
  };

  const handleRevokeToken = async () => {
    if (!selectedId) return;
    await fetch(`/api/admin/full-sessions/${selectedId}/revoke-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    });
    setTokenUrl(null);
    setDownloadsEnabled(false);
  };

  const handleToggleDownloads = async (enabled: boolean) => {
    if (!selectedId) return;
    await fetch(`/api/admin/full-sessions/${selectedId}/toggle-downloads`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({ enabled }),
    });
    setDownloadsEnabled(enabled);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) return <div className={styles.crudPage}><p>Загрузка...</p></div>;
  if (error) return <div className={styles.crudPage}><div className={styles.error}>Ошибка: {error}</div></div>;

  return (
    <div className={styles.crudPage}>
      <h2>📦 Полные фотосессии</h2>

      {/* Create / Edit form */}
      <div className={styles.form}>
        <input
          type="text"
          placeholder="Название (например, Свадьба Ивана — оригиналы)"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="Описание (необязательно)"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
        <button onClick={handleSubmit}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && (
          <button onClick={() => { setEditing(null); setForm({ title: '', description: '' }); }}>
            Отмена
          </button>
        )}
      </div>

      {/* Sessions list */}
      <div className={styles.sectionCard}>
        <h3>Список полных фотосессий</h3>
        {sessions.map(s => (
          <div
            key={s.id}
            className={`${styles.listItem} ${selectedId === s.id ? styles.listItemActive : ''}`}
            onClick={() => setSelectedId(s.id)}
          >
            <span>{s.title}</span>
            <span className={styles.badge}>{s.originalFiles?.length || 0} файлов</span>
            <button onClick={e => { e.stopPropagation(); handleEdit(s); }}>✏️</button>
            <button onClick={e => {
              e.stopPropagation();
              if (confirmDelete(`полную сессию "${s.title}"`)) {
                deleteItem(s.id);
                if (selectedId === s.id) setSelectedId(null);
              }
            }}>🗑️</button>
          </div>
        ))}
        {sessions.length === 0 && <p className={styles.hint}>Нет полных фотосессий</p>}
      </div>

      {/* Selected session detail */}
      {selectedSession && (
        <div className={styles.sectionCard}>
          <h3>📂 {selectedSession.title}</h3>

          <h4>Загрузка файлов</h4>
          <DropZone onUploadComplete={handleFileUpload} />
          {uploadError && <div className={styles.error}>{uploadError}</div>}

          <h4>Файлы ({files.length} шт.)</h4>
          {filesLoading ? (
            <p>Загрузка...</p>
          ) : (
            <div className={styles.fileList}>
              {files.map(f => (
                <div key={f.id} className={styles.fileItem}>
                  <span>{f.originalName}</span>
                  <span className={styles.fileSize}>{formatSize(f.fileSize)}</span>
                  <button onClick={async () => {
                    if (confirmDelete(`файл "${f.originalName}"`)) {
                      await deleteFile(selectedSession.id, f.id);
                    }
                  }}>🗑️</button>
                </div>
              ))}
              {files.length === 0 && <p className={styles.hint}>Файлы не загружены</p>}
            </div>
          )}

          <h4>🔗 Ссылка для скачивания</h4>
          {tokenUrl ? (
            <div className={styles.tokenSection}>
              <p>
                Ссылка:{' '}
                <a href={tokenUrl} target="_blank" rel="noopener noreferrer">
                  {window.location.origin}{tokenUrl}
                </a>
              </p>
              <div className={styles.formRow}>
                <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}${tokenUrl}`)}>
                  📋 Скопировать
                </button>
                <button onClick={handleRevokeToken}>🚫 Отозвать</button>
              </div>
              <div className={styles.formRow}>
                <label>
                  <input
                    type="checkbox"
                    checked={downloadsEnabled}
                    onChange={e => handleToggleDownloads(e.target.checked)}
                  />{' '}
                  Разрешить скачивание
                </label>
              </div>
            </div>
          ) : (
            <button onClick={handleGenerateToken}>🔗 Создать ссылку</button>
          )}
        </div>
      )}
    </div>
  );
};

export default FullSessionsAdmin;
```

Add the required CSS to `frontend/src/pages/admin/adminCrud.module.css`:

```css
.sectionCard {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.listItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.listItem:hover {
  background: #e9ecef;
}

.listItemActive {
  background: #d0ebff;
  border: 1px solid #74c0fc;
}

.badge {
  background: #dee2e6;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-left: auto;
}

.fileList {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.fileItem {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.fileItem span:first-child {
  flex: 1;
}

.fileSize {
  color: #868e96;
  font-size: 0.85rem;
}

.tokenSection {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 1rem;
}

.formRow {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  align-items: center;
}

.hint {
  color: #868e96;
  font-style: italic;
}
```

- [ ] **Step 2: Add route in App.tsx**

```typescript
import FullSessionsAdmin from './pages/admin/FullSessionsAdmin';

// Under admin routes:
<Route path="full-sessions" element={<FullSessionsAdmin />} />
```

- [ ] **Step 3: Add sidebar link**

In `AdminLayout.tsx`:

```tsx
<li><Link to="/admin/full-sessions">📦 Полные сессии</Link></li>
```

- [ ] **Step 4: Verify build**

```bash
cd frontend && npm run build
```

Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add FullSessionsAdmin page"
```

### Task 12: Create download page and public download controller

**Files:**
- Create: `backend/src/content/controllers/download.controller.ts`
- Create: `backend/src/content/services/download.service.ts`
- Modify: `backend/src/content/content.module.ts`
- Create: `frontend/src/pages/SessionDownload.tsx`
- Create: `frontend/src/pages/SessionDownload.module.css`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create DownloadService**

```typescript
// backend/src/content/services/download.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import * as archiver from 'archiver';
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
    if (!session.downloadsEnabled) throw new ForbiddenException('Скачивание отключено');

    const totalSize = session.originalFiles.reduce((sum, f) => sum + Number(f.fileSize), 0);
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
    if (!session.downloadsEnabled) throw new ForbiddenException('Скачивание отключено');
    if (session.originalFiles.length === 0) throw new NotFoundException('Оригиналы ещё не загружены');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(session.title)}.zip"`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.pipe(res);

    for (const file of session.originalFiles) {
      const stream = await this.s3Service.getStream(file.s3Key);
      archive.append(stream, { name: file.originalName });
    }

    await archive.finalize();
  }
}
```

- [ ] **Step 2: Create DownloadController**

```typescript
// backend/src/content/controllers/download.controller.ts
import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { DownloadService } from '../services/download.service';

@Controller('content')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Get('full-session-by-token/:token')
  async getSessionByToken(@Param('token') token: string) {
    return this.downloadService.getSessionByToken(token);
  }

  @Get('download-session/:token')
  async downloadSession(@Param('token') token: string, @Res() res: Response) {
    await this.downloadService.streamZip(token, res);
  }
}
```

- [ ] **Step 3: Register in ContentModule**

In `backend/src/content/content.module.ts`:
- Add `DownloadController` to controllers
- Add `DownloadService` to providers

- [ ] **Step 4: Create SessionDownload page**

```tsx
// frontend/src/pages/SessionDownload.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import styles from './SessionDownload.module.css';

interface SessionInfo {
  title: string;
  description: string | null;
  fileCount: number;
  totalSize: number;
}

const SessionDownload: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const fetchSession = async () => {
      try {
        const res = await api.get(`/content/full-session-by-token/${token}`);
        setSession(res.data);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 403) setError('Ссылка скачивания отключена. Обратитесь к фотографу.');
        else if (status === 404) setError('Сессия не найдена. Проверьте ссылку.');
        else setError('Не удалось загрузить информацию о сессии');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [token]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.card}><p>Загрузка...</p></div>
    </div>
  );

  if (error) return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>😕</h1>
        <p className={styles.error}>{error}</p>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>📸 {session?.title}</h1>
        {session?.description && <p className={styles.description}>{session.description}</p>}
        <p className={styles.info}>
          {session?.fileCount} файлов • {formatSize(session?.totalSize || 0)}
        </p>
        <a
          href={`/api/content/download-session/${token}`}
          className={styles.downloadBtn}
        >
          ⬇ Скачать все фото (архив ZIP)
        </a>
      </div>
    </div>
  );
};

export default SessionDownload;
```

- [ ] **Step 4.5: Create CSS**

```css
/* frontend/src/pages/SessionDownload.module.css */
.container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 2rem;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);
  max-width: 500px;
  width: 100%;
}

.card h1 {
  margin: 0 0 1rem;
  font-size: 1.5rem;
}

.description {
  color: #666;
  margin-bottom: 1rem;
}

.info {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 2rem;
}

.downloadBtn {
  display: inline-block;
  background: #228be6;
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 600;
  transition: background 0.2s;
}

.downloadBtn:hover {
  background: #1c7ed6;
}

.error {
  color: #e03131;
}
```

- [ ] **Step 5: Add route in App.tsx**

```typescript
import SessionDownload from './pages/SessionDownload';

// As a public route (outside Layout, no header/footer):
<Route path="/download/:token" element={<SessionDownload />} />
```

- [ ] **Step 6: Verify build**

```bash
cd frontend && npm run build
cd backend && npm run build
```

Expected: Both builds succeed

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add download controller and SessionDownload page"
```

### Task 13: Final verification

- [ ] **Step 1: Run both builds**

```bash
cd backend && npm run build
cd frontend && npm run build
```

- [ ] **Step 2: Run backend tests**

```bash
cd backend && npm test
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

- [ ] **Step 4: Final commit if any fixes**

```bash
git add .
git commit -m "chore: final fixes after full implementation"
```
