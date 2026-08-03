# Price Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Price page with service photo cards — overlay name/price on the photo, description as a bullet list below, adaptive CSS grid.

**Architecture:** Add `imageUrl` field to PriceItem entity/DTO/types. Backend migration adds the column. Admin page gets image upload (single file via `useUploadImage`). Frontend page gets new card layout with gradient overlay and list-style description.

**Tech Stack:** NestJS + TypeORM (backend), React 19 + TypeScript + CSS Modules (frontend)

**Execution order:** Tasks 1–2 (backend) → Task 3 (migration) → Tasks 4–5 (frontend types + admin) → Task 6 (Price page redesign) → Task 7 (verify)

---
## Global Constraints

- Backend entity columns use TypeORM decorators (`@Column`, `@PrimaryGeneratedColumn`); DTOs use `class-validator` decorators
- Frontend types in `frontend/src/types/index.ts` must match backend entity shape
- Admin pages follow existing CRUD pattern with `useAdminCrud<T>()` hook
- Image upload uses `useUploadImage` hook from `frontend/src/hooks/admin/useUploadImage.ts` — single file upload via `POST /upload` returns `{ url: string }`
- CSS Modules for styling — all Price page styles in `Price.module.css`
- Description field remains plain text (textarea in admin); frontend splits by `\n` to render `<li>` items
- Price field stays as string type (`price: string`), no regex validation — just `@IsString()` and `@IsNotEmpty()`

---

### Task 1: Backend — Add imageUrl to PriceItem entity and DTOs

**Files:**
- Modify: `backend/src/content/entities/price-item.entity.ts`
- Modify: `backend/src/content/dtos/create-price-item.dto.ts`

**Interfaces:**
- Consumes: existing `PriceItem` entity structure
- Produces: `PriceItem` with optional `imageUrl: string`, `CreatePriceItemDto` with optional `imageUrl: string`, relaxed `price` validation

- [ ] **Step 1: Add imageUrl column to PriceItem entity**

In `backend/src/content/entities/price-item.entity.ts`, add after the `price` column:

```typescript
@Column({ nullable: true })
imageUrl!: string;
```

- [ ] **Step 2: Update CreatePriceItemDto — add imageUrl, relax price regex**

In `backend/src/content/dtos/create-price-item.dto.ts`:

1. Add `imageUrl` field:
```typescript
@IsOptional()
@IsString()
@MaxLength(500)
imageUrl?: string;
```

2. Change price validation — remove `@Matches(/^[\d\s]+$/)`, keep `@IsString()` with `@IsNotEmpty()` and `@MaxLength(50)`:

```typescript
@IsString()
@IsNotEmpty()
@MaxLength(50)
price!: string;
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/content/entities/price-item.entity.ts backend/src/content/dtos/create-price-item.dto.ts
git commit -m "feat: add imageUrl to PriceItem entity and DTOs"
```

---

### Task 2: Backend — Generate migration

- [ ] **Step 1: Generate the migration**

```bash
npm run migration:generate
```

Expected output: A new file `backend/src/migrations/<timestamp>-<name>.ts` containing `ALTER TABLE price_items ADD COLUMN imageUrl`.

- [ ] **Step 2: Run the migration**

```bash
npm run migration:run
```

Expected: `Migration <name> has been executed successfully.`

- [ ] **Step 3: Commit**

```bash
git add backend/src/migrations/ backend/src/content/entities/price-item.entity.ts
git commit -m "feat: add migration for PriceItem imageUrl column"
```

---

### Task 3: Frontend — Add imageUrl to PriceItem type

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Add `imageUrl: string | null` to PriceItem type**

In `frontend/src/types/index.ts`, find the `PriceItem` interface and add:

```typescript
export interface PriceItem {
  id: number;
  name: string;
  description: string;
  price: string;
  orderIndex?: number;
  imageUrl: string | null;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat: add imageUrl to PriceItem type"
```

---

### Task 4: Frontend — Add image upload to PriceItemsAdmin

**Files:**
- Modify: `frontend/src/pages/admin/PriceItemsAdmin.tsx`

**Interfaces:**
- Consumes: `PriceItem` type with `imageUrl`, `useUploadImage` hook, existing form fields
- Produces: Admin form with image upload + preview + table column for image

- [ ] **Step 1: Add imports and upload state**

At the top of `PriceItemsAdmin.tsx`, add:
```typescript
import { useUploadImage } from '../../hooks';
import { useRef } from 'react';
```

Inside the component, add upload state:
```typescript
const { uploadImage, uploading, error: uploadError } = useUploadImage();
const fileInputRef = useRef<HTMLInputElement>(null);
```

Extend the form state to track `imageUrl`:
```typescript
const [form, setForm] = useState<Pick<PriceItem, 'name' | 'description' | 'price' | 'imageUrl'>>({
  name: '', description: '', price: '', imageUrl: null,
});
```

- [ ] **Step 2: Add image upload handler**

```typescript
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const url = await uploadImage(file);
    setForm({ ...form, imageUrl: url });
  } catch {
    // error is handled by useUploadImage
  }
};

const handleRemoveImage = () => {
  setForm({ ...form, imageUrl: null });
};
```

- [ ] **Step 3: Add upload UI to the form**

After the price input and before the submit button, add:

```tsx
<div className={styles.formRow}>
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    onChange={handleImageUpload}
    hidden
  />
  {form.imageUrl ? (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <img src={form.imageUrl} alt="" style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 8 }} />
      <button
        type="button"
        onClick={handleRemoveImage}
        style={{ position: 'absolute', top: -6, right: -6, background: 'var(--admin-danger)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', lineHeight: '20px', textAlign: 'center', fontSize: 12 }}
        title="Удалить фото"
      >✕</button>
    </div>
  ) : (
    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
      {uploading ? 'Загрузка...' : '📷 Добавить фото'}
    </button>
  )}
  {uploadError && <div className={styles.error}>{uploadError}</div>}
</div>
```

- [ ] **Step 4: Add image column to DraggableTable**

Add to the `columns` array after the `name` column:

```typescript
{
  key: 'imageUrl',
  header: 'Фото',
  render: (item) => item.imageUrl ? <img src={item.imageUrl} alt="" width="50" height="50" style={{ objectFit: 'cover', borderRadius: 4 }} /> : '—',
},
```

- [ ] **Step 5: Update reset logic and edit prefill to include imageUrl**

When editing an item, prefill `imageUrl`:
```typescript
setEditing(item);
setForm({ name: item.name, description: item.description, price: item.price, imageUrl: item.imageUrl });
```

When resetting form:
```typescript
setEditing(null);
setForm({ name: '', description: '', price: '', imageUrl: null });
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/admin/PriceItemsAdmin.tsx
git commit -m "feat: add image upload to PriceItemsAdmin"
```

---

### Task 5: Frontend — Redesign Price page with new card layout

**Files:**
- Modify: `frontend/src/pages/Price.tsx`
- Rewrite: `frontend/src/pages/Price.module.css`

**Interfaces:**
- Consumes: `PriceItem[]` from `usePrice` hook, each with `{ id, name, description, price, imageUrl }`
- Produces: Redesigned card grid with photo overlay and description list

- [ ] **Step 1: Rewrite Price.module.css**

```css
.price {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 2.5rem;
  color: var(--accent);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.card {
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-soft);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
}

.photoWrapper {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.05) 100%);
}

.overlayContent {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem 1.25rem;
  color: #fff;
}

.photoPlaceholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent), #8a9a6a);
  font-size: 3rem;
  color: rgba(255,255,255,0.6);
}

.photoTitle {
  font-family: var(--font-heading-display);
  font-size: 1.4rem;
  font-weight: 400;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.3;
}

.photoPrice {
  font-family: var(--font-heading-display);
  font-size: 1.3rem;
  font-weight: 400;
  margin-top: 0.4rem;
  color: var(--accent);
}

.descriptionList {
  list-style: none;
  padding: 1rem 1.25rem;
  margin: 0;
  flex: 1;
}

.descriptionItem {
  padding: 0.4rem 0;
  border-bottom: 1px dashed var(--border);
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.descriptionItem:last-child {
  border-bottom: none;
}

.bullet {
  color: var(--accent);
  font-weight: 700;
  flex-shrink: 0;
}

.note {
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 2rem;
  padding-bottom: 2rem;
}

.loader, .error {
  text-align: center;
  padding: 3rem;
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .photoWrapper {
    height: 180px;
  }

  .photoTitle {
    font-size: 1.2rem;
  }

  .photoPrice {
    font-size: 1.1rem;
  }
}
```

- [ ] **Step 2: Rewrite Price.tsx**

```typescript
import React from 'react';
import { usePrice } from '../hooks';
import AnimatedSection from '../components/AnimatedSection';
import Skeleton from '../components/Skeleton';
import styles from './Price.module.css';

const PriceSkeleton: React.FC = () => (
  <AnimatedSection>
    <div className={styles.price}>
      <Skeleton variant="text" width="250px" height="2.5rem" style={{ margin: '0 auto 2rem' }} />
      <div className={styles.grid}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.card}>
            <Skeleton variant="rect" width="100%" height="220px" />
            <div style={{ padding: '1rem 1.25rem' }}>
              <Skeleton variant="text" width="60%" height="1.5rem" />
              {[1,2,3].map((j) => (
                <Skeleton key={j} variant="text" width="100%" height="0.9rem" style={{ marginTop: '0.4rem' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </AnimatedSection>
);

const Price: React.FC = () => {
  const { items, loading, error, refetch } = usePrice();

  if (loading) {
    return <PriceSkeleton />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={refetch}>Повторить</button>
      </div>
    );
  }

  const renderDescription = (text: string) => {
    return text.split('\n').filter(line => line.trim()).map((line, i) => (
      <li key={i} className={styles.descriptionItem}>
        <span className={styles.bullet}>•</span>
        <span>{line}</span>
      </li>
    ));
  };

  return (
    <AnimatedSection>
      <div className={styles.price}>
        <h1 className={styles.title}>Прайс-лист</h1>
        <div className={styles.grid}>
          {items.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.photoWrapper}>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className={styles.photo}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.photoPlaceholder}>📷</div>
                )}
                <div className={styles.overlay} />
                <div className={styles.overlayContent}>
                  <h3 className={styles.photoTitle}>{item.name}</h3>
                  <div className={styles.photoPrice}>{item.price} ₽</div>
                </div>
              </div>
              {item.description && (
                <ul className={styles.descriptionList}>
                  {renderDescription(item.description)}
                </ul>
              )}
            </div>
          ))}
        </div>
        <p className={styles.note}>* Точная стоимость обсуждается индивидуально в зависимости от ваших пожеланий</p>
      </div>
    </AnimatedSection>
  );
};

export default Price;
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Price.tsx frontend/src/pages/Price.module.css
git commit -m "feat: redesign Price page with photo cards and description lists"
```

---

### Task 6: Verify — Lint and type-check

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Expected: No errors. Fix any warnings.

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: Successful build with no errors.

- [ ] **Step 3: Final commit if needed**

```bash
git add -A
git commit -m "chore: fix lint and build after price page redesign"
```

---

## Summary of files changed

| File | Action |
|------|--------|
| `backend/src/content/entities/price-item.entity.ts` | Add `imageUrl` column |
| `backend/src/content/dtos/create-price-item.dto.ts` | Add `imageUrl`, relax price regex |
| `backend/src/migrations/*.ts` | New migration |
| `frontend/src/types/index.ts` | Add `imageUrl` to `PriceItem` |
| `frontend/src/pages/admin/PriceItemsAdmin.tsx` | Add image upload + table column |
| `frontend/src/pages/Price.tsx` | Redesigned |
| `frontend/src/pages/Price.module.css` | Rewritten |