# Social Links Feature — Design Document

## Overview

Добавить возможность редактирования ссылок на соцсети фотографа через админ-панель. Ссылки отображаются на публичных страницах сайта (About, Footer), данные подтягиваются с сервера.

## Data Model

### Новая сущность `SocialLink` (отдельная таблица, без привязки к About)

```typescript
@Entity('social_links')
export class SocialLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()           // "Instagram", "VK", "Telegram"...
  platform: string;

  @Column()           // полный URL, например "https://instagram.com/vlada"
  url: string;

  @Column()           // имя иконки: "instagram", "vk", "telegram"...
  iconName: string;

  @Column({ default: 0 })
  orderIndex: number;
}
```

### Топ-10 иконок (выпадающий список)

| # | Платформа | iconName | Иконка (react-icons/si) |
|---|-----------|----------|------------------------|
| 1 | Instagram | instagram | `SiInstagram` |
| 2 | VK | vk | `SiVk` |
| 3 | Telegram | telegram | `SiTelegram` |
| 4 | WhatsApp | whatsapp | `SiWhatsapp` |
| 5 | YouTube | youtube | `SiYoutube` |
| 6 | TikTok | tiktok | `SiTiktok` |
| 7 | Twitter / X | twitter | `SiX` |
| 8 | Pinterest | pinterest | `SiPinterest` |
| 9 | Viber | viber | `SiViber` |
| 10 | Vimeo | vimeo | `SiVimeo` |

## Backend

### API Endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| `GET` | `/api/content/social-links` | ❌ | Публичный: список всех ссылок, отсортированных по `orderIndex` |
| `GET` | `/api/admin/social-links` | ✅ JWT | Список всех ссылок |
| `POST` | `/api/admin/social-links` | ✅ JWT | Создать новую ссылку |
| `PUT` | `/api/admin/social-links/:id` | ✅ JWT | Обновить ссылку |
| `DELETE` | `/api/admin/social-links/:id` | ✅ JWT | Удалить ссылку |
| `PATCH` | `/api/admin/social-links/reorder` | ✅ JWT | Пересортировать (принимает `{ items: [{ id, orderIndex }] }`) |

### Паттерн реализации

Единый паттерн со всеми админ-сущностями:

1. **Сущность**: `SocialLink` — `social-links.entity.ts`
2. **DTOs**: `CreateSocialLinkDto`, `UpdateSocialLinkDto`
3. **Сервис**: `SocialLinksService` — CRUD + reorder
4. **Контроллер админки**: `AdminSocialLinksController` — JWT-guarded
5. **Публичный эндпоинт**: добавляется в `PublicContentController`
6. **Модуль**: регистрируется в `ContentModule`

### Migrations

TypeORM миграция для создания таблицы `social_links`.

## Frontend

### Admin: новая страница `/admin/social-links`

- **Список ссылок** — `DraggableTable` (как в BestPhotos, PriceItems): колонки Platform, URL, порядок
- **Кнопка "Добавить"** — открывает форму с полями:
  - **Платформа** — выпадающий список из топ-10
  - **URL** — текстовое поле (валидация: не пустой, должен быть URL)
  - При выборе платформы автоматически заполняется `iconName`
- **Редактирование** — клик по строке в DraggableTable открывает форму редактирования
- **Удаление** — кнопка удаления с подтверждением

### Admin: useAdminSocialLinks hook

- По аналогии с `useAdminBestPhotos`, с CRUD + reorder

### Admin: сайдбар

Добавить пункт меню:
```tsx
<li><NavLink to="/admin/social-links">Соцсети</NavLink></li>
```

### Public: SocialLinks компонент

Новый компонент `SocialLinks`:
- Принимает массив `SocialLink[]`
- Рендерит иконки соцсетей (из `react-icons/si`) как кликабельные ссылки с `target="_blank"` и `rel="noopener noreferrer"`
- Стилизация: одинаковый размер иконок, цвет, hover-эффект

### Public: About страница

- Новый хук `useSocialLinks` для получения данных с `/api/content/social-links`
- Отобразить `SocialLinks` компонент под биографией

### Public: Footer (уже есть в Layout.tsx)

- В футере (Layout.tsx, строка 63-68) сейчас хардкодные ссылки `<a href="#">Instagram</a> | <a href="#">Telegram</a>`
- Заменить их на динамический `SocialLinks` компонент, данные с сервера
- `SocialLinks` запрашивает данные через `useSocialLinks` хук, который вызывает `GET /api/content/social-links`

### Новые типы

```typescript
export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  iconName: string;
  orderIndex?: number;
}
```

## Пакеты

```bash
cd frontend && npm install react-icons
```

## Implementation Order

1. Backend: entity, DTOs, service, admin controller
2. Backend: public endpoint, module registration
3. Migration: generate and run
4. Frontend: install react-icons, add types, admin hook, admin page, routing, sidebar
5. Frontend: public SocialLinks component, integrate into About page and Footer
6. Verify: lint, type-check, build