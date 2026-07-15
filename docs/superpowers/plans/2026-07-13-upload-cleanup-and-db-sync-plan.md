# Upload Cleanup & DB Sync Implementation Plan

**Goal:** Retry+rollback on upload errors, on-demand DB↔S3 sync, styled single-file input, custom confirm dialog.

**Execution order:** Backend → Frontend → Review → Verify

## Phase 1: Backend (parallel agent)
- S3Service: `uploadWithRetry()` + `exists()`
- FullSessionsService: use retry, add `syncWithBucket()`
- AdminFullSessionsController: rollback, sync endpoint
- UploadController: rollback on all errors

## Phase 2: Frontend (parallel agent)
- ImageUploadButton component + CSS
- ConfirmDialog + useConfirm hook + CSS
- Replace confirmDelete in all admin pages
- Replace raw file inputs in AboutAdmin, ReviewsAdmin
- Sync button in FullSessionsAdmin

## Phase 3: Review (parallel agents)
- Backend code review (typescript-reviewer agent)
- Frontend code review (react-reviewer agent)

## Phase 4: Verify
- Lint, type-check, build