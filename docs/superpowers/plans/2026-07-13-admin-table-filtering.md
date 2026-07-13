# Admin Table Filtering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add category/session filter dropdowns to PortfolioSessionsAdmin and PortfolioPhotosAdmin pages that filter the data table via server-side query params, with URL persistence.

**Architecture:** Client-side React state drives URL search params (`useSearchParams`) which are passed as optional args to existing hooks. Hooks append query params to the API URL, triggering re-fetch via the existing `useAdminCrud` `useEffect` on `baseUrl` change. Backend already supports `?categoryId=N` and `?sessionId=N` — no backend changes needed.

**Tech Stack:** React 19, React Router v7 (`useSearchParams`), Axios, TypeScript, NestJS (backend — no changes)

## Global Constraints

- Backend must not be modified
- `useAdminCrud` hook must not be modified
- Filter state must persist in URL query parameters
- Server-side filtering via existing `?categoryId=N` and `?sessionId=N` query params

---

### Task 1: Update hooks to accept filter parameters

**Files:**
- Modify: `frontend/src/hooks/admin/useAdminPortfolioSessions.ts` (full file)
- Modify: `frontend/src/hooks/admin/useAdminPortfolioPhotos.ts` (full file)

**Interfaces:**
- Consumes: `useAdminCrud<T>(baseUrl: string)` from `../useAdminCrud`
- Produces: `useAdminPortfolioSessions(categoryId?: number)` — returns `UseAdminPortfolioSessionsReturn`
- Produces: `useAdminPortfolioPhotos(sessionId?: number)` — returns `UseAdminPortfolioPhotosReturn`

- [ ] **Step 1: Modify `useAdminPortfolioSessions.ts` to accept optional categoryId**

Replace the entire file content:

```typescript
import { type PortfolioSession } from '../../types';
import { useAdminCrud } from '../useAdminCrud';
import type { ReorderItem } from '../useAdminCrud';

interface UseAdminPortfolioSessionsReturn {
  items: PortfolioSession[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<PortfolioSession, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<PortfolioSession, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  reorderItems: (items: ReorderItem[]) => Promise<void>;
}

export const useAdminPortfolioSessions = (categoryId?: number): UseAdminPortfolioSessionsReturn => {
  const url = categoryId
    ? `/admin/portfolio-sessions?categoryId=${categoryId}`
    : '/admin/portfolio-sessions';
  return useAdminCrud<PortfolioSession>(url);
};
```

- [ ] **Step 2: Modify `useAdminPortfolioPhotos.ts` to accept optional sessionId**

Replace the entire file content:

```typescript
import { type PortfolioPhoto } from '../../types';
import { useAdminCrud } from '../useAdminCrud';
import type { ReorderItem } from '../useAdminCrud';

interface UseAdminPortfolioPhotosReturn {
  items: PortfolioPhoto[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  createItem: (data: Omit<PortfolioPhoto, 'id'>) => Promise<void>;
  updateItem: (id: number, data: Partial<Omit<PortfolioPhoto, 'id'>>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  reorderItems: (items: ReorderItem[]) => Promise<void>;
}

export const useAdminPortfolioPhotos = (sessionId?: number): UseAdminPortfolioPhotosReturn => {
  const url = sessionId
    ? `/admin/portfolio-photos?sessionId=${sessionId}`
    : '/admin/portfolio-photos';
  return useAdminCrud<PortfolioPhoto>(url);
};
```

- [ ] **Step 3: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors. The only change is adding an optional parameter to each function — existing callers (which don't pass the param) still work.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/admin/useAdminPortfolioSessions.ts frontend/src/hooks/admin/useAdminPortfolioPhotos.ts
git commit -m "feat: add optional filter params to portfolio hooks"
```

---

### Task 2: Add filtering to PortfolioSessionsAdmin

**Files:**
- Modify: `frontend/src/pages/admin/PortfolioSessionsAdmin.tsx` (full file)

**Interfaces:**
- Consumes: `useAdminPortfolioSessions(categoryId?: number)` from Task 1
- Consumes: `useSearchParams` from `react-router-dom`
- Produces: Filtered sessions table with URL-synced category filter

- [ ] **Step 1: Rewrite PortfolioSessionsAdmin with filter support**

Replace the entire file with:

```typescript
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminPortfolioSessions, useAdminPortfolioCategories } from '../../hooks';
import { confirmDelete } from '../../utils/confirmDelete';
import DraggableTable from '../../components/DraggableTable';
import type { Column } from '../../components/DraggableTable';
import type { PortfolioSession } from '../../types';
import styles from './adminCrud.module.css';

const PortfolioSessionsAdmin: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterCategoryId = searchParams.get('categoryId')
    ? Number(searchParams.get('categoryId'))
    : undefined;

  const { items, loading, error, createItem, updateItem, deleteItem, reorderItems } =
    useAdminPortfolioSessions(filterCategoryId);
  const { items: categories } = useAdminPortfolioCategories();
  const [editing, setEditing] = useState<PortfolioSession | null>(null);
  const [form, setForm] = useState<Pick<PortfolioSession, 'name' | 'categoryId'>>({
    name: '',
    categoryId: filterCategoryId ?? 0,
  });

  const handleCategoryFilterChange = (catId: number) => {
    const next = new URLSearchParams(searchParams);
    if (catId) {
      next.set('categoryId', String(catId));
    } else {
      next.delete('categoryId');
    }
    setSearchParams(next, { replace: true });
    // Reset form category to match the new filter
    setForm(prev => ({ ...prev, categoryId: catId }));
  };

  const handleSubmit = async () => {
    if (editing) {
      await updateItem(editing.id, form);
    } else {
      await createItem(form);
    }
    setEditing(null);
    setForm({ name: '', categoryId: filterCategoryId ?? 0 });
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const getCategoryName = (catId: number) => {
    return categories.find(c => c.id === catId)?.name || '—';
  };

  const columns: Column<PortfolioSession>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    { key: 'name', header: 'Название', render: (item) => item.name },
    { key: 'category', header: 'Категория', render: (item) => getCategoryName(item.categoryId) },
  ];

  return (
    <div className={styles.crudPage}>
      <h2>Фотосессии</h2>

      {error && <div className={styles.error}>Ошибка: {error}</div>}

      <div className={styles.form}>
        <input
          type="text"
          placeholder="Название фотосессии"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <select
          value={filterCategoryId ?? 0}
          onChange={e => handleCategoryFilterChange(+e.target.value)}
        >
          <option value={0}>Все категории</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <button onClick={handleSubmit}>{editing ? 'Обновить' : 'Создать'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ name: '', categoryId: filterCategoryId ?? 0 }); }}>Отмена</button>}
      </div>

      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <>
            <button onClick={() => {
              setEditing(item);
              setForm({ name: item.name, categoryId: item.categoryId });
            }}>✏️</button>
            <button onClick={() => {
              if (confirmDelete(`сессию "${item.name}" (все фото в ней удалятся)`)) {
                deleteItem(item.id);
              }
            }}>🗑️</button>
          </>
        )}
      />
    </div>
  );
};

export default PortfolioSessionsAdmin;
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/PortfolioSessionsAdmin.tsx
git commit -m "feat: add category filter to PortfolioSessionsAdmin"
```

---

### Task 3: Add filtering to PortfolioPhotosAdmin

**Files:**
- Modify: `frontend/src/pages/admin/PortfolioPhotosAdmin.tsx` (full file)

**Interfaces:**
- Consumes: `useAdminPortfolioPhotos(sessionId?: number)` from Task 1
- Consumes: `useAdminPortfolioCategories()` — existing, no filter
- Consumes: `useAdminPortfolioSessions()` — existing, no filter (all sessions for dropdown)
- Consumes: `useSearchParams` from `react-router-dom`
- Produces: Filtered photos table with URL-synced category + session filter

- [ ] **Step 1: Rewrite PortfolioPhotosAdmin with merged filter + bulk upload**

Replace the entire file with:

```typescript
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminPortfolioPhotos, useAdminPortfolioCategories, useAdminPortfolioSessions } from '../../hooks';
import { confirmDelete } from '../../utils/confirmDelete';
import DropZone from '../../components/DropZone';
import type { UploadedFileInfo } from '../../components/DropZone';
import DraggableTable from '../../components/DraggableTable';
import type { Column } from '../../components/DraggableTable';
import type { PortfolioPhoto } from '../../types';
import styles from './adminCrud.module.css';

const PortfolioPhotosAdmin: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterCategoryId = searchParams.get('categoryId')
    ? Number(searchParams.get('categoryId'))
    : undefined;
  const filterSessionId = searchParams.get('sessionId')
    ? Number(searchParams.get('sessionId'))
    : undefined;

  const { items, loading, error, createItem, deleteItem, reorderItems } =
    useAdminPortfolioPhotos(filterSessionId);
  const { items: categories } = useAdminPortfolioCategories();
  const { items: allSessions } = useAdminPortfolioSessions();
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Filter sessions by selected category (client-side, for the dropdown)
  const filteredSessions = filterCategoryId
    ? allSessions.filter(s => s.categoryId === filterCategoryId)
    : allSessions;

  const selectedSessionPhotos = filterSessionId
    ? items.filter(p => p.sessionId === filterSessionId)
    : items;
  const photoLimitReached = selectedSessionPhotos.length >= 15;
  const remainingSlots = 15 - selectedSessionPhotos.length;

  const handleCategoryChange = (catId: number) => {
    const next = new URLSearchParams(searchParams);
    if (catId) {
      next.set('categoryId', String(catId));
    } else {
      next.delete('categoryId');
    }
    // Reset session when category changes
    next.delete('sessionId');
    setSearchParams(next, { replace: true });
  };

  const handleSessionChange = (sessionId: number) => {
    const next = new URLSearchParams(searchParams);
    if (sessionId) {
      next.set('sessionId', String(sessionId));
    } else {
      next.delete('sessionId');
    }
    setSearchParams(next, { replace: true });
  };

  const handleBulkUpload = async (files: UploadedFileInfo[]) => {
    if (!filterSessionId || files.length === 0) return;
    setBulkError(null);
    for (const { url, name } of files) {
      try {
        const title = name.replace(/\.[^.]+$/, '');
        await createItem({ title, imageUrl: url, sessionId: filterSessionId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
        setBulkError(`Ошибка при сохранении "${name}": ${message}`);
        return;
      }
    }
  };

  const handleReorder = async (orderedIds: number[]) => {
    await reorderItems(orderedIds.map((id, idx) => ({ id, orderIndex: idx })));
  };

  const getSessionName = (sessionId: number) => {
    const session = allSessions.find(s => s.id === sessionId);
    return session ? session.name : '—';
  };

  const getCategoryName = (sessionId: number) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return '—';
    const cat = categories.find(c => c.id === session.categoryId);
    return cat ? cat.name : '—';
  };

  const columns: Column<PortfolioPhoto>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    { key: 'title', header: 'Название', render: (item) => item.title || '—' },
    { key: 'category', header: 'Категория', render: (item) => getCategoryName(item.sessionId) },
    { key: 'session', header: 'Фотосессия', render: (item) => getSessionName(item.sessionId) },
    {
      key: 'image',
      header: 'Изображение',
      render: (item) => <img src={item.imageUrl} width="50" />,
    },
  ];

  return (
    <div className={styles.crudPage}>
      <h2>Фото портфолио</h2>

      {error && <div className={styles.error}>Ошибка: {error}</div>}

      {/* ===== ФИЛЬТРЫ И МАССОВАЯ ЗАГРУЗКА ===== */}
      <div className={styles.sectionCard}>
        <h3>📸 Фильтр и массовая загрузка</h3>
        <div className={styles.formRow}>
          <select
            value={filterCategoryId ?? 0}
            onChange={e => handleCategoryChange(+e.target.value)}
          >
            <option value={0}>Все категории</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={filterSessionId ?? 0}
            onChange={e => handleSessionChange(+e.target.value)}
          >
            <option value={0}>Все фотосессии</option>
            {filteredSessions.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {bulkError && <div className={styles.error}>{bulkError}</div>}
        {filterSessionId ? (
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
          <p className={styles.hint}>Выберите фотосессию для загрузки фото</p>
        )}
      </div>

      {/* ===== ТАБЛИЦА ===== */}
      <DraggableTable
        columns={columns}
        items={items}
        loading={loading}
        onReorder={handleReorder}
        actions={(item) => (
          <button onClick={() => {
            if (confirmDelete(`фото "${item.title}"`)) {
              deleteItem(item.id);
            }
          }}>🗑️</button>
        )}
      />
    </div>
  );
};

export default PortfolioPhotosAdmin;
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/PortfolioPhotosAdmin.tsx
git commit -m "feat: add category and session filter to PortfolioPhotosAdmin"
```

---

### Task 4: Verify

**Files:** (no changes — verification only)

- [ ] **Step 1: Full type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Run lint**

```bash
cd frontend && npm run lint
```

Expected: no errors.

- [ ] **Step 3: Verify backend is unaffected**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Final commit with all changes**

If any changes remain uncommitted from previous tasks:

```bash
git add -A
git commit -m "feat: add admin table filtering with URL persistence"
```