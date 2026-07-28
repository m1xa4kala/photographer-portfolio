# VPS Deployment: Photographer Project

> Инструкция по деплою проекта на VPS. Стек: Docker Compose + PostgreSQL 16 + Node.js 22 (NestJS + React).

---

## 1. Подготовка VPS

```bash
# Подключиться к серверу
ssh root@<IP-адрес-вашего-VPS>

# Обновить систему
apt update && apt upgrade -y

# Установить Docker
curl -fsSL https://get.docker.com | sh

# Установить Docker Compose plugin (если не установился с Docker)
apt install -y docker-compose-plugin

# Проверить установку
docker --version
docker compose version

# Создать пользователя для деплоя (без root)
adduser deploy
usermod -aG docker deploy

# Перелогиниться под deploy
su - deploy
```

---

## 2. Клонировать проект

```bash
cd ~
git clone <URL-вашего-репозитория> photographer-project
cd photographer-project

# Если после клонирования deploy.sh не имеет права на запуск:
chmod +x deploy.sh
```

---

## 3. Настроить .env

```bash
cp docker-compose.env.example .env
nano .env
```

Минимальное содержимое `.env` для продакшена:

```ini
# PostgreSQL (prod)
DB_PROD_PASSWORD=<сгенерируйте надёжный пароль>
DB_PROD_USER=postgres
DB_PROD_NAME=photographer

# JWT — сгенерировать: openssl rand -base64 32
JWT_SECRET=<результат команды openssl rand -base64 32>

# Server
PORT=3000

# Frontend URL (для CORS — укажите ваш домен или IP)
FRONTEND_URL=https://ваш-домен.com

# Admin credentials (seed-администратор)
ADMIN_EMAIL=admin@ваш-домен.com
ADMIN_PASSWORD=<надёжный-пароль-админа>

# S3 (хранилище оригиналов фото — обязательно, нужно для uploads)
S3_ENDPOINT=https://ваш-s3-endpoint
S3_REGION=ru-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=...
```

> **Важно:** `JWT_SECRET` должен быть длинным и случайным. Используйте `openssl rand -base64 32` для генерации.

---

## 4. Собрать и запустить

```bash
# Собрать образы (без кэша — чистый build)
docker compose --profile prod build --no-cache

# Запустить
docker compose --profile prod up -d
```

Или через скрипт:

```bash
./deploy.sh --build --migrate
```

---

## 5. Запустить миграции БД

```bash
# Если не использовали --migrate, запустить вручную:
docker exec -w /app/backend photographer_app npx typeorm-ts-node-commonjs migration:run -d dist/src/data-source.js
```

Или через deploy.sh:

```bash
./deploy.sh --build --migrate
```

---

## 6. Healthcheck

```bash
# Проверить, что бэкенд отвечает
curl http://localhost:3000/api/health

# Проверить логи
docker logs photographer_app

# Статус контейнеров
docker compose --profile prod ps
```

---

## 7. Настроить Nginx (reverse proxy)

> Проект слушает на `localhost:3000`. Для доступа по домену/80/443 нужен reverse proxy.

```bash
# Установить Nginx
sudo apt install -y nginx
```

Создать конфиг `/etc/nginx/sites-available/photographer`:

```nginx
server {
    listen 80;
    server_name ваш-домен.com;

    # Redirect HTTP → HTTPS (если есть сертификат)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ваш-домен.com;

    ssl_certificate     /etc/letsencrypt/live/ваш-домен.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ваш-домен.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Максимальный размер тела запроса (для загрузки фото)
    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активировать:

```bash
sudo ln -s /etc/nginx/sites-available/photographer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. SSL-сертификат (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ваш-домен.com

# Автообновление
sudo certbot renew --dry-run
```

---

## 9. Полезные команды

### Управление проектом

```bash
# Статус всех контейнеров
docker compose --profile prod ps

# Логи в реальном времени
docker compose --profile prod logs -f

# Логи конкретного контейнера
docker logs photographer_app
docker logs postgres_photographer_prod

# Перезапустить всё
docker compose --profile prod restart

# Остановить всё
docker compose --profile prod down

# Пересобрать и запустить (после изменений кода)
docker compose --profile prod build --no-cache backend
docker compose --profile prod up -d
```

### Работа с deploy.sh

```bash
# Быстрый перезапуск (без пересборки)
./deploy.sh

# Пересобрать + запустить
./deploy.sh --build

# Пересобрать + запустить + миграции
./deploy.sh --build --migrate

# Сброс БД (удалит все данные!) + пересобрать
./deploy.sh --build --clean
```

### База данных

```bash
# Подключиться к PostgreSQL внутри контейнера
docker exec -it postgres_photographer_prod psql -U postgres -d photographer

# Полезные SQL-запросы:
#   \dt          — список таблиц
#   \d+ <table>  — структура таблицы
#   SELECT * FROM "user"; — проверить админа

# Бекап БД
docker exec postgres_photographer_prod pg_dump -U postgres photographer > backup_$(date +%Y-%m-%d).sql

# Восстановить из бекапа
cat backup_2026-07-29.sql | docker exec -i postgres_photographer_prod psql -U postgres -d photographer
```

### Очистка

```bash
# Остановить и удалить контейнеры, volume'ы
docker compose --profile prod down -v

# Удалить неиспользуемые образы
docker image prune -a

# Полностью удалить всё (включая volume uploads)
docker compose --profile prod down -v
docker volume rm photographer-project_uploads || true
```

---

## 10. Обновление проекта

```bash
cd ~/photographer-project

# Забрать свежий код
git pull origin main

# Пересобрать и запустить
docker compose --profile prod build --no-cache backend
docker compose --profile prod up -d

# Запустить новые миграции (если есть)
docker exec -w /app/backend photographer_app npx typeorm-ts-node-commonjs migration:run -d dist/src/data-source.js
```

Или одной командой:

```bash
git pull origin main && ./deploy.sh --build --migrate
```

---

## 11. Структура проекта (для деплоя)

```
photographer-project/
├── .env                          # Переменные окружения для прода
├── docker-compose.yml            # Описание сервисов
├── backend/
│   ├── Dockerfile                # Многостадийная сборка
│   ├── src/                      # NestJS приложение
│   └── package.json
├── frontend/
│   ├── src/                      # React приложение
│   └── package.json
├── deploy.sh                     # Скрипт деплоя
└── docs/
    └── vps-deployment.md         # Эта инструкция
```

**Как работает Docker:**
- 3 стадии сборки: фронтенд (React) → бэкенд (NestJS) → production-образ
- В production бэкенд раздаёт статику фронтенда (`/app/frontend/dist`)
- PostgreSQL — отдельный контейнер, подключён по внутренней сети Docker
- Uploads хранятся в Docker volume `uploads`, сохраняются при перезапуске
- Healthcheck: `GET /api/health`

---

## 12. Troubleshooting

| Проблема | Решение |
|----------|---------|
| `ECONNREFUSED postgres-prod:5432` | PostgreSQL не успел запуститься — подождите 10-15 сек или проверьте `docker logs postgres_photographer_prod` |
| Миграции упали | Проверьте, что контейнер БД здоров: `docker compose --profile prod ps` |
| 502 Bad Gateway (Nginx) | Бэкенд не запущен: `docker logs photographer_app` |
| Фото не загружаются | Проверьте S3-настройки в `.env` или volume `uploads` |
| JWT ошибки при входе | Проверьте `JWT_SECRET` — он не должен меняться между перезапусками |
| Port already in use | 3000 занят — `sudo lsof -i :3000`, смените PORT в `.env` |