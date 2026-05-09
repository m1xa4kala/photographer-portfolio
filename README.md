# Photographer Portfolio

Веб-сайт-портфолио фотографа с админ-панелью и приватными клиентскими галереями.

## Технологии

- **Бэкенд:** NestJS, TypeORM, PostgreSQL, JWT
- **Фронтенд:** React, TypeScript, Vite

## Структура

- `/backend` – API сервер
- `/frontend` – клиентская часть (публичный сайт + админка)

## Установка и запуск

### Требования
- Node.js 18+
- Docker (для PostgreSQL) или локальный Postgres

### Бэкенд
```bash
cd backend
cp .env.example .env
# заполните .env
npm install
npm run migration:run
npm run start:dev