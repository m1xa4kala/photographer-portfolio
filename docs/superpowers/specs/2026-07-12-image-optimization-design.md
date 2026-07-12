# Image Optimization & Secure Download Design

**Date:** 2026-07-12
**Status:** Draft

## 1. Goals

1. **Сжать фото для веба** — конвертировать в WebP при загрузке, чтобы страницы загружались быстрее
2. **Сохранять оригиналы** — в S3 Bucket (TimeWeb), не занимая место на сервере (15 ГБ)
3. **Секретные ссылки на скачивание** — каждая фотосессия получает уникальный токен; клиент по ссылке может скачать ZIP со всеми оригиналами

## 2. Архитектура

```
                          ЗАГРУЗКА
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Админ       │────►│ POST /upload/    │────►│ Sharp: WebP 85%  │──► ./uploads/{id}.webp
│ (DropZone)  │     │ (single/multiple)│     │ + resize 2000px  │
└─────────────┘     └────────┬─────────┘     └────────┬─────────┘
                             │                        │
                             │ Оригинал                │
                             ▼                        ▼
                      ┌──────────────┐         ┌──────────────┐
                      │ S3 Bucket    │         │ Frontend     │
                      │ originals/   │         │ createItem() │
                      │ 2026/07/...  │         │ с s3Key      │
                      └──────────────┘         └──────┬───────┘
                                                      │
                                                      ▼
                                               ┌──────────────┐
                                               │ БД: s3Key    │
                                               │ сохранён     │
                                               └──────────────┘

                          СКАЧИВАНИЕ
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Клиент      │────►│ /download/{token}│────►│ S3: stream      │
│ (браузер)   │     │                  │     │ originals → ZIP │
└─────────────┘     └──────────────────┘     └──────────────────┘
```

## 3. Изменения в данных

### 3.1. PortfolioPhoto — новое поле `s3Key`

```typescript
// Entity
@Column({ nullable: true, type: 'varchar' })
s3Key!: string | null;
```

Хранит ключ объекта в S3 (например `originals/2026/07/16944-a1b2_photo.jpg`).
`nullable` — старые фото (до внедрения) не имеют s3Key.

### 3.2. PortfolioSession — новые поля `downloadToken` и `downloadsEnabled`

```typescript
// Entity
@Column({ nullable: true, unique: true, type: 'varchar' })
downloadToken!: string | null;

@Column({ default: false })
downloadsEnabled!: boolean;
```

- `downloadToken` — UUID v4, генерируется админом по кнопке «Создать ссылку»
- `downloadsEnabled` — вкл/выкл доступ по ссылке

### 3.3. DTO changes

```typescript
// CreatePortfolioPhotoDto — добавляем s3Key
@IsOptional()
@IsString()
s3Key?: string;

// UpdatePortfolioSessionDto — расширяется
// (сами endpoint'ы генерации токена — отдельные, не через update)
```

## 4. Upload Flow (подробно)

### 4.1. Backend: UploadController

**Текущий код:** получает файл → валидирует → пишет на диск.

**Новый код:**
1. Валидируем файл (magic bytes) — без изменений
2. **Sharp:**
   - Читаем буфер
   - Resize: `resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })`
   - Конвертируем в WebP: `webp({ quality: 85 })`
   - Генерируем имя: `{timestamp}-{random}.webp`
   - Сохраняем в `./uploads/{filename}.webp`
3. **S3:**
   - Генерируем ключ: `originals/{YYYY}/{MM}/{timestamp}-{random}_{originalname}`
   - Загружаем оригинальный буфер в S3
4. **Ответ:**
   - Для single: `{ url: '/uploads/filename.webp', s3Key: 'originals/...' }`
   - Для multiple: `{ urls: [...], s3Keys: [...] }`

### 4.2. S3Service (новый модуль)

```typescript
@Injectable()
class S3Service {
  async upload(buffer: Buffer, key: string): Promise<void>
  async getStream(key: string): Promise<Readable>
  async delete(key: string): Promise<void>
}
```

Конфигурация из `.env`:
```
S3_ENDPOINT=https://s3.timeweb.com
S3_REGION=ru-1
S3_BUCKET=photographer-originals
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
```

### 4.3. Frontend: DropZone / PortfolioPhotosAdmin

- `POST /upload/multiple` возвращает `{ urls: string[], s3Keys: string[] }`
- Тип `UploadedFileInfo` в DropZone.tsx расширяется: добавляется поле `s3Key: string`
- `handleBulkUpload` получает `UploadedFileInfo` с s3Key и передаёт его в `createItem`
- При создании фото: `createItem({ title: name, imageUrl: url, sessionId, s3Key })`

### 4.4. Обработка ошибок

| Сценарий | Действие |
|----------|----------|
| S3 недоступен при загрузке | Удалить WebP с диска. Вернуть 502. |
| WebP конвертация упала | Не трогать S3. Вернуть 500. |
| Создание записи в БД упало | Удалить WebP + S3. Вернуть 500. |
| Удаление фото | Удалить WebP с диска + из S3 (если есть s3Key) |

## 5. Secret Link & Download Flow

### 5.1. Генерация токена (админка)

- Админ на странице редактирования сессии нажимает «Создать ссылку для скачивания»
- `PATCH /admin/portfolio-sessions/:id/generate-token`
- Сервер генерирует `crypto.randomUUID()`, сохраняет в `downloadToken`
- Возвращает полный URL: `https://example.com/download/{token}`
- Админ копирует ссылку и отправляет клиенту

### 5.2. Публичная страница `/download/:token`

- React-роут: `<Route path="/download/:token" element={<SessionDownload />} />`
- При монтировании: `GET /api/content/session-by-token/:token`
- Возвращает: `{ session: { name }, photos: [{ imageUrl, title }] }`
- Если токен невалиден → 404
- Если `downloadsEnabled = false` → 403

**Дизайн страницы:**
- Заголовок: название сессии
- Сетка фото (уменьшенные WebP, те же что на сайте)
- Кнопка «Скачать все фото (архив)»
- Крупная, заметная, в центре вверху

### 5.3. Скачивание ZIP

- `GET /api/content/download-session/:token`
- Проверяет токен + `downloadsEnabled`
- Для каждого фото с непустым `s3Key`:
  - `S3Service.getStream(key)` → readable stream
  - `archiver` (npm) пайпит все стримы в ZIP
  - В ZIP файлы кладутся «плоско» (flat), без вложенных папок, с оригинальными именами файлов
  - Response headers: `Content-Disposition: attachment; filename="session-name.zip"`
- Если у сессии нет фото с s3Key → 404 с сообщением «Оригиналы ещё не загружены»

## 6. Админка: управление ссылками

### 6.1. PortfolioSessionsAdmin — новые элементы

Для каждой сессии в таблице:
- Кнопка «🔗 Создать ссылку» / «🔗 Скопировать ссылку» (если уже есть)
- Переключатель «Разрешить скачивание» (on/off)
- Кнопка «🚫 Отозвать» (удаляет токен)

### 6.2. Новые endpoint'ы

| Method | Path | Action |
|--------|------|--------|
| `PATCH` | `/admin/portfolio-sessions/:id/generate-token` | Создать/обновить токен |
| `PATCH` | `/admin/portfolio-sessions/:id/revoke-token` | Удалить токен |

## 7. Зависимости (npm)

```json
{
  "sharp": "^0.33.x",
  "@aws-sdk/client-s3": "^3.x",
  "@aws-sdk/lib-storage": "^3.x",
  "archiver": "^7.x"
}
```

## 8. Новая миграция

```sql
ALTER TABLE portfolio_photos ADD COLUMN s3_key VARCHAR(255) NULL;
ALTER TABLE portfolio_sessions ADD COLUMN download_token VARCHAR(36) NULL UNIQUE;
ALTER TABLE portfolio_sessions ADD COLUMN downloads_enabled BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX idx_portfolio_sessions_download_token ON portfolio_sessions(download_token);
```

## 9. Безопасность

- Токен — `crypto.randomUUID()` (128 бит случайности)
- Токен хранится только в БД, не логируется
- S3-доступ — через Access Key / Secret Key из `.env`
- HTTPS обязателен для ссылок скачивания
- Rate limiting на download endpoint (10 запросов в минуту с одного IP)

## 10. Что НЕ входит в этот скоуп

- Сжатие уже загруженных фото (ретроспектива) — только новые загрузки
- Автоматическая очистка S3 при удалении сессии
- Прогресс-бар загрузки больших архивов
- Превью для ZIP перед скачиванием

## 11. Порядок реализации

1. Установить npm-зависимости (sharp, @aws-sdk/client-s3, archiver)
2. Создать S3Module + S3Service
3. Обновить UploadController: добавить Sharp-конвертацию + S3-загрузку
4. Обновить сущности (PortfolioPhoto.s3Key, PortfolioSession.downloadToken/downloadsEnabled)
5. Сгенерировать миграцию и накатить
6. Обновить DTO (CreatePortfolioPhotoDto — добавить s3Key)
7. Обновить PortfolioPhotosAdmin (передавать s3Key при создании)
8. Добавить endpoint'ы генерации/отзыва токена в AdminPortfolioSessionsController
9. Обновить PortfolioSessionsAdmin (кнопки управления токенами)
10. Создать DownloadController (публичный: session-by-token + download-session)
11. Создать React-страницу SessionDownload (роут /download/:token)
12. Проверить сборку и протестировать