# Contacts Entity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `social_links` entity with a unified `contacts` entity supporting phone numbers and social media links in a single ordered list.

**Architecture:** Single `contacts` table with `type` discriminator (`phone` | `social`). Backend: NestJS entity + CRUD service + admin/public controllers. Frontend: unified admin page + public `Contacts` component that renders both phones (tel: links) and social links (brand icons).

**Tech Stack:** NestJS, TypeORM, PostgreSQL, React 19, CSS Modules

## Global Constraints

- All existing `social_links` data must be migrated to the new `contacts` table
- The `socialIconMap.ts` utility is preserved and reused — do not delete it
- `orderIndex` pattern follows existing entities (default 0, ASC ordering)
- All admin endpoints are JWT-guarded via `JwtAuthGuard`
- Public endpoint: `GET /api/content/contacts`

---

### Task 1: Backend — Contact entity + DTOs

**Files:**
- Create: `backend/src/content/entities/contact.entity.ts`
- Create: `backend/src/content/dtos/create-contact.dto.ts`
- Create: `backend/src/content/dtos/update-contact.dto.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `Contact` entity, `CreateContactDto`, `UpdateContactDto`

- [ ] **Step 1: Create Contact entity**

```typescript
// backend/src/content/entities/contact.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  type!: string; // 'phone' | 'social'

  @Column()
  value!: string; // phone number or URL

  @Column({ nullable: true })
  platform!: string | null;

  @Column({ nullable: true })
  iconName!: string | null;

  @Column({ nullable: true })
  label!: string | null;

  @Column({ default: 0 })
  orderIndex!: number;
}
```

- [ ] **Step 2: Create CreateContactDto**

```typescript
// backend/src/content/dtos/create-contact.dto.ts
import {
  IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, Min, MaxLength,
} from 'class-validator';

export class CreateContactDto {
  @IsEnum(['phone', 'social'])
  type!: 'phone' | 'social';

  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  value!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  iconName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
```

- [ ] **Step 3: Create UpdateContactDto**

```typescript
// backend/src/content/dtos/update-contact.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateContactDto } from './create-contact.dto';

export class UpdateContactDto extends PartialType(CreateContactDto) {}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/content/entities/contact.entity.ts backend/src/content/dtos/create-contact.dto.ts backend/src/content/dtos/update-contact.dto.ts
git commit -m "feat: add Contact entity and DTOs"
```

---

### Task 2: Backend — Contacts service + admin controller

**Files:**
- Create: `backend/src/content/services/contacts.service.ts`
- Create: `backend/src/content/controllers/admin-contacts.controller.ts`

**Interfaces:**
- Consumes: `Contact` entity, `CreateContactDto`, `UpdateContactDto`, `ReorderDto` (existing)
- Produces: `ContactsService` (findAll, findOne, create, update, delete, reorder), `AdminContactsController` at `admin/contacts`

- [ ] **Step 1: Create ContactsService**

```typescript
// backend/src/content/services/contacts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../entities/contact.entity';
import { CreateContactDto } from '../dtos/create-contact.dto';
import { UpdateContactDto } from '../dtos/update-contact.dto';
import { ReorderDto } from '../dtos/reorder.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private repo: Repository<Contact>,
  ) {}

  async findAll(limit: number = 100, offset: number = 0): Promise<Contact[]> {
    return this.repo.find({
      order: { orderIndex: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  async findOne(id: number): Promise<Contact> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Contact with id ${id} not found`);
    }
    return item;
  }

  async create(dto: CreateContactDto): Promise<Contact> {
    const max = await this.repo.maximum('orderIndex');
    const newItem = this.repo.create({ ...dto, orderIndex: (max ?? -1) + 1 });
    return this.repo.save(newItem);
  }

  async update(id: number, dto: UpdateContactDto): Promise<Contact> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async delete(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Contact with id ${id} not found`);
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

- [ ] **Step 2: Create AdminContactsController**

```typescript
// backend/src/content/controllers/admin-contacts.controller.ts
import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ContactsService } from '../services/contacts.service';
import { CreateContactDto } from '../dtos/create-contact.dto';
import { UpdateContactDto } from '../dtos/update-contact.dto';
import { ReorderDto } from '../dtos/reorder.dto';

@Controller('admin/contacts')
@UseGuards(JwtAuthGuard)
export class AdminContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  async findAll() {
    return this.contactsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) throw new BadRequestException('Invalid id');
    return this.contactsService.findOne(numericId);
  }

  @Post()
  async create(@Body() createDto: CreateContactDto) {
    return this.contactsService.create(createDto);
  }

  @Patch('reorder')
  async reorder(@Body() reorderDto: ReorderDto) {
    return this.contactsService.reorder(reorderDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateContactDto) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) throw new BadRequestException('Invalid id');
    return this.contactsService.update(numericId, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) throw new BadRequestException('Invalid id');
    return this.contactsService.delete(numericId);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/content/services/contacts.service.ts backend/src/content/controllers/admin-contacts.controller.ts
git commit -m "feat: add ContactsService and AdminContactsController"
```

---

### Task 3: Backend — Update public content controller + module

**Files:**
- Modify: `backend/src/content/controllers/public-content.controller.ts`
- Modify: `backend/src/content/content.module.ts`

**Interfaces:**
- Consumes: `ContactsService`, `Contact` entity
- Produces: updated `GET /api/content/contacts` endpoint

- [ ] **Step 1: Update public-content.controller.ts**

Replace the `social-links` endpoint and its imports:

```typescript
// In imports: replace SocialLinksService with ContactsService
import { ContactsService } from '../services/contacts.service';

// In constructor: replace socialLinksService with contactsService
private contactsService: ContactsService,

// Replace the @Get('social-links') method:
@Get('contacts')
async getContacts(
  @Query('limit') limit?: number,
  @Query('offset') offset?: number,
) {
  return this.contactsService.findAll(limit ?? 100, offset ?? 0);
}
```

- [ ] **Step 2: Update content.module.ts**

Replace `SocialLink` with `Contact` in imports, `TypeOrmModule.forFeature`, providers, controllers, and exports:

```typescript
// Imports: remove SocialLink, add Contact
import { Contact } from './entities/contact.entity';

// Remove SocialLinksService, add ContactsService
import { ContactsService } from './services/contacts.service';

// Remove AdminSocialLinksController, add AdminContactsController
import { AdminContactsController } from './controllers/admin-contacts.controller';

// TypeOrmModule.forFeature: replace SocialLink with Contact
TypeOrmModule.forFeature([
  // ... keep existing, replace SocialLink -> Contact
  Contact,
]),

// providers: replace SocialLinksService with ContactsService
ContactsService,

// controllers: replace AdminSocialLinksController with AdminContactsController
AdminContactsController,

// exports: replace SocialLinksService with ContactsService
ContactsService,
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/content/controllers/public-content.controller.ts backend/src/content/content.module.ts
git commit -m "feat: wire ContactsService into public controller and module"
```

---

### Task 4: Backend — Generate migration + migrate data

**Files:**
- Create: `backend/src/migrations/<timestamp>-CreateContactsTable.ts`
- Delete: `backend/src/migrations/1784138429124-CreateSocialLinksTable.ts` (optional — keep as historical record)

**Interfaces:**
- Consumes: nothing (runs against DB)
- Produces: migration that creates `contacts` table, migrates data, drops `social_links`

- [ ] **Step 1: Generate migration manually**

```typescript
// backend/src/migrations/<timestamp>-CreateContactsTable.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactsTable<timestamp> implements MigrationInterface {
  name = 'CreateContactsTable<timestamp>';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create contacts table
    await queryRunner.query(
      `CREATE TABLE "contacts" (
        "id" SERIAL NOT NULL,
        "type" character varying NOT NULL,
        "value" character varying NOT NULL,
        "platform" character varying,
        "iconName" character varying,
        "label" character varying,
        "orderIndex" integer NOT NULL DEFAULT '0',
        CONSTRAINT "PK_contacts_id" PRIMARY KEY ("id")
      )`,
    );

    // Migrate existing social_links data
    await queryRunner.query(
      `INSERT INTO "contacts" ("type", "value", "platform", "iconName", "orderIndex")
       SELECT 'social', "url", "platform", "iconName", "orderIndex"
       FROM "social_links"`,
    );

    // Drop old table
    await queryRunner.query(`DROP TABLE "social_links"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-create social_links
    await queryRunner.query(
      `CREATE TABLE "social_links" (
        "id" SERIAL NOT NULL,
        "platform" character varying NOT NULL,
        "url" character varying NOT NULL,
        "iconName" character varying NOT NULL,
        "orderIndex" integer NOT NULL DEFAULT '0',
        CONSTRAINT "PK_social_links_id" PRIMARY KEY ("id")
      )`,
    );

    // Restore data from contacts
    await queryRunner.query(
      `INSERT INTO "social_links" ("platform", "url", "iconName", "orderIndex")
       SELECT "platform", "value", "iconName", "orderIndex"
       FROM "contacts"
       WHERE "type" = 'social'`,
    );

    await queryRunner.query(`DROP TABLE "contacts"`);
  }
}
```

- [ ] **Step 2: Run migration**

```bash
npm run migration:run
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/migrations/*-CreateContactsTable.ts
git commit -m "feat: add migration for contacts table with data transfer"
```

---

### Task 5: Backend — Delete old social_links files

**Files:**
- Delete: `backend/src/content/entities/social-link.entity.ts`
- Delete: `backend/src/content/dtos/create-social-link.dto.ts`
- Delete: `backend/src/content/dtos/update-social-link.dto.ts`
- Delete: `backend/src/content/services/social-links.service.ts`
- Delete: `backend/src/content/controllers/admin-social-links.controller.ts`

- [ ] **Step 1: Delete files**

```bash
git rm backend/src/content/entities/social-link.entity.ts backend/src/content/dtos/create-social-link.dto.ts backend/src/content/dtos/update-social-link.dto.ts backend/src/content/services/social-links.service.ts backend/src/content/controllers/admin-social-links.controller.ts
```

- [ ] **Step 2: Verify build passes**

```bash
cd backend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: remove old social_links entity, DTOs, service, controller"
```

---

### Task 6: Frontend — Types + hooks

**Files:**
- Modify: `frontend/src/types/index.ts`
- Create: `frontend/src/hooks/useContacts.ts`
- Create: `frontend/src/hooks/admin/useAdminContacts.ts`
- Modify: `frontend/src/hooks/index.ts`
- Delete: `frontend/src/hooks/useSocialLinks.ts`
- Delete: `frontend/src/hooks/admin/useAdminSocialLinks.ts`

**Interfaces:**
- Consumes: `useFetch<T>`, `useAdminCrud<T>` (existing hooks)
- Produces: `Contact` type, `useContacts` hook, `useAdminContacts` hook

- [ ] **Step 1: Update Contact type in types/index.ts**

Replace the old `SocialLink` interface with `Contact`:

```typescript
export interface Contact {
  id: number;
  type: 'phone' | 'social';
  value: string;
  platform?: string | null;
  iconName?: string | null;
  label?: string | null;
  orderIndex?: number;
}
```

Remove the old `SocialLink` interface.

- [ ] **Step 2: Create useContacts hook**

```typescript
// frontend/src/hooks/useContacts.ts
import { type Contact } from '../types';
import { useFetch } from './useFetch';

interface UseContactsResult {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
}

export const useContacts = (): UseContactsResult => {
  const { data, loading, error } = useFetch<Contact[]>('/content/contacts');
  return { contacts: data ?? [], loading, error };
};
```

- [ ] **Step 3: Create useAdminContacts hook**

```typescript
// frontend/src/hooks/admin/useAdminContacts.ts
import { type Contact } from '../../types';
import { useAdminCrud } from '../useAdminCrud';
import type { ReorderItem } from '../useAdminCrud';

interface UseAdminContactsReturn {
  items: Contact[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<Contact, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<Contact, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  reorderItems: (items: ReorderItem[]) => Promise<void>;
}

export const useAdminContacts = (): UseAdminContactsReturn => {
  return useAdminCrud<Contact>('/admin/contacts');
};
```

- [ ] **Step 4: Update hooks/index.ts**

Replace:
```typescript
export { useAdminSocialLinks } from './admin/useAdminSocialLinks';
export { useSocialLinks } from './useSocialLinks';
```
With:
```typescript
export { useAdminContacts } from './admin/useAdminContacts';
export { useContacts } from './useContacts';
```

- [ ] **Step 5: Delete old hook files**

```bash
git rm frontend/src/hooks/useSocialLinks.ts frontend/src/hooks/admin/useAdminSocialLinks.ts
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/hooks/useContacts.ts frontend/src/hooks/admin/useAdminContacts.ts frontend/src/hooks/index.ts
git commit -m "feat: add Contact type, useContacts and useAdminContacts hooks"
```

---

### Task 7: Frontend — Contacts public component

**Files:**
- Create: `frontend/src/components/Contacts.tsx`
- Create: `frontend/src/components/Contacts.module.css`
- Delete: `frontend/src/components/SocialLinks.tsx`
- Delete: `frontend/src/components/SocialLinks.module.css`

**Interfaces:**
- Consumes: `Contact[]`, `ICON_COMPONENTS`, `ICON_COLORS` from `socialIconMap.ts`
- Produces: React component that renders phones (tel: links) + social links (brand icons)

- [ ] **Step 1: Create Contacts.module.css**

```css
/* frontend/src/components/Contacts.module.css */
.contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: center;
}

.contactItem {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.phoneLink {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: inherit;
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.2s;
}

.phoneLink:hover {
  color: var(--accent);
}

.phoneIcon {
  font-size: 1.2rem;
}

.socialLink {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.socialLink:hover {
  transform: scale(1.1);
}

.label {
  font-size: 0.85rem;
  opacity: 0.8;
}
```

- [ ] **Step 2: Create Contacts component**

```tsx
// frontend/src/components/Contacts.tsx
import React from 'react';
import { type Contact } from '../types';
import { ICON_COMPONENTS, ICON_COLORS } from '../utils/socialIconMap';
import styles from './Contacts.module.css';

interface ContactsProps {
  contacts: Contact[];
  className?: string;
  iconSize?: number;
}

const Contacts: React.FC<ContactsProps> = ({ contacts, className, iconSize = 24 }) => {
  if (contacts.length === 0) return null;

  return (
    <div className={`${styles.contacts} ${className ?? ''}`}>
      {contacts.map((contact) => {
        if (contact.type === 'phone') {
          const telHref = `tel:${contact.value.replace(/[^\d+]/g, '')}`;
          return (
            <div key={contact.id} className={styles.contactItem}>
              <a href={telHref} className={styles.phoneLink} aria-label={contact.label ?? contact.value}>
                <span className={styles.phoneIcon}>📞</span>
                <span>{contact.value}</span>
                {contact.label && <span className={styles.label}>{contact.label}</span>}
              </a>
            </div>
          );
        }

        // Social link
        const IconComponent = ICON_COMPONENTS[contact.iconName ?? ''] as React.ComponentType<{ size?: number; color?: string }> | undefined;
        const brandColor = ICON_COLORS[contact.iconName ?? ''] ?? undefined;
        if (!IconComponent) return null;

        return (
          <div key={contact.id} className={styles.contactItem}>
            <a
              href={contact.value}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={contact.platform ?? contact.value}
              className={styles.socialLink}
              style={brandColor ? { color: brandColor } : undefined}
            >
              <IconComponent size={iconSize} color={brandColor} />
            </a>
            {contact.label && <span className={styles.label}>{contact.label}</span>}
          </div>
        );
      })}
    </div>
  );
};

export default Contacts;
```

- [ ] **Step 3: Delete old SocialLinks files**

```bash
git rm frontend/src/components/SocialLinks.tsx frontend/src/components/SocialLinks.module.css
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Contacts.tsx frontend/src/components/Contacts.module.css
git commit -m "feat: add Contacts component (phones + social links)"
```

---

### Task 8: Frontend — ContactsAdmin page

**Files:**
- Create: `frontend/src/pages/admin/ContactsAdmin.tsx`
- Delete: `frontend/src/pages/admin/SocialLinksAdmin.tsx`

**Interfaces:**
- Consumes: `useAdminContacts`, `Contact` type, `DraggableTable`, `DeleteButton`, `PLATFORMS`, `PLATFORM_ICONS`, `ICON_COMPONENTS` from `socialIconMap.ts`
- Produces: admin page at `/admin/contacts`

- [ ] **Step 1: Create ContactsAdmin page**

```tsx
// frontend/src/pages/admin/ContactsAdmin.tsx
import React, { useState } from 'react';
import { useAdminContacts } from '../../hooks';
import DeleteButton from '../../components/DeleteButton/DeleteButton';
import DraggableTable from '../../components/DraggableTable';
import AdminPageLayout from '../../components/AdminPageLayout/AdminPageLayout';
import type { Column } from '../../components/DraggableTable';
import type { Contact } from '../../types';
import { PLATFORMS, PLATFORM_ICONS, ICON_COMPONENTS } from '../../utils/socialIconMap';
import styles from './adminCrud.module.css';

const CONTACT_TYPES = [
  { value: 'phone', label: 'Телефон' },
  { value: 'social', label: 'Соцсеть' },
];

const ContactsAdmin: React.FC = () => {
  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } = useAdminContacts();
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<{
    type: 'phone' | 'social';
    value: string;
    platform: string;
    iconName: string;
    label: string;
  }>({ type: 'social', value: '', platform: '', iconName: '', label: '' });
  const [touched, setTouched] = useState(false);

  const isFormValid = form.value.trim().length > 0;

  const handlePlatformChange = (platform: string) => {
    const iconName = PLATFORM_ICONS[platform] ?? '';
    setForm({ ...form, platform, iconName });
  };

  const handleSubmit = async () => {
    const payload: any = { type: form.type, value: form.value };
    if (form.type === 'social') {
      payload.platform = form.platform;
      payload.iconName = form.iconName;
    }
    if (form.label) payload.label = form.label;

    if (editing) {
      await updateItem(editing.id, payload);
    } else {
      await createItem(payload);
    }
    resetForm();
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ type: 'social', value: '', platform: '', iconName: '', label: '' });
    setTouched(false);
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const columns: Column<Contact>[] = [
    {
      key: 'type',
      header: 'Тип',
      render: (item) => (item.type === 'phone' ? '📞 Телефон' : '🔗 Соцсеть'),
    },
    {
      key: 'value',
      header: 'Значение',
      render: (item) =>
        item.type === 'phone' ? item.value : (
          <a href={item.value} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
            {item.value}
          </a>
        ),
    },
    {
      key: 'platform',
      header: 'Платформа',
      render: (item) => {
        if (item.type === 'social' && item.iconName) {
          const IconComponent = ICON_COMPONENTS[item.iconName];
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              {IconComponent && <IconComponent size={20} />}
              {item.platform}
            </span>
          );
        }
        return item.platform ?? '—';
      },
    },
    {
      key: 'label',
      header: 'Описание',
      render: (item) => item.label ?? '—',
    },
  ];

  return (
    <AdminPageLayout title="Контакты" error={error}>
      <div className={styles.form}>
        <h3>{editing ? 'Редактировать' : 'Добавить'} контакт</h3>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as 'phone' | 'social' })}
          disabled={!!editing}
        >
          {CONTACT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {form.type === 'phone' ? (
          <input
            type="tel"
            placeholder="Номер телефона (например, +7 999 123-45-67)"
            value={form.value}
            onChange={(e) => { setForm({ ...form, value: e.target.value }); setTouched(true); }}
            className={!form.value.trim() && touched ? styles.inputError : ''}
          />
        ) : (
          <>
            <select
              value={form.platform}
              onChange={(e) => { handlePlatformChange(e.target.value); setTouched(true); }}
              className={!form.platform.trim() && touched ? styles.inputError : ''}
            >
              <option value="">Выберите платформу</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              type="url"
              placeholder="URL (например, https://instagram.com/...)"
              value={form.value}
              onChange={(e) => { setForm({ ...form, value: e.target.value }); setTouched(true); }}
              className={!form.value.trim() && touched ? styles.inputError : ''}
            />
          </>
        )}
        <input
          type="text"
          placeholder="Описание (например, Мобильный, Рабочий)"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
        />
        <button onClick={handleSubmit} disabled={!isFormValid}>
          {editing ? 'Обновить' : 'Создать'}
        </button>
        {editing && (
          <button onClick={resetForm}>Отмена</button>
        )}
        {touched && !isFormValid && (
          <p className={styles.validationError}>Заполните обязательные поля</p>
        )}
      </div>

      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <>
            <button
              aria-label="Редактировать"
              onClick={() => {
                setEditing(item);
                setForm({
                  type: item.type,
                  value: item.value,
                  platform: item.platform ?? '',
                  iconName: item.iconName ?? '',
                  label: item.label ?? '',
                });
              }}
            >
              ✏️
            </button>
            <DeleteButton
              itemName={`${item.type === 'phone' ? 'телефон' : 'ссылку'} ${item.platform || item.value}`}
              onDelete={() => deleteItem(item.id)}
            />
          </>
        )}
      />
    </AdminPageLayout>
  );
};

export default ContactsAdmin;
```

- [ ] **Step 2: Delete old SocialLinksAdmin page**

```bash
git rm frontend/src/pages/admin/SocialLinksAdmin.tsx
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/ContactsAdmin.tsx
git commit -m "feat: add ContactsAdmin page with phone + social form"
```

---

### Task 9: Frontend — Routing, Layout, About page

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/admin/AdminLayout.tsx`
- Modify: `frontend/src/components/Layout.tsx`
- Modify: `frontend/src/pages/About.tsx`

- [ ] **Step 1: Update App.tsx routes**

Replace:
```tsx
const SocialLinksAdmin = lazy(() => import('./pages/admin/SocialLinksAdmin'));
// ...
<Route path="social-links" element={<Suspense...><SocialLinksAdmin /></Suspense>} />
```
With:
```tsx
const ContactsAdmin = lazy(() => import('./pages/admin/ContactsAdmin'));
// ...
<Route path="contacts" element={<Suspense...><ContactsAdmin /></Suspense>} />
```

- [ ] **Step 2: Update AdminLayout.tsx sidebar**

Replace:
```tsx
<li><NavLink to="/admin/social-links" ...>Социальные сети</NavLink></li>
```
With:
```tsx
<li><NavLink to="/admin/contacts" ...>Контакты</NavLink></li>
```

- [ ] **Step 3: Update Layout.tsx (footer)**

Replace:
```tsx
import { useAuth, useSocialLinks, useDocumentTitle } from '../hooks';
import SocialLinks from './SocialLinks';
// ...
const { socialLinks } = useSocialLinks();
// ...
<SocialLinks links={socialLinks} />
```
With:
```tsx
import { useAuth, useContacts, useDocumentTitle } from '../hooks';
import Contacts from './Contacts';
// ...
const { contacts } = useContacts();
// ...
<Contacts contacts={contacts} />
```

- [ ] **Step 4: Update About.tsx**

Replace:
```tsx
import { useAbout, useSocialLinks } from '../hooks';
import SocialLinks from '../components/SocialLinks';
// ...
const { socialLinks } = useSocialLinks();
// ...
<SocialLinks links={socialLinks} />
```
With:
```tsx
import { useAbout, useContacts } from '../hooks';
import Contacts from '../components/Contacts';
// ...
const { contacts } = useContacts();
// ...
<Contacts contacts={contacts} />
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/pages/admin/AdminLayout.tsx frontend/src/components/Layout.tsx frontend/src/pages/About.tsx
git commit -m "feat: wire Contacts into routing, layout, About page"
```

---

### Task 10: Verify everything works

**Files:**
- No file changes — just verification

- [ ] **Step 1: Run backend build**

```bash
cd backend && npm run build
```

Expected: no errors (no references to old `SocialLink` entity)

- [ ] **Step 2: Run frontend build**

```bash
cd frontend && npm run build
```

Expected: no errors, no references to old `SocialLinks` components/hooks

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 4: Run migration**

```bash
npm run migration:run
```

Expected: migration runs, `contacts` table created, data migrated from `social_links`

- [ ] **Step 5: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: cleanup after contacts migration"
```

---

## Summary of all file changes

### Delete (15 files)
- `backend/src/content/entities/social-link.entity.ts`
- `backend/src/content/dtos/create-social-link.dto.ts`
- `backend/src/content/dtos/update-social-link.dto.ts`
- `backend/src/content/services/social-links.service.ts`
- `backend/src/content/controllers/admin-social-links.controller.ts`
- `backend/src/migrations/1784138429124-CreateSocialLinksTable.ts` (optional)
- `frontend/src/components/SocialLinks.tsx`
- `frontend/src/components/SocialLinks.module.css`
- `frontend/src/hooks/useSocialLinks.ts`
- `frontend/src/hooks/admin/useAdminSocialLinks.ts`
- `frontend/src/pages/admin/SocialLinksAdmin.tsx`

### Create (11 files)
- `backend/src/content/entities/contact.entity.ts`
- `backend/src/content/dtos/create-contact.dto.ts`
- `backend/src/content/dtos/update-contact.dto.ts`
- `backend/src/content/services/contacts.service.ts`
- `backend/src/content/controllers/admin-contacts.controller.ts`
- `backend/src/migrations/<timestamp>-CreateContactsTable.ts`
- `frontend/src/components/Contacts.tsx`
- `frontend/src/components/Contacts.module.css`
- `frontend/src/hooks/useContacts.ts`
- `frontend/src/hooks/admin/useAdminContacts.ts`
- `frontend/src/pages/admin/ContactsAdmin.tsx`

### Modify (7 files)
- `backend/src/content/content.module.ts`
- `backend/src/content/controllers/public-content.controller.ts`
- `frontend/src/types/index.ts`
- `frontend/src/hooks/index.ts`
- `frontend/src/App.tsx`
- `frontend/src/pages/admin/AdminLayout.tsx`
- `frontend/src/components/Layout.tsx`
- `frontend/src/pages/About.tsx`