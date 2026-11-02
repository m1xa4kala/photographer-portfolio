# Wedding Packages Feature Design

**Date:** 2026-11-02
**Project:** Photographer website

## 1. Overview

Add a dedicated wedding photography pricing page (`/wedding`) with package cards, each showing the package name, duration, what's included, a photo, and 1–3 price options. Photographer manages packages and a page-specific FAQ through the admin panel.

## 2. Backend Data Model

### 2.1 WeddingPackage (`wedding_packages`)

| Column | TypeORM Type | Constraints |
|--------|-------------|-------------|
| `id` | `@PrimaryGeneratedColumn()` | PK, auto |
| `name` | `@Column()` string | `@IsNotEmpty()`, `@MaxLength(255)` |
| `duration` | `@Column()` string | `@IsNotEmpty()`, `@MaxLength(255)` — free text (e.g. "6 часов") |
| `includes` | `@Column('text', { nullable: true })` | `@IsOptional()` — multi-line, each line = one list item |
| `imageUrl` | `@Column({ nullable: true })` string | `@IsOptional()` |
| `prices` | `@Column('json', { default: [] })` | Array of `{ label, amount }`, 1–3 items |
| `orderIndex` | `@Column({ default: 0 })` | int, for drag-reorder |

**PriceOptionDto** (validated inline in the Create/Update DTOs):
```ts
interface PriceOptionDto {
  label: string;   // e.g. "Стандарт"
  amount: string;  // e.g. "50 000"
}
```

### 2.2 WeddingFaqItem (`wedding_faq_items`)

| Column | TypeORM Type | Constraints |
|--------|-------------|-------------|
| `id` | `@PrimaryGeneratedColumn()` | PK, auto |
| `question` | `@Column()` string | `@IsNotEmpty()`, `@MaxLength(500)` |
| `answer` | `@Column('text')` string | `@IsNotEmpty()`, `@MaxLength(10000)` |
| `orderIndex` | `@Column({ default: 0 })` | int, for drag-reorder |

## 3. Backend API

### 3.1 Public endpoints (in `PublicContentController`)

- `GET /api/content/wedding-packages` — all packages, sorted by `orderIndex ASC`
- `GET /api/content/wedding-faq` — all FAQ items, sorted by `orderIndex ASC`

### 3.2 Admin endpoints (new controllers, `@UseGuards(JwtAuthGuard)`)

**`AdminWeddingPackagesController`** at `admin/wedding-packages`:
- `GET /` — findAll
- `GET /:id` — findOne
- `POST /` — create (auto-assigns orderIndex)
- `PATCH /:id` — update
- `PATCH /reorder` — bulk reorder (using shared `ReorderDto`)
- `DELETE /:id` — remove

**`AdminWeddingFaqController`** at `admin/wedding-faq`:
- Same structure as above

### 3.3 Module registration

Both entities, services, and controllers registered in existing `ContentModule` (`backend/src/content/content.module.ts`).

## 4. Frontend Types

In `frontend/src/types/index.ts`:

```ts
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

## 5. Public Page (`/wedding`)

**Layout:**
- Title: "Свадебные пакеты"
- Grid of cards (same responsive layout as existing Price page: 3→2→1 columns)

**Package card structure:**
1. Photo with gradient overlay (package name overlaid)
2. Duration (displayed below the photo, with a clock icon or label)
3. Includes list (bullet points from newline-separated text)
4. Price options at the bottom (1–3 rounded buttons/pills, each showing label + amount)

**FAQ section** below the cards:
- Title "Часто задаваемые вопросы"
- Simple accordion: question → click → answer expands

**States handled:**
- Loading → skeleton (copy `PriceSkeleton` pattern)
- Error → `ErrorState` with retry
- Empty → friendly "Ещё нет пакетов" message
- Normal → cards + FAQ

## 6. Admin Pages

### 6.1 `/admin/wedding-packages`

Form fields:
- `name` — text input (required)
- `duration` — text input (required)
- `includes` — `AutoTextarea` (optional, each line = list item)
- `imageUrl` — `ImageUploadButton` (optional)
- `prices` — dynamic block: 1–3 price rows, each with label + amount inputs, add/remove buttons

Table: `DraggableTable` with columns `id`, `imageUrl` (thumbnail), `name`, `duration`, `prices` (comma-separated labels), reorder + edit + delete actions.

Live preview: `WeddingCard` rendered below the form (same pattern as PriceItemsAdmin).

### 6.2 `/admin/wedding-faq`

Simple CRUD with `DraggableTable` and a form with `question` (text input) and `answer` (`AutoTextarea`).

## 7. Files to Create

### Backend (10 files)
1. `backend/src/content/entities/wedding-package.entity.ts`
2. `backend/src/content/entities/wedding-faq-item.entity.ts`
3. `backend/src/content/dtos/create-wedding-package.dto.ts`
4. `backend/src/content/dtos/update-wedding-package.dto.ts`
5. `backend/src/content/dtos/create-wedding-faq-item.dto.ts`
6. `backend/src/content/dtos/update-wedding-faq-item.dto.ts`
7. `backend/src/content/services/wedding-packages.service.ts`
8. `backend/src/content/services/wedding-faq-items.service.ts`
9. `backend/src/content/controllers/admin-wedding-packages.controller.ts`
10. `backend/src/content/controllers/admin-wedding-faq.controller.ts`

### Frontend (11 files)
11. `frontend/src/types/index.ts` — add interfaces (modified, not new)
12. `frontend/src/hooks/admin/useAdminWeddingPackages.ts`
13. `frontend/src/hooks/admin/useAdminWeddingFaqItems.ts`
14. `frontend/src/hooks/useWeddingPackages.ts`
15. `frontend/src/hooks/useWeddingFaqItems.ts`
16. `frontend/src/pages/admin/WeddingPackagesAdmin.tsx`
17. `frontend/src/pages/admin/WeddingFaqAdmin.tsx`
18. `frontend/src/pages/Wedding.tsx`
19. `frontend/src/pages/Wedding.module.css`
20. `frontend/src/components/WeddingCard/WeddingCard.tsx`
21. `frontend/src/components/WeddingCard/WeddingCard.module.css`

### Migration (1 file)
22. `backend/src/migrations/{ts}-CreateWeddingTables.ts`

### Modified Files (5)
23. `backend/src/content/content.module.ts`
24. `backend/src/content/controllers/public-content.controller.ts`
25. `frontend/src/hooks/index.ts`
26. `frontend/src/App.tsx`
27. `frontend/src/pages/admin/AdminLayout.tsx`

## 8. Build Order

1. Migration (entity → migration file)
2. Backend (entity → DTO → service → controller → module)
3. Frontend types
4. Frontend hooks
5. Frontend components (WeddingCard)
6. Frontend public page (Wedding.tsx)
7. Frontend admin pages
8. Frontend routes + navigation
9. Verify (build, migrations, type-check)