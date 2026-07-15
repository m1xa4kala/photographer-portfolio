# Social Links Feature — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add social media links management to admin panel and display them on public pages.

**Architecture:** New `SocialLink` entity (separate table, no relation to About) with full CRUD admin API following existing patterns (PriceItems). Frontend uses `react-icons/si` for displaying icons. Public endpoint serves sorted links.

**Tech Stack:** NestJS, TypeORM, React 19, react-icons, CSS Modules

## Global Constraints

- Follow exact existing patterns: PriceItems service/controller patterns for backend, useAdminCrud for frontend admin hooks, DraggableTable for admin list
- Entity name: `SocialLink` (camelCase), table name: `social_links` (snake_case)
- API routes: `/api/admin/social-links` (admin, JWT-guarded), `/api/content/social-links` (public)
- Reorder endpoint: `PATCH /api/admin/social-links/reorder` with `{ items: [{ id, orderIndex }] }`
- Top-10 platforms: Instagram, VK, Telegram, WhatsApp, YouTube, TikTok, Twitter/X, Pinterest, Viber, Vimeo
- Icons: `react-icons/si` (Simple Icons) — `SiInstagram`, `SiVk`, `SiTelegram`, `SiWhatsapp`, `SiYoutube`, `SiTiktok`, `SiX`, `SiPinterest`, `SiViber`, `SiVimeo`
- TypeORM migration required (synchronize: false in production)

---

### Task 1: Backend — Entity, DTOs, and Module Registration

**Files:**
- Create: `backend/src/content/entities/social-link.entity.ts`
- Create: `backend/src/content/dtos/create-social-link.dto.ts`
- Create: `backend/src/content/dtos/update-social-link.dto.ts`
- Modify: `backend/src/content/content.module.ts`

**Interfaces:**
- Consumes: existing `ContentModule` pattern, `TypeOrmModule.forFeature()`
- Produces: `SocialLink` entity, `CreateSocialLinkDto`, `UpdateSocialLinkDto` — consumed by service and controller

- [ ] **Step 1: Create SocialLink entity**

```typescript
// backend/src/content/entities/social-link.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('social_links')
export class SocialLink {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  platform!: string;

  @Column()
  url!: string;

  @Column()
  iconName!: string;

  @Column({ default: 0 })
  orderIndex!: number;
}
```

- [ ] **Step 2: Create CreateSocialLinkDto**

```typescript
// backend/src/content/dtos/create-social-link.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateSocialLinkDto {
  @IsString()
  @IsNotEmpty()
  platform!: string;

  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsNotEmpty()
  iconName!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
```

- [ ] **Step 3: Create UpdateSocialLinkDto**

```typescript
// backend/src/content/dtos/update-social-link.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateSocialLinkDto } from './create-social-link.dto';

export class UpdateSocialLinkDto extends PartialType(CreateSocialLinkDto) {}
```

- [ ] **Step 4: Register entity in ContentModule**

Add import and registration for `SocialLink` entity:

```typescript
// backend/src/content/content.module.ts
// Add to imports:
import { SocialLink } from './entities/social-link.entity';

// Add SocialLink to TypeOrmModule.forFeature([...]) array
```

- [ ] **Step 5: Commit**

---

### Task 2: Backend — SocialLinksService

**Files:**
- Create: `backend/src/content/services/social-links.service.ts`

**Interfaces:**
- Consumes: `SocialLink` entity, `CreateSocialLinkDto`, `UpdateSocialLinkDto`, `ReorderDto`
- Produces: `SocialLinksService` with `findAll`, `create`, `update`, `delete`, `reorder` methods

- [ ] **Step 1: Create service**

```typescript
// backend/src/content/services/social-links.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialLink } from '../entities/social-link.entity';
import { CreateSocialLinkDto } from '../dtos/create-social-link.dto';
import { UpdateSocialLinkDto } from '../dtos/update-social-link.dto';
import { ReorderDto } from '../dtos/reorder.dto';

@Injectable()
export class SocialLinksService {
  constructor(
    @InjectRepository(SocialLink)
    private repo: Repository<SocialLink>,
  ) {}

  async findAll(limit: number = 100, offset: number = 0): Promise<SocialLink[]> {
    return this.repo.find({
      order: { orderIndex: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  async findOne(id: number): Promise<SocialLink> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Social link with id ${id} not found`);
    }
    return item;
  }

  async create(dto: CreateSocialLinkDto): Promise<SocialLink> {
    const max = await this.repo.maximum('orderIndex');
    const newItem = this.repo.create({ ...dto, orderIndex: (max ?? -1) + 1 });
    return this.repo.save(newItem);
  }

  async update(id: number, dto: UpdateSocialLinkDto): Promise<SocialLink> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async delete(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Social link with id ${id} not found`);
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

- [ ] **Step 2: Register service in ContentModule**

Add to `providers` array in `content.module.ts`:
```typescript
import { SocialLinksService } from './services/social-links.service';
// Add SocialLinksService to providers: [...]
```

- [ ] **Step 3: Commit**

---

### Task 3: Backend — Admin Controller

**Files:**
- Create: `backend/src/content/controllers/admin-social-links.controller.ts`
- Modify: `backend/src/content/content.module.ts` (register controller)

**Interfaces:**
- Consumes: `SocialLinksService`, `CreateSocialLinkDto`, `UpdateSocialLinkDto`, `ReorderDto`
- Produces: `/api/admin/social-links` endpoints

- [ ] **Step 1: Create admin controller**

```typescript
// backend/src/content/controllers/admin-social-links.controller.ts
import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { SocialLinksService } from '../services/social-links.service';
import { CreateSocialLinkDto } from '../dtos/create-social-link.dto';
import { UpdateSocialLinkDto } from '../dtos/update-social-link.dto';
import { ReorderDto } from '../dtos/reorder.dto';

@Controller('admin/social-links')
@UseGuards(JwtAuthGuard)
export class AdminSocialLinksController {
  constructor(private socialLinksService: SocialLinksService) {}

  @Get()
  async findAll() {
    return this.socialLinksService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.socialLinksService.findOne(numericId);
  }

  @Post()
  async create(@Body() createDto: CreateSocialLinkDto) {
    return this.socialLinksService.create(createDto);
  }

  @Patch('reorder')
  async reorder(@Body() reorderDto: ReorderDto) {
    return this.socialLinksService.reorder(reorderDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateSocialLinkDto) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.socialLinksService.update(numericId, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid id');
    }
    return this.socialLinksService.delete(numericId);
  }
}
```

- [ ] **Step 2: Register controller in ContentModule**

Add to `controllers` array in `content.module.ts`:
```typescript
import { AdminSocialLinksController } from './controllers/admin-social-links.controller';
// Add AdminSocialLinksController to controllers: [...]
```

- [ ] **Step 3: Commit**

---

### Task 4: Backend — Public Endpoint

**Files:**
- Modify: `backend/src/content/controllers/public-content.controller.ts`

**Interfaces:**
- Consumes: `SocialLinksService`
- Produces: `GET /api/content/social-links` (public, no auth)

- [ ] **Step 1: Add social links endpoint to PublicContentController**

```typescript
// In public-content.controller.ts, add to constructor:
import { SocialLinksService } from '../services/social-links.service';
// Add private socialLinksService: SocialLinksService to constructor params

// Add method:
@Get('social-links')
async getSocialLinks() {
  return this.socialLinksService.findAll();
}
```

- [ ] **Step 2: Commit**

---

### Task 5: Database Migration

**Files:**
- Run: `npm run migration:generate` then `npm run migration:run`

- [ ] **Step 1: Generate migration from entity changes**

```bash
npm run migration:generate
```

- [ ] **Step 2: Run migration**

```bash
npm run migration:run
```

- [ ] **Step 3: Commit migration file**

---

### Task 6: Frontend — Install react-icons and add types

**Files:**
- Modify: `frontend/package.json` (dependency added)
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Install react-icons**

```bash
cd frontend && npm install react-icons
```

- [ ] **Step 2: Add SocialLink type**

```typescript
// frontend/src/types/index.ts
export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  iconName: string;
  orderIndex?: number;
}
```

- [ ] **Step 3: Commit**

---

### Task 7: Frontend — Admin hook

**Files:**
- Create: `frontend/src/hooks/admin/useAdminSocialLinks.ts`
- Modify: `frontend/src/hooks/index.ts`

- [ ] **Step 1: Create admin hook**

```typescript
// frontend/src/hooks/admin/useAdminSocialLinks.ts
import { type SocialLink } from '../../types';
import { useAdminCrud } from '../useAdminCrud';
import type { ReorderItem } from '../useAdminCrud';

interface UseAdminSocialLinksReturn {
  items: SocialLink[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<SocialLink, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<SocialLink, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  reorderItems: (items: ReorderItem[]) => Promise<void>;
}

export const useAdminSocialLinks = (): UseAdminSocialLinksReturn => {
  return useAdminCrud<SocialLink>('/admin/social-links');
};
```

- [ ] **Step 2: Export in hooks index**

```typescript
// frontend/src/hooks/index.ts — add:
export { useAdminSocialLinks } from './admin/useAdminSocialLinks';
```

- [ ] **Step 3: Commit**

---

### Task 8: Frontend — Admin page (SocialLinksAdmin)

**Files:**
- Create: `frontend/src/pages/admin/SocialLinksAdmin.tsx`

**Interfaces:**
- Consumes: `useAdminSocialLinks`, `DraggableTable`, `useConfirm`
- Top-10 platforms list for the dropdown

- [ ] **Step 1: Create SocialLinksAdmin page**

```tsx
// frontend/src/pages/admin/SocialLinksAdmin.tsx
import React, { useState } from 'react';
import { useAdminSocialLinks } from '../../hooks';
import { useConfirm } from '../../hooks/useConfirm';
import DraggableTable from '../../components/DraggableTable';
import type { Column } from '../../components/DraggableTable';
import type { SocialLink } from '../../types';
import styles from './adminCrud.module.css';

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: 'SiInstagram' },
  { value: 'vk', label: 'VK', icon: 'SiVk' },
  { value: 'telegram', label: 'Telegram', icon: 'SiTelegram' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'SiWhatsapp' },
  { value: 'youtube', label: 'YouTube', icon: 'SiYoutube' },
  { value: 'tiktok', label: 'TikTok', icon: 'SiTiktok' },
  { value: 'twitter', label: 'Twitter / X', icon: 'SiX' },
  { value: 'pinterest', label: 'Pinterest', icon: 'SiPinterest' },
  { value: 'viber', label: 'Viber', icon: 'SiViber' },
  { value: 'vimeo', label: 'Vimeo', icon: 'SiVimeo' },
];

const SocialLinksAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } = useAdminSocialLinks();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [form, setForm] = useState<{ platform: string; url: string; iconName: string }>({ platform: '', url: '', iconName: '' });
  const [touched, setTouched] = useState(false);

  const isFormValid = form.platform.trim().length > 0 && form.url.trim().length > 0;

  const handlePlatformChange = (value: string) => {
    const platform = PLATFORMS.find(p => p.value === value);
    setForm({
      ...form,
      platform: platform?.label ?? value,
      iconName: platform?.icon ?? value,
    });
  };

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, { platform: form.platform, url: form.url, iconName: form.iconName });
    } else {
      await createItem({ platform: form.platform, url: form.url, iconName: form.iconName });
    }
    setEditing(null);
    setForm({ platform: '', url: '', iconName: '' });
    setTouched(false);
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const columns: Column<SocialLink>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    { key: 'platform', header: 'Платформа', render: (item) => item.platform },
    { key: 'url', header: 'URL', render: (item) => (
      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
        {item.url}
      </a>
    )},
  ];

  return (
    <div className={styles.crudPage}>
      <h2>Социальные сети</h2>

      {error && <div className={styles.error}>Ошибка: {error}</div>}

      <div className={styles.form}>
        <h3>{editing ? 'Редактировать ссылку' : 'Добавить ссылку'}</h3>
        <select
          value={editing ? PLATFORMS.find(p => p.icon === editing.iconName)?.value ?? '' : form.platform.toLowerCase()}
          onChange={e => { handlePlatformChange(e.target.value); setTouched(true); }}
          className={!form.platform.trim() && touched ? styles.inputError : ''}
        >
          <option value="">Выберите платформу</option>
          {PLATFORMS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <input
          type="url"
          placeholder="URL (например, https://instagram.com/vlada)"
          value={form.url}
          onChange={e => { setForm({ ...form, url: e.target.value }); setTouched(true); }}
          className={!form.url.trim() && touched ? styles.inputError : ''}
        />
        <button onClick={handleSubmit} disabled={!isFormValid}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && (
          <button onClick={() => {
            setEditing(null);
            setForm({ platform: '', url: '', iconName: '' });
            setTouched(false);
          }}>Отмена</button>
        )}
        {touched && !isFormValid && (
          <p className={styles.validationError}>Выберите платформу и введите URL</p>
        )}
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
              setForm({ platform: item.platform, url: item.url, iconName: item.iconName });
            }}>✏️</button>
            <button aria-label="Удалить" onClick={async () => {
              if (await confirm(`Удалить ссылку "${item.platform}"? Это действие нельзя отменить.`)) {
                await deleteItem(item.id);
              }
            }}>🗑️</button>
          </>
        )}
      />
      <ConfirmDialogComponent />
    </div>
  );
};

export default SocialLinksAdmin;
```

- [ ] **Step 2: Commit**

---

### Task 9: Frontend — Routing and Sidebar

**Files:**
- Modify: `frontend/src/App.tsx` (add route)
- Modify: `frontend/src/pages/admin/AdminLayout.tsx` (add sidebar link)

- [ ] **Step 1: Add route in App.tsx**

```tsx
// In App.tsx, add import:
import SocialLinksAdmin from './pages/admin/SocialLinksAdmin';

// Add route inside admin ProtectedRoute:
<Route path="social-links" element={<SocialLinksAdmin />} />
```

- [ ] **Step 2: Add sidebar link in AdminLayout.tsx**

```tsx
// Add to the sidebar nav list:
<li><NavLink to="/admin/social-links" className={({ isActive }) => isActive ? styles.active : ''}>Соцсети</NavLink></li>
```

- [ ] **Step 3: Commit**

---

### Task 10: Frontend — Public SocialLinks component

**Files:**
- Create: `frontend/src/components/SocialLinks.tsx`
- Create: `frontend/src/components/SocialLinks.module.css`
- Create: `frontend/src/hooks/useSocialLinks.ts`

**Interfaces:**
- Consumes: `SocialLink[]` from API, `react-icons/si`
- Produces: `<SocialLinks />` component (renders clickable social icons)

- [ ] **Step 1: Create useSocialLinks hook**

```typescript
// frontend/src/hooks/useSocialLinks.ts
import { useFetch } from './useFetch';
import { type SocialLink } from '../types';

interface UseSocialLinksReturn {
  links: SocialLink[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useSocialLinks = (): UseSocialLinksReturn => {
  const { data, loading, error, refetch } = useFetch<SocialLink[]>('/content/social-links');

  return {
    links: data ?? [],
    loading,
    error,
    refetch,
  };
};
```

- [ ] **Step 2: Export in hooks index**

```typescript
// frontend/src/hooks/index.ts — add:
export { useSocialLinks } from './useSocialLinks';
```

- [ ] **Step 3: Create SocialLinks component**

```tsx
// frontend/src/components/SocialLinks.tsx
import React from 'react';
import { SiInstagram, SiVk, SiTelegram, SiWhatsapp, SiYoutube, SiTiktok, SiX, SiPinterest, SiViber, SiVimeo } from 'react-icons/si';
import type { SocialLink } from '../types';
import styles from './SocialLinks.module.css';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; title?: string }>> = {
  SiInstagram,
  SiVk,
  SiTelegram,
  SiWhatsapp,
  SiYoutube,
  SiTiktok,
  SiX,
  SiPinterest,
  SiViber,
  SiVimeo,
};

interface SocialLinksProps {
  links: SocialLink[];
  size?: number;
  className?: string;
}

const SocialLinks: React.FC<SocialLinksProps> = ({ links, size = 24, className }) => {
  if (links.length === 0) return null;

  return (
    <div className={`${styles.socialLinks} ${className ?? ''}`}>
      {links.map(link => {
        const IconComponent = ICON_MAP[link.iconName];
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            aria-label={link.platform}
            title={link.platform}
          >
            {IconComponent ? <IconComponent size={size} /> : <span>{link.platform[0]}</span>}
          </a>
        );
      })}
    </div>
  );
};

export default SocialLinks;
```

- [ ] **Step 4: Create SocialLinks styles**

```css
/* frontend/src/components/SocialLinks.module.css */
.socialLinks {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: var(--accent);
  background: var(--bg-secondary);
  transition: transform 0.2s, background 0.2s, color 0.2s;
  text-decoration: none;
}

.link:hover {
  transform: scale(1.15);
  background: var(--accent);
  color: #fff;
}
```

- [ ] **Step 5: Commit**

---

### Task 11: Frontend — Integrate into About page

**Files:**
- Modify: `frontend/src/pages/About.tsx`
- Modify: `frontend/src/pages/About.module.css`

- [ ] **Step 1: Add SocialLinks to About page**

```tsx
// In About.tsx, add imports:
import SocialLinks from '../components/SocialLinks';
import { useSocialLinks } from '../hooks';

// In component body, add:
const { links: socialLinks } = useSocialLinks();

// In the JSX, after the bio paragraph, add:
{socialLinks.length > 0 && <SocialLinks links={socialLinks} size={28} />}
```

- [ ] **Step 2: Add spacing in About.module.css**

```css
/* Add to About.module.css */
.socialLinks {
  margin-top: 2rem;
}
```

- [ ] **Step 3: Commit**

---

### Task 12: Frontend — Integrate into Footer

**Files:**
- Modify: `frontend/src/components/Layout.tsx`
- Modify: `frontend/src/components/Layout.module.css`

- [ ] **Step 1: Add SocialLinks to Layout footer**

```tsx
// In Layout.tsx, add imports:
import SocialLinks from './SocialLinks';
import { useSocialLinks } from '../hooks';

// In component body, add:
const { links: socialLinks } = useSocialLinks();

// In the footer, replace hardcoded social links:
<footer className={styles.footer}>
  <p>© {new Date().getFullYear()} Vlada Khaybullina. Все права защищены.</p>
  <SocialLinks links={socialLinks} size={20} />
</footer>
```

- [ ] **Step 2: Update footer styles**

```css
/* In Layout.module.css, update .footer */
.footer {
  text-align: center;
  padding: 1.5rem;
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border);
  font-size: 0.9rem;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* Remove .socials styles since they're replaced by SocialLinks component */
```

- [ ] **Step 3: Commit**

---

### Task 13: Verify

**Files:**
- Run: lint, type-check, build

- [ ] **Step 1: Lint both projects**

```bash
npm run lint
```

- [ ] **Step 2: Build frontend**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Build backend**

```bash
cd backend && npm run build
```

- [ ] **Step 4: Fix any issues and commit**