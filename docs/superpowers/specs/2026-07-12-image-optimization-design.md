# Image Optimization & Session Download Design

**Date:** 2026-07-12
**Status:** Draft

## 1. Goals

1. **Сжать фото для веба** — конвертировать в WebP при загрузке, чтобы страницы загружались быстрее
2. **Лимит 15 фото на сессию** — PortfolioPhotosAdmin показывает не больше 15 фото на одну фотосессию
3. **Полные фотосессии в S3** — отдельная админ-страница для загрузки оригиналов без сжатия в S3 Bucket (TimeWeb)
4. **Секретные ссылки на скачивание** — каждая фотосессия получает уникальный токен; клиент по ссылке может скачать ZIP со всеми оригиналами

## 2. Архитектура

```
                         ПОТОК 1: ВЕБ-ФОТО (PortfolioPhotosAdmin)
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Админ       │────►│ POST /upload/    │────►│ Sharp: WebP 85%  │──► ./uploads/{id}.webp
│ (DropZone)  │     │ (single/multiple)│     │ + resize 2000px  │
└─────────────┘     └──────────────────┘     └──────────────────┘
      │ макс 15 фото                                   │
      ▼                                                 ▼
┌──────────────┐                                 ┌──────────────┐
│ БД:          │                                 │ Frontend     │
│ portfolio_   │◄────────────────────────────────│ createItem() │
│ photos       │                                 │ (imageUrl)   │
└──────────────┘                                 └──────────────┘

                         ПОТОК 2: ОРИГИНАЛЫ (FullSessionsAdmin)
┌─────────────┐     ┌──────────────────────────────────┐
│ Админ       │────►│ POST /admin/sessions/:id/        │
│ (DropZone)  │     │      original-files/upload       │
└─────────────┘     └────────┬─────────────────────────┘
                             │ без сжатия, любой размер
                             ▼
                      ┌──────────────┐
                      │ S3 Bucket    │
                      │ originals/   │
                      │ 2026/07/...  │
                      └──────┬───────┘
                             │
                             ▼
                      ┌──────────────┐
                      │ БД:          │
                      │ session_     │
                      │ original_    │
                      │ files        │
                      └──────────────┘

                         СКАЧИВАНИЕ
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Клиент      │────►│ /download/{token}│────►│ S3: stream      │
│ (браузер)   │     │                  │     │ originals → ZIP │
└─────────────┘     └──────────────────┘     └──────────────────┘
```

## 3. Изменения в данных

### 3.1. Новая сущность `FullSession`

Отдельная сущность для полных фотосессий (оригиналы, скачивание клиентами).
Не имеет отношения к PortfolioSession — это независимая сущность.

```typescript
// Entity
@Entity('full_sessions')
export class FullSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;               // название, напр. "Свадьба Ивана и Марии — оригиналы"

  @Column({ nullable: true, type: 'text' })
  description!: string | null;   // необязательное описание

  @Column({ nullable: true, unique: true, type: 'varchar' })
  downloadToken!: string | null; // UUID v4, генерируется админом

  @Column({ default: false })
  downloadsEnabled!: boolean;    // вкл/выкл доступ по ссылке

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @OneToMany(() => SessionOriginalFile, (file) => file.fullSession)
  originalFiles!: SessionOriginalFile[];
}
```

- `FullSession` **не показывается** на публичном сайте портфолио
- У каждой FullSession может быть неограниченное количество оригиналов
- Создаётся только в админке, только для выдачи клиентам

### 3.2. Новая сущность `SessionOriginalFile`

```typescript
// Entity
@Entity('session_original_files')
export class SessionOriginalFile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  fullSessionId!: number;

  @ManyToOne(() => FullSession, (session) => session.originalFiles)
  @JoinColumn({ name: 'fullSessionId' })
  fullSession!: FullSession;

  @Column()
  originalName!: string;      // оригинальное имя файла, напр. "DSC_001.jpg"

  @Column()
  s3Key!: string;              // ключ в S3, напр. "originals/2026/07/..."

  @Column({ type: 'bigint', default: 0 })
  fileSize!: number;           // размер в байтах

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt!: Date;
}
```

### 3.3. PortfolioSession — без изменений

PortfolioSession **не получает** новых полей. Никакого `downloadToken`, `downloadsEnabled` или `originalFiles`.
Единственное изменение — лимит 15 PortfolioPhoto на одну PortfolioSession.

### 3.4. Ограничение PortfolioPhoto — максимум 15 на сессию

**Backend:** В `AdminPortfolioPhotosController.create()` — проверка: если в сессии уже 15+ фото, возвращать 400 с сообщением «В фотосессии не может быть больше 15 фото».

**Frontend:** В `PortfolioPhotosAdmin` — при достижении лимита скрывать DropZone и показывать сообщение «Достигнут лимит в 15 фото для этой сессии».

DTO для `PortfolioPhoto` — **без изменений** (s3Key не добавляется).

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
3. **Ответ:**
   - Для single: `{ url: '/uploads/filename.webp' }`
   - Для multiple: `{ urls: [...] }`

**S3 вынесен из UploadController** — загрузка оригиналов в S3 происходит только через отдельный endpoint `/admin/sessions/:id/original-files/upload` (см. раздел 6.3) без конвертации и сжатия.

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

### 4.3. Frontend: PortfolioPhotosAdmin

- `POST /upload/multiple` возвращает `{ urls: string[] }` — без изменений
- `handleBulkUpload` работает как сейчас: `createItem({ title: name, imageUrl: url, sessionId })`
- **Добавить проверку:** если в сессии уже 15 фото, скрыть DropZone и показать сообщение о лимите

### 4.4. Обработка ошибок

| Сценарий | Действие |
|----------|----------|
| S3 недоступен при загрузке оригинала | Удалить запись из БД. Вернуть 502. |
| WebP конвертация упала | Не трогать S3. Вернуть 500. |
| Удаление PortfolioPhoto | Удалить WebP с диска. S3 не трогать. |
| Удаление SessionOriginalFile | Удалить объект из S3. Удалить запись из БД. |

## 5. Secret Link & Download Flow

### 5.1. Генерация токена (админка)

- Админ на странице **FullSessionsAdmin** нажимает «Создать ссылку для скачивания» для выбранной FullSession
- `POST /admin/full-sessions/:id/generate-token`
- Сервер генерирует `crypto.randomUUID()`, сохраняет в `downloadToken` на FullSession
- Возвращает полный URL: `https://example.com/download/{token}`
- Админ копирует ссылку и отправляет клиенту

### 5.2. Публичная страница `/download/:token`

- React-роут: `<Route path="/download/:token" element={<SessionDownload />} />`
- При монтировании: `GET /api/content/full-session-by-token/:token`
- Возвращает: `{ fullSession: { title, description }, fileCount: number, totalSize: number }`
- Если токен невалиден → 404
- Если `downloadsEnabled = false` → 403

**Дизайн страницы:**
- Заголовок: название полной сессии
- Описание (если есть)
- Информация: количество файлов, общий размер
- Кнопка «Скачать все фото (архив)»
- Крупная, заметная, в центре вверху

### 5.3. Скачивание ZIP

- `GET /api/content/download-session/:token`
- Проверяет токен + `downloadsEnabled` на FullSession
- Загружает все `SessionOriginalFile` для этой FullSession
- Для каждого файла: `S3Service.getStream(key)` → readable stream
- `archiver` (npm) пайпит все стримы в ZIP
- В ZIP файлы кладутся «плоско» (flat), без вложенных папок, с оригинальными именами файлов
- Response headers: `Content-Disposition: attachment; filename="session-title.zip"`
- Если у FullSession нет оригиналов → 404 с сообщением «Оригиналы ещё не загружены»

## 6. Админка: отдельная страница управления полными фотосессиями

**PortfolioSessionsAdmin остаётся без изменений** — только создание/редактирование/удаление сессий, без кнопок управления токенами и загрузками.

### 6.1. Новая страница: `/admin/full-sessions`

Отдельная админ-страница для управления загрузкой оригиналов и ссылками скачивания.

**Макет страницы:**

```
┌─────────────────────────────────────────────────────┐
│  Полные фотосессии                                  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  ➕ Новая FullSession                         │   │
│  │  [Название: ___________________________]     │   │
│  │  [Описание: ___________________________]     │   │
│  │  [📁 Создать]                                 │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─── Список FullSession ────────────────────────┐  │
│  │  ○ Свадьба Иван и М. — оригиналы   24 файла  ✏️ │  │
│  │  ○ Портретная съёмка Анны          12 файлов  ✏️ │  │
│  │  ○ Семейная фотосессия Петровых     8 файлов  ✏️ │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌─── Выбрано: "Свадьба Иван и М. — оригиналы" ──┐  │
│  │  📤 Загрузить оригиналы                        │  │
│  │  [DropZone — перетащите файлы сюда]            │  │
│  │  (JPEG/PNG/TIFF, без ограничения по размеру)   │  │
│  │                                                 │  │
│  │  Файлы (24 шт.)                                 │  │
│  │  DSC_001.jpg  │  24.5 MB  │ 12.07.2026  │ 🗑️ │  │
│  │  DSC_002.jpg  │  18.2 MB  │ 12.07.2026  │ 🗑️ │  │
│  │  ...                                            │  │
│  │                                                 │  │
│  │  ┌─── Ссылка для скачивания ─────────────────┐  │  │
│  │  │  [🔗 Создать ссылку]                        │  │
│  │  │  Ссылка: https://example.com/download/...   │  │
│  │  │  [📋 Скопировать]  [🚫 Отозвать]            │  │
│  │  │  [🔓 Разрешить скачивание] ○ Да  ○ Нет      │  │
│  │  └────────────────────────────────────────────┘  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Функциональность:**
1. Создание/редактирование/удаление FullSession (название, описание)
2. Выбор FullSession из списка для управления её файлами
3. Загрузка оригиналов в S3 через DropZone (без сжатия, без ограничения по размеру)
4. Список загруженных файлов: имя, размер, дата, кнопка удаления
5. Генерация/копирование/отзыв секретной ссылки для выбранной FullSession
6. Вкл/выкл доступности скачивания

### 6.2. Frontend — новые компоненты

- `FullSessionsAdmin.tsx` — страница, роут `/admin/full-sessions`
- Хук `useAdminFullSessions` — CRUD для FullSession (список, создание, обновление, удаление)
- Хук `useAdminFullSessionFiles(fullSessionId)` — загрузка/удаление/список файлов для выбранной FullSession
- Хук `useAdminFullSessionToken(fullSessionId)` — генерация/отзыв/статус токена

### 6.3. Бэкенд — новые endpoint'ы

Все endpoint'ы работают с `FullSession`, а не с `PortfolioSession`.

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/admin/full-sessions` | Список всех FullSession |
| `POST` | `/admin/full-sessions` | Создать новую FullSession |
| `GET` | `/admin/full-sessions/:id` | Детали FullSession + файлы |
| `PATCH` | `/admin/full-sessions/:id` | Обновить название/описание |
| `DELETE` | `/admin/full-sessions/:id` | Удалить сессию + файлы из S3 |
| `POST` | `/admin/full-sessions/:id/upload-files` | Загрузить оригинал(ы) в S3 |
| `DELETE` | `/admin/full-sessions/:id/files/:fileId` | Удалить оригинал из S3 и БД |
| `POST` | `/admin/full-sessions/:id/generate-token` | Создать/обновить токен |
| `POST` | `/admin/full-sessions/:id/revoke-token` | Отозвать токен |
| `PATCH` | `/admin/full-sessions/:id/toggle-downloads` | Вкл/выкл скачивание |

**Контроллер:** `AdminFullSessionsController` (отдельный).

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
-- Новая таблица: FullSession (отдельная от PortfolioSession)
CREATE TABLE full_sessions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  download_token VARCHAR(36) NULL UNIQUE,
  downloads_enabled BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_full_sessions_download_token ON full_sessions(download_token);

-- Новая таблица: оригиналы для FullSession
CREATE TABLE session_original_files (
  id SERIAL PRIMARY KEY,
  "fullSessionId" INTEGER NOT NULL REFERENCES full_sessions(id) ON DELETE CASCADE,
  "originalName" VARCHAR(255) NOT NULL,
  "s3Key" VARCHAR(255) NOT NULL,
  "fileSize" BIGINT NOT NULL DEFAULT 0,
  "uploadedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_session_original_files_full_session_id ON session_original_files("fullSessionId");

-- PortfolioSession и PortfolioPhoto — без изменений
```

## 9. Безопасность

- Токен — `crypto.randomUUID()` (128 бит случайности)
- Токен хранится только в БД, не логируется
- S3-доступ — через Access Key / Secret Key из `.env`
- HTTPS обязателен для ссылок скачивания
- Rate limiting на download endpoint (10 запросов в минуту с одного IP)
- Upload endpoint для оригиналов — только JWT (админка), без публичного доступа
- Проверка MIME-типа при загрузке оригиналов (только image/jpeg, image/png, image/tiff)

## 10. Что НЕ входит в этот скоуп

- Сжатие уже загруженных фото (ретроспектива) — только новые загрузки
- Автоматическая очистка S3 при удалении сессии
- Прогресс-бар загрузки больших архивов
- Превью для ZIP перед скачиванием
- PortfolioSession — без изменений, только лимит 15 фото
- FullSession — независимая сущность, не связанная с PortfolioSession

## 11. Порядок реализации

### Этап 1: Веб-оптимизация (сжатие фото)

1. Установить npm-зависимости (sharp)
2. Обновить UploadController: добавить Sharp-конвертацию в WebP
3. Проверить сборку и протестировать

### Этап 2: Ограничение PortfolioPhotos (макс. 15 фото на сессию)

4. В `AdminPortfolioPhotosController.create()` — добавить проверку: если в сессии уже 15 фото, вернуть 400
5. В `PortfolioPhotosAdmin.tsx` — скрывать DropZone при достижении лимита, показывать сообщение
6. Проверить сборку

### Этап 3: Полные фотосессии (S3 + скачивание)

7. Установить npm-зависимости (@aws-sdk/client-s3, @aws-sdk/lib-storage, archiver)
8. Создать S3Module + S3Service
9. Создать сущности FullSession + SessionOriginalFile
10. Сгенерировать миграцию и накатить
11. Создать AdminFullSessionsController (endpoint'ы из раздела 6.3)
12. Создать FullSessionsAdmin.tsx (страница админки, роут /admin/full-sessions)
13. Создать хуки useAdminFullSessions (CRUD для FullSession) + useAdminFullSessionFiles (загрузка/удаление файлов)
14. Добавить ссылку в AdminLayout sidebar
15. Создать DownloadController (публичный: full-session-by-token + download-session)
16. Создать React-страницу SessionDownload (роут /download/:token)
17. Проверить сборку и протестировать end-to-end