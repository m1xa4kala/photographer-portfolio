# Admin Table Filtering Design

**Date:** 2026-07-13
**Status:** Approved

## Overview

Add filtering to two admin pages so that selecting a category or session filters the data table accordingly. Filters persist in URL query parameters and use server-side filtering via existing backend endpoints.

## Backend (no changes needed)

The backend already supports query-parameter filtering:

| Endpoint | Query param | Returns |
|---|---|---|
| `GET /admin/portfolio-sessions` | `?categoryId=N` | Sessions filtered by category |
| `GET /admin/portfolio-photos` | `?sessionId=N` | Photos filtered by session |

Both controllers and services are already implemented — no backend changes required.

## Frontend changes

### 1. PortfolioSessionsAdmin

**Current behavior:** The form has a category select for creating/editing sessions. The table shows all sessions regardless of the selected category.

**New behavior:** The category select serves dual purpose:
- Selecting a category for creating/editing a session
- Filtering the table to show only sessions from that category

**Flow:**
- Category select value = `selectedCategoryId` (state)
- `useAdminPortfolioSessions(selectedCategoryId || undefined)` — fetches from `/admin/portfolio-sessions?categoryId=N` when a category is selected, or all sessions when `"Выберите категорию"` is selected
- URL sync: `?categoryId=N` is read on mount and written on change
- Form fields (name + category) are independent of the filter — when editing, the form's category is pre-filled from the editing session, not from the filter

### 2. PortfolioPhotosAdmin

**Current behavior:** Separate selects for bulk upload and no table filtering.

**New behavior:** A single set of category + session selects that serve both purposes:
- Selecting a category filters the session dropdown
- Selecting a session filters the photos table AND enables bulk upload

**Flow:**
- Category select → filters sessions dropdown (client-side, sessions are already loaded)
- Session select → `useAdminPortfolioPhotos(selectedSessionId || undefined)` fetches from `/admin/portfolio-photos?sessionId=N`
- Bulk upload uses the same selected session
- URL sync: `?categoryId=N&sessionId=M` persists on reload

### 3. Hook changes

**`useAdminPortfolioSessions`** — accept optional `categoryId` parameter:

```typescript
export const useAdminPortfolioSessions = (categoryId?: number) => {
  const url = categoryId
    ? `/admin/portfolio-sessions?categoryId=${categoryId}`
    : '/admin/portfolio-sessions';
  return useAdminCrud<PortfolioSession>(url);
};
```

**`useAdminPortfolioPhotos`** — accept optional `sessionId` parameter:

```typescript
export const useAdminPortfolioPhotos = (sessionId?: number) => {
  const url = sessionId
    ? `/admin/portfolio-photos?sessionId=${sessionId}`
    : '/admin/portfolio-photos';
  return useAdminCrud<PortfolioPhoto>(url);
};
```

### 4. URL synchronization

Both pages use `useSearchParams` from React Router to read/write filter state:

- On mount: read `categoryId` / `sessionId` from URL params → set initial state
- On change: update URL params via `setSearchParams`
- When filter is reset to "all" (value 0): remove the param from URL

### 5. Reorder (drag-and-drop)

When filtering is active, drag-and-drop reorder works on the **filtered set**. The `onReorder` callback sends the full reordered list of filtered IDs to the server. Since the server only updates `orderIndex` for the received IDs, items not in the filtered set keep their existing order. This is correct behavior — the `orderIndex` values are relative within the filtered scope.

## Files to modify

| File | Change |
|---|---|
| `frontend/src/hooks/admin/useAdminPortfolioSessions.ts` | Accept optional `categoryId` param, construct URL with query param |
| `frontend/src/hooks/admin/useAdminPortfolioPhotos.ts` | Accept optional `sessionId` param, construct URL with query param |
| `frontend/src/pages/admin/PortfolioSessionsAdmin.tsx` | Add URL-synced filter state, single category select for create + filter |
| `frontend/src/pages/admin/PortfolioPhotosAdmin.tsx` | Add URL-synced filter state, merged selects for filter + bulk upload |

## What stays the same

- `useAdminCrud` hook — no changes (already supports dynamic `baseUrl`)
- Backend — no changes
- PortfolioCategoriesAdmin — no changes
- DraggableTable — no changes