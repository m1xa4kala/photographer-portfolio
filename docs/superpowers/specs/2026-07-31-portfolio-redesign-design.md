# Portfolio Redesign — URL-based Navigation & Home Optimization

**Date:** 2026-07-31
**Status:** Draft

## Problem

1. **Home page** loads ALL portfolio data (categories, sessions, hundreds of photos) via `usePortfolio()` but only displays 6 sessions. This is wasteful — the user downloads data they never see.
2. **Portfolio page** has no URL-based navigation. Clicking categories/sessions doesn't change the URL, so:
   - Browser back/forward buttons don't work for navigation
   - Can't share links to specific categories or sessions
   - No SEO benefits for individual sessions
3. **"All" filter** is unnecessary — showing all categories mixed together is confusing. Default to the first category instead.

## Solution

### Backend

#### New endpoint: `GET /content/portfolio-home`

Returns up to N sessions (default 6) with their cover image URL — one round trip, minimal data.

```
GET /content/portfolio-home?limit=6
```

Response:
```json
[
  {
    "id": 1,
    "name": "Love Story",
    "orderIndex": 0,
    "categoryId": 1,
    "coverImageUrl": "/uploads/photo-123.jpg"
  }
]
```

Implementation: in `PublicContentController`, fetch sessions with limit, then for each session fetch the first photo by `orderIndex`.

#### Existing endpoints (no changes needed)

- `GET /content/portfolio-categories` — all categories
- `GET /content/portfolio-sessions?categoryId=X` — sessions by category (already supports filtering)
- `GET /content/portfolio-photos?sessionId=X` — photos by session (already supports filtering)

### Frontend

#### New hooks (replace `usePortfolio`)

| Hook | Endpoint | When to call |
|------|----------|-------------|
| `useHomePortfolio(limit=6)` | `GET /content/portfolio-home?limit=6` | Home page only |
| `usePortfolioCategories()` | `GET /content/portfolio-categories` | Portfolio page, always |
| `usePortfolioSessions(categoryId?)` | `GET /content/portfolio-sessions?categoryId=X` | Portfolio page, when categoryId is known |
| `usePortfolioPhotos(sessionId?)` | `GET /content/portfolio-photos?sessionId=X` | Portfolio page, when sessionId is known |

#### New types

```typescript
interface HomeSession extends PortfolioSession {
  coverImageUrl: string | null;
}
```

#### Routing changes

```
/portfolio                  → redirect to /portfolio/category/{firstCategory.id}
/portfolio/category/:catId → show category's sessions
/portfolio/category/:catId/session/:sessionId → show session's photos
```

#### Component changes

**Home.tsx:**
- Replace `usePortfolio()` with `useHomePortfolio(6)`
- `getSessionCover` is no longer needed — coverImageUrl comes from the API
- Session links point to `/portfolio/category/{catId}/session/{sessionId}`

**Portfolio.tsx:**
- Read `:catId` and `:sessionId` from URL params
- No "All" button — first category is default
- Category click → navigate to `/portfolio/category/{id}`
- Session click → navigate to `/portfolio/category/{catId}/session/{sessionId}`
- Back button → navigate to `/portfolio/category/{catId}`
- Loading states: skeleton for each section independently
- Use `useNavigate` + `useParams` from React Router

**App.tsx:**
- Add route: `/portfolio/category/:catId` → Portfolio
- Add route: `/portfolio/category/:catId/session/:sessionId` → Portfolio
- Keep `/portfolio` → Portfolio (will redirect to first category)

#### State management

Each data block has its own loading/error/empty state:
- **Categories**: skeleton, error+retry, "Нет категорий"
- **Sessions**: skeleton, error+retry, "В этой категории пока нет фотосессий"
- **Photos**: skeleton, error+retry, "В этой сессии пока нет фотографий"

No full-page loading — only the changing section shows a skeleton.

## Scope

### Files to create
- `backend/src/content/controllers/public-content.controller.ts` — add `getHomePortfolio` method
- `frontend/src/hooks/useHomePortfolio.ts` — new hook
- `frontend/src/hooks/usePortfolioCategories.ts` — new hook
- `frontend/src/hooks/usePortfolioSessions.ts` — new hook
- `frontend/src/hooks/usePortfolioPhotos.ts` — new hook

### Files to modify
- `frontend/src/pages/Home.tsx` — use `useHomePortfolio` instead of `usePortfolio`, link to `/portfolio/category/{id}/session/{sessionId}`
- `frontend/src/pages/Portfolio.tsx` — URL-based navigation, remove "All", separate data fetching
- `frontend/src/App.tsx` — add portfolio sub-routes
- `frontend/src/hooks/index.ts` — export new hooks
- `frontend/src/types/index.ts` — add `HomeSession` type

### Files to delete
- `frontend/src/hooks/usePortfolio.ts` — no longer needed (replaced by 4 focused hooks)

## Error Handling

- Each hook handles loading/error independently
- On network error: show error message + retry button for the affected section
- Invalid URL params (non-numeric catId/sessionId): redirect to `/portfolio`
- Session not found: show "Фотосессия не найдена" with link back
- Category not found: show "Категория не найдена" with link back

## Out of Scope

- Making the Portfolio page responsive beyond what already exists
- Adding slugs (human-readable URLs) instead of IDs — future improvement
- Pagination/infinite scroll for photos — max 15 per session, no need
- Admin panel changes — admin CRUD stays the same