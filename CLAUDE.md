# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start PostgreSQL (Docker) — required before any dev work
npm run db:start

# Install all dependencies (both backend & frontend)
npm run install:all

# Run migrations
npm run migration:run

# Generate a new migration from entity changes
npm run migration:generate

# Dev mode — both frontend (Vite, hot-reload) + backend (NestJS, watch)
npm run dev

# Run only backend or frontend in dev mode
npm run dev:backend
npm run dev:frontend

# Lint both projects
npm run lint

# Build for production
npm run build

# Start production build
npm start

# Docker compose production build & up
npm run docker:build
npm run docker:up

# Backend tests (Jest)
cd backend && npm test
npm run test:watch
npm run test:cov
npm run test:e2e
```

## Automation

Project uses multi-agent orchestration via workflows in `.claude/workflows/`. The primary automation pattern:

### Orchestration rules

1. **Analyze first** — when given a task, determine: backend changes? frontend changes? DB migrations? bug fix? code review?
2. **Parallel where possible** — independent concerns run concurrently (e.g. backend API + frontend UI)
3. **Sequential where not** — entities before migrations before UI that uses them
4. **Always verify** — lint, type-check, and test after any implementation

### Available workflow scripts

- `.claude/workflows/feature.js` — full feature dev: Plan → Backend → Frontend → Migration → Verify
- `.claude/workflows/bugfix.js` — systematic debug: Debug → Investigate → Fix → Verify  
- `.claude/workflows/code-review.js` — multi-dimension review: parallel correctness/security/quality → adversarially verify → synthesize
- `.claude/workflows/migration.js` — DB migrations: Analyze → Generate → Run → Verify

Workflows run via the `Workflow` tool. Pass args like:
```
Workflow({scriptPath: ".claude/workflows/feature.js", args: {feature: "Add testimonial highlights"}})
```

### Agent dispatching

| Task type | Default pattern |
|---|---|
| New feature | Invoke feature.js workflow |
| Bug report | Invoke bugfix.js workflow |
| Code review | Invoke code-review.js workflow |
| DB migration | Invoke migration.js workflow |
| Quick fix | Direct edit + verify (no workflow overhead) |
| Complex task | Plan first via Plan agent, then feature.js

Monorepo with a NestJS backend and React + Vite frontend. PostgreSQL runs in Docker; the backend and frontend communicate via Vite proxy in dev, or the backend serves the built frontend as static in production.

### Backend (`backend/`)

**NestJS** with TypeORM, PostgreSQL, JWT auth (Passport), Multer file uploads, rate limiting (ThrottlerModule).

Key modules:
- `src/auth/` — JWT auth with Passport. Auto-seeds an admin user (`admin@example.com` / `admin123`) on first launch. Rate-limited login (5 req/min). `/api/auth/login` and `/api/auth/me` endpoints.
- `src/content/` — All public-facing content CRUD. Split into `PublicContentController` (unauthenticated GETs) and per-entity `Admin*Controllers` (JWT-guarded). Content entities are managed via TypeORM repositories.
- `src/upload/` — File upload via Multer. Single file `POST /api/upload` and multiple files `POST /api/upload/multiple`. JWT-guarded. Accepts jpeg/png/webp, max 10 MB, stores in `./uploads/`.

**Data model** (7 entities):
- `best_photos` — Hero carousel images (title, imageUrl, orderIndex)
- `portfolio_categories` → `portfolio_sessions` → `portfolio_photos` — Hierarchical portfolio (category → session → photo). Each level has orderIndex for drag-reorder.
- `price_items` — Services list (name, description, price as string, orderIndex)
- `reviews` — Client testimonials (clientName, text, clientPhotoUrl nullable)
- `about` — Single-row profile (photoUrl, fullName, bioText)

**Admin API pattern**: Every entity with `orderIndex` supports `PATCH /api/admin/<entity>/reorder` with `{ items: [{ id, orderIndex }] }`. All admin endpoints are prefixed `/api/admin/<entity>` and guarded by `JwtAuthGuard`.

**Migrations**: TypeORM migrations in `src/migrations/`. Run via `data-source.ts` (standalone, reads env). `synchronize: false` in production.

### Frontend (`frontend/`)

**React 19** with TypeScript, Vite, React Router v7, Axios. CSS Modules for styling.

Key layers:
- `src/services/api.ts` — Axios instance with JWT token interceptor. In dev, Vite proxies `/api` and `/uploads` to `http://localhost:3000`. In production, the backend serves everything on the same port.
- `src/contexts/AuthContextProvider.tsx` — Auth state (user, login, logout, loading). On mount, checks for existing token by calling `/api/auth/me`.
- `src/hooks/` — `useFetch<T>` (generic GET with loading/error/refetch), `useAdminCrud<T>` (generic CRUD + reorder for any admin entity), per-page hooks (useHome, usePortfolio, etc.), `useUploadImage` for file uploads.
- `src/components/` — Shared UI: `Layout` (public page shell), `HeroCarousel`, `ReviewCard`, `DraggableTable` (sortable admin list), `DropZone` (drag-and-drop image upload), `ImageLightbox`, `AnimatedSection`, `Skeleton`, `ProtectedRoute`.
- `src/pages/` — Public: Home, Portfolio, Price, Reviews, About. Admin: Login, Dashboard, per-entity admin pages.
- `src/types/index.ts` — TypeScript interfaces matching backend entities.
- `src/styles/` — `variables.css` (CSS custom properties), `shared-admin.module.css` (shared admin page styles).

**Admin CRUD pattern**: Each admin page consumes `useAdminCrud<T>(baseUrl)` which returns `{ items, loading, error, createItem, updateItem, deleteItem, reorderItems }`. Images are uploaded via `DropZone` + `useUploadImage` hook, then the returned URL is saved to the entity.

### Routing

Public routes under `/` → `Layout` (header, footer, hero):
- `/` → Home (best photos carousel)
- `/portfolio` → Portfolio (categories → sessions → photos)
- `/price` → Price (price items)
- `/reviews` → Reviews (testimonials)
- `/about` → About (bio)

Admin routes under `/admin` → `ProtectedRoute` → `AdminLayout`:
- `/admin/login` → Login
- `/admin/dashboard` → Dashboard
- `/admin/best-photos`, `/admin/portfolio-categories`, `/admin/portfolio-sessions`, `/admin/portfolio-photos`, `/admin/price-items`, `/admin/reviews`, `/admin/about`

### Infrastructure

- **Docker Compose**: `postgres` (dev, port 5430) and `postgres-prod` (prod, port 5431) via Docker profiles. Production also builds the backend container.
- **Production**: Backend serves the built frontend as static files via `@nestjs/serve-static` with SPA fallback. CORS is not needed — same origin.
- **`.env`**: Copy `docker-compose.env.example` to `.env` and fill secrets. `JWT_SECRET` needed for auth.