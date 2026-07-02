# Photographer Portfolio

Веб-сайт-портфолио фотографа с админ-панелью.

## Технологии

- **Бэкенд:** NestJS, TypeORM, PostgreSQL, JWT
- **Фронтенд:** React, TypeScript, Vite
- **БД:** PostgreSQL в Docker

## Быстрый старт (dev)

```bash
# 1. Запустить PostgreSQL (только БД, без контейнера бэкенда)
npm run db:start

# 2. Установить зависимости
npm run install:all

# 3. Накатить миграции
npm run migration:run

# 4. Запустить frontend + backend одновременно (hot-reload)
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Admin: http://localhost:5173/admin/login

## Production сборка

```bash
# 1. PostgreSQL уже должен быть запущен
npm run db:start

# 2. Собрать frontend + backend
npm run build

# 3. Установить NODE_ENV=production и FRONTEND_URL (см. .env)
#    Backend будет раздавать фронтенд как статику

# 4. Запустить
npm start
```

В production фронтенд раздаётся бэкендом на том же порту 3000.
CORS отключать не нужно — всё работает на одном origin.

## Доступные команды

| Команда | Описание |
|---|---|
| `npm run db:start` | Запустить PostgreSQL в Docker |
| `npm run db:stop` | Остановить PostgreSQL |
| `npm run db:reset` | Пересоздать БД (удалит данные!) |
| `npm run dev` | Запустить frontend + backend для разработки |
| `npm run dev:backend` | Только backend |
| `npm run dev:frontend` | Только frontend |
| `npm run build` | Собрать frontend + backend |
| `npm start` | Запустить production сборку |
| `npm run migration:run` | Накатить миграции |
| `npm run migration:generate` | Создать миграцию по изменениям entity |
| `npm run lint` | Проверить код линтером |

## Структура

```
/
├── docker-compose.yml    # PostgreSQL
├── package.json          # Корневые скрипты
├── backend/              # NestJS API сервер
└── frontend/             # React клиент
```