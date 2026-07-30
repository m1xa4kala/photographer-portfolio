# Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add URL-based navigation to portfolio page, optimize home page to only load needed data, remove "All" category filter.

**Architecture:** Backend gets a new lean endpoint for home page sessions with cover images. Frontend replaces the monolithic `usePortfolio` hook with 4 focused hooks, URL-driven navigation via React Router params, and per-section loading states.

**Tech Stack:** NestJS (backend), React 19 + React Router v7 (frontend), TypeScript

**Parallel execution:** Backend (Task 1) can run in parallel with Frontend (Tasks 2-5). Tasks 2→3→4→5 are sequential.

---

## Global Constraints

- Backend endpoints use `/api/content/...` prefix (via Vite proxy in dev, same-origin in prod)
- Frontend uses `api.get<T>()` from `src/services/api.ts` (Axios with JWT interceptor)
- CSS Modules for styling — no changes to CSS files needed (existing styles reused)
- PortfolioPage: `sessions` are filtered by `categoryId`, `photos` are filtered by `sessionId`
- `PortfolioSession` type: `{ id, name, orderIndex, categoryId }`
- `PortfolioPhoto` type: `{ id, title, imageUrl, orderIndex, sessionId }`
- `HomeSession` type: `PortfolioSession + { coverImageUrl: string | null }`
- Home page shows max 6 sessions
- Session cover image = first `PortfolioPhoto` by `orderIndex` for that sessionId
- No "All" category filter — first category is default
- React Router routes: `/portfolio`, `/portfolio/category/:catId`, `/portfolio/category/:catId/session/:sessionId`

---

### Task 1: Backend — Add `GET /content/portfolio-home` endpoint

**Files:**
- Modify: `backend/src/content/controllers/public-content.controller.ts` — add `getHomePortfolio` method
- No changes to services needed (reuse existing `PortfolioSessionsService`, `PortfolioPhotosService`)

**Interfaces:**
- Consumes: `PortfolioSessionsService.findAll(limit)` → `PortfolioSession[]`, `PortfolioPhotosService.findBySession(sessionId, 1)` → `PortfolioPhoto[]`
- Produces: `GET /content/portfolio-home?limit=6` → `Array<{ id, name, orderIndex, categoryId, coverImageUrl }>`

- [ ] **Step 1: Add `getHomePortfolio` method to `PublicContentController`**

Add this method inside `PublicContentController` class, after the `getBestPhotos` method:

```typescript
@Get('portfolio-home')
async getHomePortfolio(@Query('limit') limit?: number) {
  const take = limit ?? 6;
  const sessions = await this.portfolioSessionsService.findAll(take, 0);
  const sessionsWithCover = await Promise.all(
    sessions.map(async (session) => {
      const [photo] = await this.portfolioPhotosService.findBySession(
        session.id,
        1,
        0,
      );
      return {
        id: session.id,
        name: session.name,
        orderIndex: session.orderIndex,
        categoryId: session.categoryId,
        coverImageUrl: photo?.imageUrl ?? null,
      };
    }),
  );
  return sessionsWithCover;
}
```

- [ ] **Step 2: Verify build compiles**

```bash
cd backend && npx tsc --noEmit
```
Expected: no errors.

---

### Task 2: Frontend — New types, new hooks, remove old hook

**Files:**
- Modify: `frontend/src/types/index.ts` — add `HomeSession` type
- Create: `frontend/src/hooks/useHomePortfolio.ts` — new hook
- Create: `frontend/src/hooks/usePortfolioCategories.ts` — new hook
- Create: `frontend/src/hooks/usePortfolioSessions.ts` — new hook
- Create: `frontend/src/hooks/usePortfolioPhotos.ts` — new hook
- Modify: `frontend/src/hooks/index.ts` — export new hooks, remove `usePortfolio`
- Delete: `frontend/src/hooks/usePortfolio.ts` — old monolithic hook

**Interfaces:**
- Consumes: `api.get<T>(url)` from `src/services/api.ts`
- Produces: `useHomePortfolio(limit)` → `{ sessions: HomeSession[], loading, error }`, `usePortfolioCategories()` → `{ categories, loading, error }`, `usePortfolioSessions(categoryId)` → `{ sessions, loading, error }`, `usePortfolioPhotos(sessionId)` → `{ photos, loading, error }`

- [ ] **Step 1: Add `HomeSession` type to `types/index.ts`**

```typescript
export interface HomeSession extends PortfolioSession {
  coverImageUrl: string | null;
}
```

- [ ] **Step 2: Create `useHomePortfolio.ts`**

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { type HomeSession } from '../types';

interface UseHomePortfolioReturn {
  sessions: HomeSession[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useHomePortfolio = (limit: number = 6): UseHomePortfolioReturn => {
  const [sessions, setSessions] = useState<HomeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const fetchData = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<HomeSession[]>(
        `/content/portfolio-home?limit=${limit}`,
      );
      if (!cancelledRef.current) {
        setSessions(res.data);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError('Не удалось загрузить портфолио');
        console.error(err);
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData();
    return () => { cancelledRef.current = true; };
  }, [fetchData]);

  return { sessions, loading, error, refetch: fetchData };
};
```

- [ ] **Step 3: Create `usePortfolioCategories.ts`**

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { type PortfolioCategory } from '../types';

interface UsePortfolioCategoriesReturn {
  categories: PortfolioCategory[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePortfolioCategories = (): UsePortfolioCategoriesReturn => {
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const fetchData = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PortfolioCategory[]>('/content/portfolio-categories');
      if (!cancelledRef.current) {
        setCategories(res.data);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError('Не удалось загрузить категории');
        console.error(err);
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => { cancelledRef.current = true; };
  }, [fetchData]);

  return { categories, loading, error, refetch: fetchData };
};
```

- [ ] **Step 4: Create `usePortfolioSessions.ts`**

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { type PortfolioSession } from '../types';

interface UsePortfolioSessionsReturn {
  sessions: PortfolioSession[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePortfolioSessions = (
  categoryId: number | null,
): UsePortfolioSessionsReturn => {
  const [sessions, setSessions] = useState<PortfolioSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const fetchData = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const url = categoryId
        ? `/content/portfolio-sessions?categoryId=${categoryId}`
        : '/content/portfolio-sessions';
      const res = await api.get<PortfolioSession[]>(url);
      if (!cancelledRef.current) {
        setSessions(res.data);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError('Не удалось загрузить фотосессии');
        console.error(err);
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchData();
    return () => { cancelledRef.current = true; };
  }, [fetchData]);

  return { sessions, loading, error, refetch: fetchData };
};
```

- [ ] **Step 5: Create `usePortfolioPhotos.ts`**

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { type PortfolioPhoto } from '../types';

interface UsePortfolioPhotosReturn {
  photos: PortfolioPhoto[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePortfolioPhotos = (
  sessionId: number | null,
): UsePortfolioPhotosReturn => {
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const fetchData = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const url = sessionId
        ? `/content/portfolio-photos?sessionId=${sessionId}`
        : '/content/portfolio-photos';
      const res = await api.get<PortfolioPhoto[]>(url);
      if (!cancelledRef.current) {
        setPhotos(res.data);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError('Не удалось загрузить фотографии');
        console.error(err);
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchData();
    return () => { cancelledRef.current = true; };
  }, [fetchData]);

  return { photos, loading, error, refetch: fetchData };
};
```

- [ ] **Step 6: Update `hooks/index.ts`**

Replace `export { usePortfolio } from './usePortfolio';` with exports for the new hooks:

```typescript
export { useHomePortfolio } from './useHomePortfolio';
export { usePortfolioCategories } from './usePortfolioCategories';
export { usePortfolioSessions } from './usePortfolioSessions';
export { usePortfolioPhotos } from './usePortfolioPhotos';
```

- [ ] **Step 7: Delete `usePortfolio.ts`**

Remove `frontend/src/hooks/usePortfolio.ts`.

- [ ] **Step 8: Verify frontend compiles**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors (Home.tsx and Portfolio.tsx will still import `usePortfolio` — that's expected until tasks 3 and 4).

---

### Task 3: Frontend — Home page uses `useHomePortfolio`

**Files:**
- Modify: `frontend/src/pages/Home.tsx`

**Interfaces:**
- Consumes: `useHomePortfolio(6)` → `{ sessions: HomeSession[], loading, error, refetch }`, `useNavigate()` from React Router
- Produces: Updated Home page rendering

- [ ] **Step 1: Update imports in `Home.tsx`**

Replace:
```typescript
import { useHome, useAbout, usePortfolio, useReviews, usePrice } from '../hooks';
```
With:
```typescript
import { useHome, useAbout, useHomePortfolio, useReviews, usePrice } from '../hooks';
import { useNavigate } from 'react-router-dom';
```

Remove `usePortfolio` destructuring and its `getSessionCover` function. Replace with:

```typescript
const { sessions: portfolioSessions, loading: portfolioLoading } = useHomePortfolio(6);
const navigate = useNavigate();
```

- [ ] **Step 2: Update the portfolio section rendering**

Replace:
```typescript
{sessions.slice(0, 6).map(session => {
  const coverUrl = getSessionCover(session.id);
  return (
    <Link key={session.id} to="/portfolio" className={portfolioStyles.sessionCard}>
      <div className={portfolioStyles.sessionImage}>
        {coverUrl ? (
          <ImageWithSkeleton src={coverUrl} alt={session.name} loading="lazy" />
        ) : (
          <div className={portfolioStyles.sessionPlaceholder}>
            <span>{session.name.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className={portfolioStyles.sessionInfo}>
        <h3>{session.name}</h3>
      </div>
    </Link>
  );
})}
```

With:
```typescript
{portfolioSessions.map(session => (
  <div
    key={session.id}
    className={portfolioStyles.sessionCard}
    onClick={() => navigate(`/portfolio/category/${session.categoryId}/session/${session.id}`)}
    role="link"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/portfolio/category/${session.categoryId}/session/${session.id}`); }}
  >
    <div className={portfolioStyles.sessionImage}>
      {session.coverImageUrl ? (
        <ImageWithSkeleton src={session.coverImageUrl} alt={session.name} loading="lazy" />
      ) : (
        <div className={portfolioStyles.sessionPlaceholder}>
          <span>{session.name.charAt(0)}</span>
        </div>
      )}
    </div>
    <div className={portfolioStyles.sessionInfo}>
      <h3>{session.name}</h3>
    </div>
  </div>
))}
```

Also update the `href` on the "Смотреть все фотосессии" link:
```typescript
<Link to="/portfolio" className={styles.viewAllLink}>Смотреть все фотосессии →</Link>
```
(no change needed — stays `/portfolio`)

- [ ] **Step 3: Verify frontend compiles**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors.

---

### Task 4: Frontend — Portfolio page rewrite with URL-based navigation

**Files:**
- Modify: `frontend/src/pages/Portfolio.tsx`

**Interfaces:**
- Consumes: `usePortfolioCategories()`, `usePortfolioSessions(categoryId)`, `usePortfolioPhotos(sessionId)`, `useParams()`, `useNavigate()` from React Router
- Produces: Portfolio page with URL-driven navigation, per-section loading states, no "All" filter

- [ ] **Step 1: Rewrite `Portfolio.tsx`**

Replace the entire file content with:

```typescript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePortfolioCategories, usePortfolioSessions, usePortfolioPhotos } from '../hooks';
import AnimatedSection from '../components/AnimatedSection';
import ImageLightbox from '../components/ImageLightbox';
import Skeleton from '../components/Skeleton';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import styles from './Portfolio.module.css';

const PortfolioSkeleton: React.FC = () => (
  <AnimatedSection>
    <div className={styles.portfolio}>
      <Skeleton variant="text" width="250px" height="2.5rem" style={{ margin: '0 auto 2rem' }} />
      <div className={styles.filters}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="text" width="80px" height="36px" borderRadius="2rem" />
        ))}
      </div>
      <div className={styles.sessionGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.sessionCard}>
            <Skeleton variant="rect" width="100%" height="220px" />
            <div style={{ padding: '1rem' }}>
              <Skeleton variant="text" width="60%" height="1.2rem" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </AnimatedSection>
);

const Portfolio: React.FC = () => {
  const { catId, sessionId } = useParams<{ catId?: string; sessionId?: string }>();
  const navigate = useNavigate();

  const categoryId = catId ? parseInt(catId, 10) : null;
  const activeSessionId = sessionId ? parseInt(sessionId, 10) : null;

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = usePortfolioCategories();

  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions,
  } = usePortfolioSessions(categoryId);

  const {
    photos,
    loading: photosLoading,
    error: photosError,
    refetch: refetchPhotos,
  } = usePortfolioPhotos(activeSessionId);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Redirect /portfolio to first category
  useEffect(() => {
    if (!categoriesLoading && categories.length > 0 && !catId) {
      navigate(`/portfolio/category/${categories[0].id}`, { replace: true });
    }
  }, [categories, categoriesLoading, catId, navigate]);

  // Redirect if categoryId is invalid or doesn't exist
  const selectedCategory = categories.find(c => c.id === categoryId);
  useEffect(() => {
    if (!categoriesLoading && categoryId && !selectedCategory && categories.length > 0) {
      navigate(`/portfolio/category/${categories[0].id}`, { replace: true });
    }
  }, [categoriesLoading, categoryId, selectedCategory, categories, navigate]);

  // Redirect if sessionId is invalid
  const selectedSession = sessions.find(s => s.id === activeSessionId);
  useEffect(() => {
    if (!sessionsLoading && activeSessionId && !selectedSession && sessions.length > 0) {
      navigate(`/portfolio/category/${categoryId}`, { replace: true });
    }
  }, [sessionsLoading, activeSessionId, selectedSession, sessions, navigate, categoryId]);

  const lightboxImages = activeSessionId ? photos.map(p => p.imageUrl) : [];

  if (categoriesLoading) return <PortfolioSkeleton />;
  if (categoriesError) {
    return (
      <div className={styles.error}>
        Ошибка: {categoriesError}{' '}
        <button onClick={refetchCategories}>Повторить</button>
      </div>
    );
  }
  if (categories.length === 0) {
    return <div className={styles.empty}>Нет категорий портфолио</div>;
  }

  return (
    <>
      <AnimatedSection>
        <div className={styles.portfolio}>
          <h1>Портфолио</h1>

          {/* Категории */}
          <div className={styles.filters}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  navigate(`/portfolio/category/${cat.id}`);
                }}
                className={categoryId === cat.id ? styles.activeFilter : ''}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Сетка сессий (если не выбрана сессия) */}
          {!activeSessionId && (
            <>
              {sessionsLoading ? (
                <div className={styles.sessionGrid}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={styles.sessionCard}>
                      <Skeleton variant="rect" width="100%" height="220px" />
                      <div style={{ padding: '1rem' }}>
                        <Skeleton variant="text" width="60%" height="1.2rem" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sessionsError ? (
                <div className={styles.error}>
                  {sessionsError} <button onClick={refetchSessions}>Повторить</button>
                </div>
              ) : sessions.length === 0 ? (
                <p className={styles.empty}>В этой категории пока нет фотосессий</p>
              ) : (
                <div className={styles.sessionGrid}>
                  {sessions.map(session => (
                    <div
                      key={session.id}
                      className={styles.sessionCard}
                      onClick={() => {
                        navigate(`/portfolio/category/${categoryId}/session/${session.id}`);
                      }}
                      role="link"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          navigate(`/portfolio/category/${categoryId}/session/${session.id}`);
                        }
                      }}
                    >
                      <div className={styles.sessionImage}>
                        <ImageWithSkeleton
                          src={session.coverImageUrl || ''}
                          alt={session.name}
                          loading="lazy"
                          fallback={
                            <div className={styles.sessionPlaceholder}>
                              <span>{session.name.charAt(0)}</span>
                            </div>
                          }
                        />
                      </div>
                      <div className={styles.sessionInfo}>
                        <h3>{session.name}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Галерея фото (когда выбрана сессия) */}
          {activeSessionId && (
            <>
              <div className={styles.backRow}>
                <button
                  className={styles.backBtn}
                  onClick={() => navigate(`/portfolio/category/${categoryId}`)}
                >
                  ← Назад к {selectedCategory?.name || 'сессиям'}
                </button>
                {selectedSession && (
                  <h3 className={styles.sessionTitle}>{selectedSession.name}</h3>
                )}
              </div>
              {photosLoading ? (
                <div className={styles.gallery}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={styles.photoItem}>
                      <Skeleton variant="rect" width="100%" height="200px" />
                    </div>
                  ))}
                </div>
              ) : photosError ? (
                <div className={styles.error}>
                  {photosError} <button onClick={refetchPhotos}>Повторить</button>
                </div>
              ) : photos.length === 0 ? (
                <p className={styles.empty}>В этой фотосессии пока нет фотографий</p>
              ) : (
                <div className={styles.gallery}>
                  {photos.map(photo => (
                    <div key={photo.id} className={styles.photoItem}>
                      <ImageWithSkeleton
                        src={photo.imageUrl}
                        alt={selectedSession?.name || 'Фото'}
                        loading="lazy"
                        onClick={() => setLightboxIndex(photos.indexOf(photo))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </AnimatedSection>
      {lightboxIndex !== null && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          alt={selectedSession?.name || 'Фото'}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
};

export default Portfolio;
```

- [ ] **Step 2: Verify frontend compiles**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors.

---

### Task 5: Frontend — App.tsx routing changes

**Files:**
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `Portfolio` component
- Produces: New routes `/portfolio/category/:catId` and `/portfolio/category/:catId/session/:sessionId`

- [ ] **Step 1: Add portfolio sub-routes**

In `App.tsx`, replace the single portfolio route:
```tsx
<Route path="portfolio" element={<Portfolio />} />
```

With:
```tsx
<Route path="portfolio" element={<Portfolio />} />
<Route path="portfolio/category/:catId" element={<Portfolio />} />
<Route path="portfolio/category/:catId/session/:sessionId" element={<Portfolio />} />
```

- [ ] **Step 2: Verify frontend compiles**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors.

---

### Verification

- [ ] **Verify TypeScript compilation for both backend and frontend**
- [ ] **Verify the app starts and routes work:** `/portfolio` redirects to `/portfolio/category/1`, categories switch correctly, sessions navigate correctly, back button works