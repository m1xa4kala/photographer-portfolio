# Wedding Packages Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated wedding page (`/wedding`) with package cards and FAQ, plus admin CRUD for both WeddingPackage and WeddingFaqItem entities.

**Architecture:** Two new entities in the existing `ContentModule`. Each follows the exact pattern of `PriceItem` (entity → DTO → service → admin controller + public controller method). The WeddingPackage has a JSON column `prices` for 1–3 price options. WeddingFaqItem is a simple question-answer pair. Frontend follows existing patterns: typed hooks, lazy-loaded admin pages, DraggableTable-based CRUD.

**Tech Stack:** NestJS + TypeORM (backend), React 19 + TypeScript + CSS Modules (frontend), PostgreSQL (DB), class-validator (DTO validation).

**Design doc:** `docs/superpowers/specs/2026-11-02-wedding-packages-design.md`

## Global Constraints

- All backend entities/services/controllers go into `content.module.ts` (not separate module)
- Admin controllers use `@UseGuards(JwtAuthGuard)` and are prefixed `/admin/entity-name`
- Public endpoints go into `PublicContentController` at `@Controller('content')`
- All entities with `orderIndex` support `PATCH /reorder` using shared `ReorderDto`
- Frontend admin pages use `Suspense` + `lazy()` loading pattern
- Frontend hooks are typed wrappers around `useAdminCrud` or `useFetch`
- CSS Modules for all styling
- Prices JSON: array of `{ label: string, amount: string }`, validated 1–3 items

---
:litigator

### Task 1: Migration — create wedding_packages + wedding_faq_items tables

**Files:**
- Create: `backend/src/migrations/{timestamp}-CreateWeddingTables.ts`

**Interfaces:**
- Consumes: nothing
- Produces: migration file that creates both tables

- [ ] **Step 1: Get current timestamp**

```bash
node -e "console.log(Date.now())"
```

- [ ] **Step 2: Create migration file**

```
backend/src/migrations/{ts}-CreateWeddingTables.ts
```

Migration content:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWeddingTables{ts} implements MigrationInterface {
  name = 'CreateWeddingTables{ts}';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "wedding_packages" (
        "id" SERIAL NOT NULL,
        "name" character varying(255) NOT NULL,
        "duration" character varying(255) NOT NULL,
        "includes" text DEFAULT NULL,
        "imageUrl" character varying(500) DEFAULT NULL,
        "prices" json NOT NULL DEFAULT '[]',
        "orderIndex" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_wedding_packages" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "wedding_faq_items" (
        "id" SERIAL NOT NULL,
        "question" character varying(500) NOT NULL,
        "answer" text NOT NULL,
        "orderIndex" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_wedding_faq_items" PRIMARY KEY ("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "wedding_faq_items"`);
    await queryRunner.query(`DROP TABLE "wedding_packages"`);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/migrations/{ts}-CreateWeddingTables.ts
git commit -m "feat: add wedding_packages and wedding_faq_items tables migration"
```

---

### Task 2: Backend WeddingPackage — entity, DTOs, service, controller

**Files:**
- Create: `backend/src/content/entities/wedding-package.entity.ts`
- Create: `backend/src/content/dtos/create-wedding-package.dto.ts`
- Create: `backend/src/content/dtos/update-wedding-package.dto.ts`
- Create: `backend/src/content/services/wedding-packages.service.ts`
- Create: `backend/src/content/controllers/admin-wedding-packages.controller.ts`

**Interfaces:**
- Consumes: shared `ReorderDto` from `backend/src/content/dtos/reorder.dto.ts`
- Produces: `WeddingPackageService` (findAll, findOne, create, update, delete, reorder) and `AdminWeddingPackagesController`

- [ ] **Step 1: Create entity**

```typescript
// backend/src/content/entities/wedding-package.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export interface PriceOption {
  label: string;
  amount: string;
}

@Entity('wedding_packages')
export class WeddingPackage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  duration!: string;

  @Column('text', { nullable: true })
  includes!: string | null;

  @Column({ nullable: true })
  imageUrl!: string | null;

  @Column('json', { default: [] })
  prices!: PriceOption[];

  @Column({ default: 0 })
  orderIndex!: number;
}
```

- [ ] **Step 2: Create CreateWeddingPackageDto**

```typescript
// backend/src/content/dtos/create-wedding-package.dto.ts
import {
  IsString, IsNotEmpty, IsOptional, IsArray,
  ArrayMinSize, ArrayMaxSize, ValidateNested, IsInt, Min, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PriceOptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  amount!: string;
}

export class CreateWeddingPackageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  duration!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  includes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => PriceOptionDto)
  prices!: PriceOptionDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
```

- [ ] **Step 3: Create UpdateWeddingPackageDto**

```typescript
// backend/src/content/dtos/update-wedding-package.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateWeddingPackageDto } from './create-wedding-package.dto';

export class UpdateWeddingPackageDto extends PartialType(CreateWeddingPackageDto) {}
```

- [ ] **Step 4: Create WeddingPackagesService**

```typescript
// backend/src/content/services/wedding-packages.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeddingPackage } from '../entities/wedding-package.entity';
import { CreateWeddingPackageDto } from '../dtos/create-wedding-package.dto';
import { UpdateWeddingPackageDto } from '../dtos/update-wedding-package.dto';
import { ReorderDto } from '../dtos/reorder.dto';

@Injectable()
export class WeddingPackagesService {
  constructor(
    @InjectRepository(WeddingPackage)
    private repo: Repository<WeddingPackage>,
  ) {}

  async findAll(limit: number = 100, offset: number = 0): Promise<WeddingPackage[]> {
    return this.repo.find({
      order: { orderIndex: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  async findOne(id: number): Promise<WeddingPackage> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Wedding package with id ${id} not found`);
    }
    return item;
  }

  async create(dto: CreateWeddingPackageDto): Promise<WeddingPackage> {
    const max = await this.repo.maximum('orderIndex');
    const newItem = this.repo.create({ ...dto, orderIndex: (max ?? -1) + 1 });
    return this.repo.save(newItem);
  }

  async update(id: number, dto: UpdateWeddingPackageDto): Promise<WeddingPackage> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async delete(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Wedding package with id ${id} not found`);
    }
  }

  async reorder(dto: ReorderDto): Promise<void> {
    const queryRunner = this.repo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const { id, orderIndex } of dto.items) {
        await queryRunner.manager.update(this.repo.metadata.target, id, { orderIndex });
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
```

- [ ] **Step 5: Create AdminWeddingPackagesController**

```typescript
// backend/src/content/controllers/admin-wedding-packages.controller.ts
import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { WeddingPackagesService } from '../services/wedding-packages.service';
import { CreateWeddingPackageDto } from '../dtos/create-wedding-package.dto';
import { UpdateWeddingPackageDto } from '../dtos/update-wedding-package.dto';
import { ReorderDto } from '../dtos/reorder.dto';

@Controller('admin/wedding-packages')
@UseGuards(JwtAuthGuard)
export class AdminWeddingPackagesController {
  constructor(private weddingPackagesService: WeddingPackagesService) {}

  @Get()
  async findAll() {
    return this.weddingPackagesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.weddingPackagesService.findOne(numericId);
  }

  @Post()
  async create(@Body() createDto: CreateWeddingPackageDto) {
    return this.weddingPackagesService.create(createDto);
  }

  @Patch('reorder')
  async reorder(@Body() reorderDto: ReorderDto) {
    return this.weddingPackagesService.reorder(reorderDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateWeddingPackageDto) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.weddingPackagesService.update(numericId, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.weddingPackagesService.delete(numericId);
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/content/entities/wedding-package.entity.ts \
       backend/src/content/dtos/create-wedding-package.dto.ts \
       backend/src/content/dtos/update-wedding-package.dto.ts \
       backend/src/content/services/wedding-packages.service.ts \
       backend/src/content/controllers/admin-wedding-packages.controller.ts
git commit -m "feat: add WeddingPackage entity, DTOs, service, and admin controller"
```

---

### Task 3: Backend WeddingFaqItem — entity, DTOs, service, controller

**Files:**
- Create: `backend/src/content/entities/wedding-faq-item.entity.ts`
- Create: `backend/src/content/dtos/create-wedding-faq-item.dto.ts`
- Create: `backend/src/content/dtos/update-wedding-faq-item.dto.ts`
- Create: `backend/src/content/services/wedding-faq-items.service.ts`
- Create: `backend/src/content/controllers/admin-wedding-faq.controller.ts`

**Interfaces:**
- Consumes: shared `ReorderDto`
- Produces: `WeddingFaqItemsService` and `AdminWeddingFaqController`

- [ ] **Step 1: Create entity**

```typescript
// backend/src/content/entities/wedding-faq-item.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('wedding_faq_items')
export class WeddingFaqItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  question!: string;

  @Column('text')
  answer!: string;

  @Column({ default: 0 })
  orderIndex!: number;
}
```

- [ ] **Step 2: Create CreateWeddingFaqItemDto**

```typescript
// backend/src/content/dtos/create-wedding-faq-item.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, MaxLength } from 'class-validator';

export class CreateWeddingFaqItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  answer!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
```

- [ ] **Step 3: Create UpdateWeddingFaqItemDto**

```typescript
// backend/src/content/dtos/update-wedding-faq-item.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateWeddingFaqItemDto } from './create-wedding-faq-item.dto';

export class UpdateWeddingFaqItemDto extends PartialType(CreateWeddingFaqItemDto) {}
```

- [ ] **Step 4: Create WeddingFaqItemsService**

Identical pattern to `WeddingPackagesService` but operating on `WeddingFaqItem` entity.

- [ ] **Step 5: Create AdminWeddingFaqController**

Identical pattern to `AdminWeddingPackagesController` at path `admin/wedding-faq`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/content/entities/wedding-faq-item.entity.ts \
       backend/src/content/dtos/create-wedding-faq-item.dto.ts \
       backend/src/content/dtos/update-wedding-faq-item.dto.ts \
       backend/src/content/services/wedding-faq-items.service.ts \
       backend/src/content/controllers/admin-wedding-faq.controller.ts
git commit -m "feat: add WeddingFaqItem entity, DTOs, service, and admin controller"
```

---

### Task 4: Module registration + public content endpoints

**Files:**
- Modify: `backend/src/content/content.module.ts`
- Modify: `backend/src/content/controllers/public-content.controller.ts`

**Interfaces:**
- Consumes: both new entities, services, and controllers from tasks 2-3
- Produces: registered module with public endpoints

- [ ] **Step 1: Update content.module.ts**

Add to `imports.TypeOrmModule.forFeature([...])`:
```typescript
WeddingPackage,
WeddingFaqItem,
```

Add to `providers` and `exports`:
```typescript
WeddingPackagesService,
WeddingFaqItemsService,
```

Add to `controllers`:
```typescript
AdminWeddingPackagesController,
AdminWeddingFaqController,
```

Add imports at top of file:
```typescript
import { WeddingPackage } from './entities/wedding-package.entity';
import { WeddingFaqItem } from './entities/wedding-faq-item.entity';
import { WeddingPackagesService } from './services/wedding-packages.service';
import { WeddingFaqItemsService } from './services/wedding-faq-items.service';
import { AdminWeddingPackagesController } from './controllers/admin-wedding-packages.controller';
import { AdminWeddingFaqController } from './controllers/admin-wedding-faq.controller';
```

- [ ] **Step 2: Update public-content.controller.ts**

Add to constructor injection:
```typescript
private weddingPackagesService: WeddingPackagesService,
private weddingFaqItemsService: WeddingFaqItemsService,
```

Add new endpoints:
```typescript
@Get('wedding-packages')
async getWeddingPackages(@Query('limit') limit?: number, @Query('offset') offset?: number) {
  return this.weddingPackagesService.findAll(limit ?? 100, offset ?? 0);
}

@Get('wedding-faq')
async getWeddingFaq(@Query('limit') limit?: number, @Query('offset') offset?: number) {
  return this.weddingFaqItemsService.findAll(limit ?? 100, offset ?? 0);
}
```

Add imports:
```typescript
import { WeddingPackagesService } from '../services/wedding-packages.service';
import { WeddingFaqItemsService } from '../services/wedding-faq-items.service';
```

- [ ] **Step 3: Run migration to create tables in DB**

```bash
npm run migration:run
```

- [ ] **Step 4: Quick build check**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/content/content.module.ts \
       backend/src/content/controllers/public-content.controller.ts
git commit -m "feat: register WeddingPackage and WeddingFaqItem modules, add public endpoints"
```

---

### Task 5: Frontend types + hooks

**Files:**
- Modify: `frontend/src/types/index.ts`
- Create: `frontend/src/hooks/admin/useAdminWeddingPackages.ts`
- Create: `frontend/src/hooks/admin/useAdminWeddingFaqItems.ts`
- Create: `frontend/src/hooks/useWeddingPackages.ts`
- Create: `frontend/src/hooks/useWeddingFaqItems.ts`
- Modify: `frontend/src/hooks/index.ts`

**Interfaces:**
- Consumes: backend API endpoints
- Produces: typed hooks consumed by frontend pages

- [ ] **Step 1: Add types to index.ts**

```typescript
export interface WeddingPackage {
  id: number;
  name: string;
  duration: string;
  includes: string | null;
  imageUrl: string | null;
  prices: { label: string; amount: string }[];
  orderIndex?: number;
}

export interface WeddingFaqItem {
  id: number;
  question: string;
  answer: string;
  orderIndex?: number;
}
```

- [ ] **Step 2: Create useAdminWeddingPackages.ts**

```typescript
// frontend/src/hooks/admin/useAdminWeddingPackages.ts
import { type WeddingPackage } from '../../types';
import { useAdminCrud } from '../useAdminCrud';
import type { ReorderItem } from '../useAdminCrud';

interface UseAdminWeddingPackagesReturn {
  items: WeddingPackage[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<WeddingPackage, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<WeddingPackage, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  reorderItems: (items: ReorderItem[]) => Promise<void>;
}

export const useAdminWeddingPackages = (): UseAdminWeddingPackagesReturn => {
  return useAdminCrud<WeddingPackage>('/admin/wedding-packages');
};
```

- [ ] **Step 3: Create useAdminWeddingFaqItems.ts**

Same pattern but for `WeddingFaqItem` at `/admin/wedding-faq`.

- [ ] **Step 4: Create useWeddingPackages.ts**

```typescript
// frontend/src/hooks/useWeddingPackages.ts
import { useFetch } from './useFetch';
import { type WeddingPackage } from '../types';

interface UseWeddingPackagesReturn {
  items: WeddingPackage[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useWeddingPackages = (): UseWeddingPackagesReturn => {
  const { data, loading, error, refetch } = useFetch<WeddingPackage[]>('/content/wedding-packages');
  return {
    items: data ?? [],
    loading,
    error,
    refetch,
  };
};
```

- [ ] **Step 5: Create useWeddingFaqItems.ts**

Same pattern for `/content/wedding-faq` returning `WeddingFaqItem[]`.

- [ ] **Step 6: Update hooks/index.ts**

Add exports:
```typescript
export { useWeddingPackages } from './useWeddingPackages';
export { useWeddingFaqItems } from './useWeddingFaqItems';
export { useAdminWeddingPackages } from './admin/useAdminWeddingPackages';
export { useAdminWeddingFaqItems } from './admin/useAdminWeddingFaqItems';
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/types/index.ts \
       frontend/src/hooks/admin/useAdminWeddingPackages.ts \
       frontend/src/hooks/admin/useAdminWeddingFaqItems.ts \
       frontend/src/hooks/useWeddingPackages.ts \
       frontend/src/hooks/useWeddingFaqItems.ts \
       frontend/src/hooks/index.ts
git commit -m "feat: add wedding package and FAQ types and hooks"
```

---

### Task 6: Frontend WeddingCard component

**Files:**
- Create: `frontend/src/components/WeddingCard/WeddingCard.tsx`
- Create: `frontend/src/components/WeddingCard/WeddingCard.module.css`

**Interfaces:**
- Consumes: `WeddingPackage` type
- Produces: `<WeddingCard item={package} />` — reusable card component

- [ ] **Step 1: Create WeddingCard.tsx**

```tsx
// frontend/src/components/WeddingCard/WeddingCard.tsx
import React from 'react';
import type { WeddingPackage } from '../../types';
import styles from './WeddingCard.module.css';

interface WeddingCardProps {
  item: WeddingPackage;
}

const WeddingCard: React.FC<WeddingCardProps> = ({ item }) => (
  <article className={styles.card}>
    <div className={styles.photoWrapper}>
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} className={styles.photo} loading="lazy" />
      ) : (
        <div className={styles.photoPlaceholder} />
      )}
      <div className={styles.overlay}>
        <h3 className={styles.overlayTitle}>{item.name}</h3>
      </div>
    </div>

    <div className={styles.body}>
      <div className={styles.duration}>
        <span className={styles.durationIcon}>⏱</span>
        <span>{item.duration}</span>
      </div>

      {item.includes && (
        <ul className={styles.includesList}>
          {item.includes.split('\n').filter(Boolean).map((line, i) => (
            <li key={i} className={styles.includesItem}>{line}</li>
          ))}
        </ul>
      )}

      <div className={styles.pricesSection}>
        {item.prices.map((opt, i) => (
          <div key={i} className={styles.priceOption}>
            <span className={styles.priceLabel}>{opt.label}</span>
            <span className={styles.priceAmount}>{opt.amount} ₽</span>
          </div>
        ))}
      </div>
    </div>
  </article>
);

export default WeddingCard;
```

- [ ] **Step 2: Create WeddingCard.module.css**

Styles matching the existing design system (PriceCard but restructured for wedding layout):
- `.card` — same card base as PriceCard
- `.photoWrapper` / `.photo` / `.photoPlaceholder` / `.overlay` / `.overlayTitle` — same photo overlay pattern
- `.body` — flexible section below photo
- `.duration` — row with clock icon + text
- `.includesList` — bullet list (same as PriceCard description list)
- `.includesItem` — list item with `•` prefix
- `.pricesSection` — flex row at bottom for price options
- `.priceOption` — rounded pill/chip
- `.priceLabel` — label text
- `.priceAmount` — price text (bold)

Use CSS variables from the existing system: `var(--card-bg)`, `var(--border)`, `var(--accent)`, `var(--text-secondary)`, `var(--shadow)`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/WeddingCard/WeddingCard.tsx \
       frontend/src/components/WeddingCard/WeddingCard.module.css
git commit -m "feat: add WeddingCard component with photo overlay, duration, includes, and price options"
```

---

### Task 7: Frontend public Wedding page

**Files:**
- Create: `frontend/src/pages/Wedding.tsx`
- Create: `frontend/src/pages/Wedding.module.css`

**Interfaces:**
- Consumes: `useWeddingPackages`, `useWeddingFaqItems` hooks, `WeddingCard` component
- Produces: public page at `/wedding`

- [ ] **Step 1: Create Wedding.tsx**

```tsx
// frontend/src/pages/Wedding.tsx
import React, { useState, useCallback } from 'react';
import { useWeddingPackages, useWeddingFaqItems } from '../hooks';
import AnimatedSection from '../components/AnimatedSection';
import ErrorState from '../components/ErrorState/ErrorState';
import Skeleton from '../components/Skeleton';
import WeddingCard from '../components/WeddingCard/WeddingCard';
import styles from './Wedding.module.css';

const WeddingSkeleton: React.FC = () => (
  <AnimatedSection>
    <section className={styles.wedding}>
      <Skeleton variant="text" width="250px" height="2.5rem" style={{ margin: '0 auto 2rem' }} />
      <div className={styles.grid}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <Skeleton variant="rect" width="100%" height="320px" style={{ borderRadius: '1rem 1rem 0 0' }} />
            <div className={styles.skeletonBody}>
              <Skeleton variant="text" width="60%" height="1.5rem" style={{ marginBottom: '0.5rem' }} />
              <Skeleton variant="text" width="100%" height="0.85rem" />
              <Skeleton variant="text" width="80%" height="0.85rem" />
              <Skeleton variant="text" width="100px" height="1.5rem" style={{ marginTop: '1rem' }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  </AnimatedSection>
);

const Wedding: React.FC = () => {
  const { items: packages, loading: packagesLoading, error: packagesError, refetch: refetchPackages } = useWeddingPackages();
  const { items: faqItems, loading: faqLoading, error: faqError } = useWeddingFaqItems();
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  const toggleFaq = useCallback((id: number) => {
    setOpenFaqId(prev => prev === id ? null : id);
  }, []);

  if (packagesLoading || faqLoading) {
    return <WeddingSkeleton />;
  }

  if (packagesError) {
    return <ErrorState message={packagesError} onRetry={refetchPackages} />;
  }

  return (
    <AnimatedSection>
      <section className={styles.wedding}>
        <h1>Свадебные пакеты</h1>

        {packages.length === 0 ? (
          <p className={styles.emptyState}>Ещё нет свадебных пакетов</p>
        ) : (
          <div className={styles.grid}>
            {packages.map((pkg) => (
              <WeddingCard key={pkg.id} item={pkg} />
            ))}
          </div>
        )}

        {faqItems.length > 0 && (
          <div className={styles.faqSection}>
            <h2 className={styles.faqTitle}>Часто задаваемые вопросы</h2>
            <div className={styles.faqList}>
              {faqItems.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div key={faq.id} className={styles.faqItem} onClick={() => toggleFaq(faq.id)}>
                    <div className={styles.faqQuestion}>
                      <span>{faq.question}</span>
                      <span className={styles.faqArrow}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                    {isOpen && (
                      <div className={styles.faqAnswer}>
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </AnimatedSection>
  );
};

export default Wedding;
```

- [ ] **Step 2: Create Wedding.module.css**

```css
/* frontend/src/pages/Wedding.module.css */

.wedding {
  max-width: 1000px;
  margin: 0 auto;
}

.wedding h1 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: var(--accent);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem 2rem;
  margin-bottom: 0.5rem;
}

/* Skeleton */
.skeletonCard {
  break-inside: avoid;
  margin-bottom: 2rem;
  background-color: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 1rem;
  overflow: hidden;
}

.skeletonBody {
  padding: 1rem 1.25rem;
}

/* Empty state */
.emptyState {
  text-align: center;
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 3rem 0;
}

/* FAQ section */
.faqSection {
  margin-top: 3rem;
}

.faqTitle {
  text-align: center;
  font-size: 1.8rem;
  color: var(--accent);
  margin-bottom: 1.5rem;
}

.faqList {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.faqItem {
  background-color: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.faqItem:hover {
  box-shadow: 0 2px 8px var(--shadow);
}

.faqQuestion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--text-primary);
  gap: 0.75rem;
}

.faqArrow {
  color: var(--accent);
  font-size: 0.85rem;
}

.faqAnswer {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.faqAnswer p {
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
```

- [ ] **Step 3: Add route for /wedding in App.tsx**

In the public routes section (`<Route path="/" element={<Layout />}>`), add:
```typescript
<Route path="wedding" element={<Wedding />} />
```

Add import:
```typescript
import Wedding from './pages/Wedding';
```

Add title to `Layout.tsx` TITLE_MAP:
```typescript
'/wedding': 'Влада | Свадебные пакеты',
```

Add nav link to `Layout.tsx`:
```tsx
<NavLink to="/wedding" onClick={closeMenu} className={({ isActive }) => (isActive ? styles.active : '')}>
  Свадебные пакеты
</NavLink>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Wedding.tsx \
       frontend/src/pages/Wedding.module.css \
       frontend/src/App.tsx
git commit -m "feat: add public Wedding page with package cards and FAQ accordion"
```

---

### Task 8: Frontend admin WeddingPackages CRUD page

**Files:**
- Create: `frontend/src/pages/admin/WeddingPackagesAdmin.tsx`

**Interfaces:**
- Consumes: `useAdminWeddingPackages` hook, `DraggableTable`, `ImageUploadButton`, `AutoTextarea`, `WeddingCard`
- Produces: admin CRUD page at `/admin/wedding-packages`

- [ ] **Step 1: Create WeddingPackagesAdmin.tsx**

Pattern matches `PriceItemsAdmin.tsx` exactly:

```tsx
// frontend/src/pages/admin/WeddingPackagesAdmin.tsx
import React, { useState, useMemo } from 'react';
import { useAdminWeddingPackages } from '../../hooks';
import ImageUploadButton from '../../components/ImageUploadButton';
import DeleteButton from '../../components/DeleteButton/DeleteButton';
import DraggableTable from '../../components/DraggableTable';
import AdminPageLayout from '../../components/AdminPageLayout/AdminPageLayout';
import WeddingCard from '../../components/WeddingCard/WeddingCard';
import AutoTextarea from '../../components/AutoTextarea/AutoTextarea';
import type { Column } from '../../components/DraggableTable';
import type { WeddingPackage } from '../../types';
import styles from './adminCrud.module.css';

const WeddingPackagesAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } = useAdminWeddingPackages();
  const [editing, setEditing] = useState<WeddingPackage | null>(null);
  const [form, setForm] = useState<{
    name: string;
    duration: string;
    includes: string;
    imageUrl: string | null;
    prices: { label: string; amount: string }[];
  }>({
    name: '',
    duration: '',
    includes: '',
    imageUrl: null,
    prices: [{ label: '', amount: '' }],
  });
  const [touched, setTouched] = useState(false);

  const isFormValid = form.name.trim().length > 0 && form.duration.trim().length > 0
    && form.prices.length >= 1 && form.prices[0].label.trim().length > 0;

  const addPrice = () => {
    if (form.prices.length < 3) {
      setForm({ ...form, prices: [...form.prices, { label: '', amount: '' }] });
    }
  };

  const removePrice = (idx: number) => {
    if (form.prices.length > 1) {
      const updated = form.prices.filter((_, i) => i !== idx);
      setForm({ ...form, prices: updated });
    }
  };

  const updatePrice = (idx: number, field: 'label' | 'amount', value: string) => {
    const updated = form.prices.map((p, i) => i === idx ? { ...p, [field]: value } : p);
    setForm({ ...form, prices: updated });
  };

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, form);
    } else {
      await createItem(form);
    }
    setEditing(null);
    setForm({ name: '', duration: '', includes: '', imageUrl: null, prices: [{ label: '', amount: '' }] });
    setTouched(false);
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({ name: '', duration: '', includes: '', imageUrl: null, prices: [{ label: '', amount: '' }] });
    setTouched(false);
  };

  const handleImageUpload = (url: string) => {
    setForm(prev => ({ ...prev, imageUrl: url || null }));
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const previewItem: WeddingPackage = useMemo(() => ({
    id: -1,
    name: form.name || 'Название пакета',
    duration: form.duration || 'Продолжительность',
    includes: form.includes || null,
    imageUrl: form.imageUrl,
    prices: form.prices.filter(p => p.label.trim().length > 0).length > 0
      ? form.prices.filter(p => p.label.trim().length > 0)
      : [{ label: 'Стандарт', amount: '0' }],
    orderIndex: 0,
  }), [form]);

  const columns: Column<WeddingPackage>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    {
      key: 'imageUrl',
      header: 'Фото',
      render: (item) =>
        item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          <span style={{ color: '#999', fontSize: '0.85rem' }}>—</span>
        ),
    },
    { key: 'name', header: 'Название', render: (item) => item.name },
    { key: 'duration', header: 'Длительность', render: (item) => item.duration },
    {
      key: 'prices',
      header: 'Цены',
      render: (item) => item.prices.map(p => p.label).join(', '),
    },
  ];

  return (
    <AdminPageLayout title="Свадебные пакеты" error={error}>
      <div className={styles.form}>
        {/* Name */}
        <input
          type="text"
          placeholder="Название пакета"
          value={form.name}
          onChange={e => { setForm({ ...form, name: e.target.value }); setTouched(true); }}
          className={!form.name.trim() && touched ? styles.inputError : ''}
        />
        {/* Duration */}
        <input
          type="text"
          placeholder="Продолжительность (например, 6 часов)"
          value={form.duration}
          onChange={e => { setForm({ ...form, duration: e.target.value }); setTouched(true); }}
          className={!form.duration.trim() && touched ? styles.inputError : ''}
        />
        {/* Includes */}
        <AutoTextarea
          placeholder="Что входит (каждая строка — отдельный пункт)"
          value={form.includes}
          onChange={e => setForm({ ...form, includes: e.target.value })}
          rows={3}
        />
        {/* Prices */}
        <div className={styles.pricesBlock}>
          <label className={styles.formLabel}>Варианты цен</label>
          {form.prices.map((opt, idx) => (
            <div key={idx} className={styles.priceRow}>
              <input
                type="text"
                placeholder="Название (например, Стандарт)"
                value={opt.label}
                onChange={e => { updatePrice(idx, 'label', e.target.value); setTouched(true); }}
                className={!opt.label.trim() && idx === 0 && touched ? styles.inputError : ''}
                style={{ width: '40%' }}
              />
              <input
                type="text"
                placeholder="Цена (например, 50 000)"
                value={opt.amount}
                onChange={e => updatePrice(idx, 'amount', e.target.value)}
                style={{ width: '40%' }}
              />
              {form.prices.length > 1 && (
                <button type="button" onClick={() => removePrice(idx)} className={styles.removeBtn} aria-label="Удалить вариант цены">✕</button>
              )}
            </div>
          ))}
          {form.prices.length < 3 && (
            <button type="button" onClick={addPrice} className={styles.addBtn}>+ Добавить вариант цены</button>
          )}
        </div>
        {/* Image */}
        <ImageUploadButton
          onUpload={handleImageUpload}
          currentUrl={form.imageUrl ?? undefined}
          label="Фото пакета"
        />
        {/* Submit */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button onClick={handleSubmit} disabled={!isFormValid}>{editing ? 'Обновить' : 'Создать'}</button>
          {editing && <button onClick={handleCancel}>Отмена</button>}
        </div>
        {touched && !isFormValid && <p className={styles.validationError}>Заполните обязательные поля (название, длительность и хотя бы одну цену)</p>}
      </div>

      {/* Live preview */}
      <div className={styles.previewSection}>
        <h3 className={styles.previewLabel}>Предпросмотр карточки</h3>
        <div className={styles.previewCardWrapper}>
          <WeddingCard item={previewItem} />
        </div>
      </div>

      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <>
            <button aria-label="Редактировать" onClick={() => {
              setEditing(item);
              setForm({
                name: item.name,
                duration: item.duration,
                includes: item.includes ?? '',
                imageUrl: item.imageUrl,
                prices: item.prices.length > 0 ? item.prices : [{ label: '', amount: '' }],
              });
            }}>✏️</button>
            <DeleteButton itemName={`пакет "${item.name}"`} onDelete={() => deleteItem(item.id)} />
          </>
        )}
      />
    </AdminPageLayout>
  );
};

export default WeddingPackagesAdmin;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/WeddingPackagesAdmin.tsx
git commit -m "feat: add admin WeddingPackages CRUD page with live preview and price options editor"
```

---

### Task 9: Frontend admin WeddingFaq CRUD page + routes + navigation

**Files:**
- Create: `frontend/src/pages/admin/WeddingFaqAdmin.tsx`
- Modify: `frontend/src/App.tsx` (add admin route)
- Modify: `frontend/src/pages/admin/AdminLayout.tsx` (add sidebar links)

**Interfaces:**
- Consumes: `useAdminWeddingFaqItems`, `DraggableTable`, `AutoTextarea`, `DeleteButton`
- Produces: working admin page at `/admin/wedding-faq`

- [ ] **Step 1: Create WeddingFaqAdmin.tsx**

Simple CRUD following the existing pattern (but simpler — no image, no preview):

```tsx
// frontend/src/pages/admin/WeddingFaqAdmin.tsx
import React, { useState } from 'react';
import { useAdminWeddingFaqItems } from '../../hooks';
import DeleteButton from '../../components/DeleteButton/DeleteButton';
import DraggableTable from '../../components/DraggableTable';
import AdminPageLayout from '../../components/AdminPageLayout/AdminPageLayout';
import AutoTextarea from '../../components/AutoTextarea/AutoTextarea';
import type { Column } from '../../components/DraggableTable';
import type { WeddingFaqItem } from '../../types';
import styles from './adminCrud.module.css';

const WeddingFaqAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } = useAdminWeddingFaqItems();
  const [editing, setEditing] = useState<WeddingFaqItem | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [touched, setTouched] = useState(false);

  const isFormValid = question.trim().length > 0 && answer.trim().length > 0;

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, { question, answer });
    } else {
      await createItem({ question, answer });
    }
    setEditing(null);
    setQuestion('');
    setAnswer('');
    setTouched(false);
  };

  const handleCancel = () => {
    setEditing(null);
    setQuestion('');
    setAnswer('');
    setTouched(false);
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const columns: Column<WeddingFaqItem>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    { key: 'question', header: 'Вопрос', render: (item) => item.question },
    { key: 'answer', header: 'Ответ', render: (item) => item.answer.length > 80 ? item.answer.substring(0, 80) + '…' : item.answer },
  ];

  return (
    <AdminPageLayout title="FAQ — вопросы и ответы" error={error}>
      <div className={styles.form}>
        <input
          type="text"
          placeholder="Вопрос"
          value={question}
          onChange={e => { setQuestion(e.target.value); setTouched(true); }}
          className={!question.trim() && touched ? styles.inputError : ''}
        />
        <AutoTextarea
          placeholder="Ответ"
          value={answer}
          onChange={e => { setAnswer(e.target.value); setTouched(true); }}
          rows={3}
        />
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button onClick={handleSubmit} disabled={!isFormValid}>{editing ? 'Обновить' : 'Создать'}</button>
          {editing && <button onClick={handleCancel}>Отмена</button>}
        </div>
        {touched && !isFormValid && <p className={styles.validationError}>Заполните вопрос и ответ</p>}
      </div>

      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <>
            <button aria-label="Редактировать" onClick={() => { setEditing(item); setQuestion(item.question); setAnswer(item.answer); }}>✏️</button>
            <DeleteButton itemName={`вопрос "${item.question.substring(0, 40)}"`} onDelete={() => deleteItem(item.id)} />
          </>
        )}
      />
    </AdminPageLayout>
  );
};

export default WeddingFaqAdmin;
```

- [ ] **Step 2: Add route in App.tsx**

Add lazy import:
```typescript
const WeddingPackagesAdmin = lazy(() => import('./pages/admin/WeddingPackagesAdmin'));
const WeddingFaqAdmin = lazy(() => import('./pages/admin/WeddingFaqAdmin'));
```

Add routes inside the admin Suspense group:
```typescript
<Route path="wedding-packages" element={
  <Suspense fallback={<div>Loading...</div>}>
    <WeddingPackagesAdmin />
  </Suspense>
} />
<Route path="wedding-faq" element={
  <Suspense fallback={<div>Loading...</div>}>
    <WeddingFaqAdmin />
  </Suspense>
} />
```

- [ ] **Step 3: Add sidebar links in AdminLayout.tsx**

```typescript
<li><NavLink to="/admin/wedding-packages" className={({ isActive }) => isActive ? styles.active : ''}>💒 Свадебные пакеты</NavLink></li>
<li><NavLink to="/admin/wedding-faq" className={({ isActive }) => isActive ? styles.active : ''}>❓ FAQ</NavLink></li>
```

Also need to update the Layout.tsx nav. Let me add the wedding link there too.

In `Layout.tsx`, add before the contacts in the nav:
```tsx
<NavLink to="/wedding" onClick={closeMenu} className={({ isActive }) => (isActive ? styles.active : '')}>
  Свадьбы
</NavLink>
```

And add to TITLE_MAP:
```typescript
'/wedding': 'Влада | Свадебные пакеты',
```

- [ ] **Step 4: Update Layout.tsx title map + nav**

```typescript
const TITLE_MAP: Record<string, string> = {
  '/': 'Влада | Фотограф',
  '/portfolio': 'Влада | Портфолио',
  '/price': 'Влада | Прайс',
  '/wedding': 'Влада | Свадебные пакеты',
  '/reviews': 'Влада | Отзывы',
  '/about': 'Влада | Обо мне',
};
```

And nav link:
```tsx
<NavLink to="/wedding" onClick={closeMenu} className={({ isActive }) => (isActive ? styles.active : '')}>
  Свадьбы
</NavLink>
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/admin/WeddingFaqAdmin.tsx \
       frontend/src/App.tsx \
       frontend/src/pages/admin/AdminLayout.tsx \
       frontend/src/components/Layout.tsx
git commit -m "feat: add admin FAQ CRUD page, routes, and navigation links"
```

---

### Task 10: Verify — build check

**Files:** no file changes

- [ ] **Step 1: TypeScript check (backend)**

```bash
cd C:\Users\Mikl\Desktop\photographer-project\backend && npx tsc --noEmit
```

Expected: pass (no errors)

- [ ] **Step 2: TypeScript check (frontend)**

```bash
cd C:\Users\Mikl\Desktop\photographer-project\frontend && npx tsc --noEmit
```

Expected: pass (no errors)

- [ ] **Step 3: Migration check (reset DB or run fresh)**

```bash
cd C:\Users\Mikl\Desktop\photographer-project && npm run migration:run
```

Expected: both new tables created

- [ ] **Step 4: Frontend build**

```bash
cd C:\Users\Mikl\Desktop\photographer-project\frontend && npm run build
```

Expected: clean build

- [ ] **Step 5: Lint**

```bash
cd C:\Users\Mikl\Desktop\photographer-project && npm run lint
```

Expected: pass