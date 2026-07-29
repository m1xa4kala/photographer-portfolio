# Docker Cleanup: Photographer Project

> Как чистить Docker-мусор и освобождать место на диске после деплоев.

---

## Почему заканчивается место

Каждый деплой через `docker compose build` оставляет мусор:

| Что засоряет диск | Почему | Типичный размер |
|---|---|---|
| **Dangling-образы** | При каждой сборке старый образ не удаляется | 200–400 MB × кол-во деплоев |
| **Build cache** | Docker BuildKit кэширует все слои сборки | 500 MB – 2 GB |
| **Логи контейнеров** | Docker пишет логи без ограничения размера | 100 MB – 3 GB |
| **Остановленные контейнеры** | Могут оставаться после `docker compose down` | 10–50 MB каждый |

---

## Автоматическая очистка (уже настроено)

### 1. Логи контейнеров — ограничены

В `docker-compose.yml` добавлено для `backend` и `postgres-prod`:

```yaml
logging:
  driver: json-file
  options:
    max-size: '10m'   # максимум 10 MB на файл
    max-file: '3'      # хранить 3 файла = 30 MB макс
```

### 2. Dangling-образы — удаляются после деплоя

В `deploy.sh` добавлена команда:

```bash
docker image prune -f -a
```

Она запускается **автоматически** после каждого `./deploy.sh --build`.

---

## Ручная очистка (если нужно срочно)

### Быстрая очистка (безопасно)

```bash
# Только dangling-образы (самое безопасное)
docker image prune -f

# Все неиспользуемые образы + build cache
docker image prune -a -f
docker builder prune -f
```

### Полная очистка (осторожно)

```bash
# Образы, контейнеры, сети, build cache (volume'ы НЕ трогает)
docker system prune -f

# Всё включая volume'ы — УДАЛИТ ДАННЫЕ (фото, БД)
docker system prune -f --volumes
```

### Посмотреть, сколько занимает каждый компонент

```bash
# Общая статистика
docker system df

# Детально по образам
docker system df -v
```

---

## Чистка вручную 1 раз в месяц

```bash
# 1. Зайти на сервер
ssh deploy@<IP-адрес-VPS>

# 2. Перейти в проект
cd ~/photographer-project

# 3. Остановить контейнеры
docker compose --profile prod down

# 4. Полная очистка
docker system prune -f
echo "✅ Docker images cleaned"
docker builder prune -f
echo "✅ Build cache cleaned"

# 5. Обрезать логи старых контейнеров
sudo find /var/lib/docker/containers/ -name "*-json.log" \
  -type f -exec truncate -s 0 {} \; 2>/dev/null || true
echo "✅ Logs truncated"

# 6. Запустить контейнеры
docker compose --profile prod up -d

# 7. Проверить сколько места
docker system df
```

---

## Полезные команды

```bash
# Сколько места на диске всего
df -h /

# Сколько места занимает Docker
docker system df

# Посмотреть список образов
docker images

# Удалить конкретный образ
docker rmi <image-id>

# Удалить контейнер (если не стартует)
docker rm photographer_app
docker compose --profile prod up -d
```

---

## Что НЕ нужно чистить

- **Volume `uploads`** — загруженные фото. Не удаляй.
- **Volume `pgdata-prod`** — база данных. Удалишь — потеряешь всё.
- **Текущий образ `photographer-project_backend`** — используется запущенным контейнером.

Если нужно полностью сбросить проект (с удалением всех данных):

```bash
docker compose --profile prod down -v
```

⚠️ Это удалит и БД, и загруженные фото.