# Upload Cleanup, Retries, and DB-Bucket Sync

**Date:** 2026-07-13
**Status:** Design

## Overview

Два связанных улучшения для системы загрузки файлов: (1) надёжная загрузка с ретраями и откатом при ошибках, (2) синхронизация БД с S3-бакетом по требованию. Дополнительно: замена нативных `<input type="file">` на стилизованный компонент и замена `window.confirm()` на кастомный модальный диалог.

## 1. Backend — Retry + Rollback при загрузке

### Сейчас
- `UploadController.uploadFiles()` (локальная ФС) — очищает только при ошибке магических байт
- `AdminFullSessionsController.uploadFiles()` (S3) — нет очистки вообще

### Нужно
- При любой ошибке в цикле загрузки (сеть, конвертация, запись) — удалять уже загруженные файлы
- До 5 повторных попыток для каждого файла при ошибках S3

### S3Service изменения
- Добавить `uploadWithRetry(buffer, key, maxRetries=5)` — внутренний retry с экспоненциальной задержкой (1s, 2s, 3s, 4s, 5s)
- Добавить `exists(key): Promise<boolean>` через `HeadObjectCommand`

### FullSessionsService изменения
- `uploadFile()` — использовать `S3Service.uploadWithRetry()` вместо `upload()`

### AdminFullSessionsController изменения
- В `uploadFiles()` — трекать успешно загруженные ключи
- При ошибке — удалить все накопленные ключи из S3 через `catch(() => {})`
- Пробросить `BadRequestException` с сообщением об ошибке

### UploadController изменения
- В `uploadFiles()` — общий try-catch вокруг цикла
- При ошибке — удалить все накопленные файлы через `unlink()`
- Очистка сейчас есть только для magic bytes, расширить на все ошибки

## 2. Backend — Sync endpoint

### S3Service
- `exists(key: string): Promise<boolean>` — HeadObject, возвращает false при NotFound

### FullSessionsService
- `syncWithBucket(): Promise<{ deleted: number; total: number }>`
  - Загрузить все `SessionOriginalFile`
  - Для каждой проверить `S3Service.exists(s3Key)`
  - Если не существует — удалить запись из БД
  - Вернуть количество удалённых

### AdminFullSessionsController
- `POST sync` — вызов `syncWithBucket()`, возврат отчёта

## 3. Frontend — Custom ImageUploadButton

### Новый компонент: `ImageUploadButton`
- Пропсы: `onUpload: (url: string) => void`, `currentUrl?: string`, `label?: string`
- Стилизованная кнопка с иконкой 📷
- При клике — открывает `input type="file"` (скрытый)
- После загрузки — показывает превью и кнопку ✕ для удаления
- Состояние загрузки (спиннер/disabled)
- В стиле DropZone, но компактный (inline-block)

### Где заменить
- `AboutAdmin.tsx` — строка 44: `<input type="file" accept="image/*">` → `<ImageUploadButton>`
- `ReviewsAdmin.tsx` — строки 59-64: `<input type="file" accept="image/*">` → `<ImageUploadButton>`

## 4. Frontend — Custom ConfirmDialog

### Новый компонент: `ConfirmDialog`
- Модальное окно с backdrop (полупрозрачный чёрный фон)
- Заголовок, текст сообщения, кнопки "Да" / "Отмена"
- Закрытие по Escape и по клику на backdrop
- Анимация появления (fade-in)

### Новый хук: `useConfirm`
- `const { confirm, ConfirmDialogComponent } = useConfirm()`
- `confirm(message: string): Promise<boolean>` — возвращает true/false
- Рендерит `ConfirmDialog` в портале

### Замена
- `confirmDelete.ts` — удалить
- Все `window.confirm(...)` → `await confirm(...)` во всех admin-страницах

## 5. Frontend — Sync button in FullSessionsAdmin

### Изменения в `FullSessionsAdmin.tsx`
- Добавить кнопку "🔄 Синхронизировать с бакетом" в секцию загрузки
- POST запрос `/api/admin/full-sessions/sync`
- Показать результат: "Удалено N записей из БД"
- Использовать `useConfirm` для подтверждения

## Implementation Order

1. **Backend core**: S3Service.uploadWithRetry + S3Service.exists
2. **Backend controllers**: AdminFullSessionsController rollback + UploadController rollback + sync endpoint
3. **Frontend components**: ImageUploadButton + ConfirmDialog/useConfirm
4. **Frontend pages**: AboutAdmin, ReviewsAdmin, FullSessionsAdmin (sync button)
5. **Verify**: lint, type-check, test

## Files to Create
- `frontend/src/components/ImageUploadButton.tsx`
- `frontend/src/components/ImageUploadButton.module.css`
- `frontend/src/components/ConfirmDialog.tsx`
- `frontend/src/components/ConfirmDialog.module.css`
- `frontend/src/hooks/useConfirm.ts`

## Files to Modify
- `backend/src/s3/s3.service.ts` — add uploadWithRetry, exists
- `backend/src/content/services/full-sessions.service.ts` — use retry, add syncWithBucket
- `backend/src/content/controllers/admin-full-sessions.controller.ts` — rollback, sync endpoint
- `backend/src/upload/upload.controller.ts` — rollback on all errors
- `frontend/src/pages/admin/AboutAdmin.tsx` — ImageUploadButton
- `frontend/src/pages/admin/ReviewsAdmin.tsx` — ImageUploadButton + useConfirm
- `frontend/src/pages/admin/BestPhotosAdmin.tsx` — useConfirm
- `frontend/src/pages/admin/PortfolioPhotosAdmin.tsx` — useConfirm
- `frontend/src/pages/admin/PortfolioSessionsAdmin.tsx` — useConfirm
- `frontend/src/pages/admin/PortfolioCategoriesAdmin.tsx` — useConfirm
- `frontend/src/pages/admin/PriceItemsAdmin.tsx` — useConfirm
- `frontend/src/pages/admin/FullSessionsAdmin.tsx` — useConfirm + sync button
- `frontend/src/utils/confirmDelete.ts` — delete