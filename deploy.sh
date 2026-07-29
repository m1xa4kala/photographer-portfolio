#!/usr/bin/env bash
#
# deploy.sh — Quick production deploy script
# Usage: ./deploy.sh [options]
#
# Options:
#   --build    Force rebuild Docker images (slow, but picks up code changes)
#   --migrate  Run database migrations after deploy
#   --clean    Remove database volume (DESTROYS DATA) and re-seed admin
#   --help     Show this help
#
# Examples:
#   ./deploy.sh                          # Quick restart only
#   ./deploy.sh --build                  # Rebuild + restart
#   ./deploy.sh --build --migrate        # Rebuild + restart + run migrations
#   ./deploy.sh --build --clean          # Rebuild + restart with fresh DB

set -euo pipefail

cd "$(dirname "$0")"

echo "🚀 Deploy: photographer-project"

# Parse arguments
BUILD=false
MIGRATE=false
CLEAN=false

for arg in "$@"; do
  case "$arg" in
    --build)   BUILD=true   ;;
    --migrate) MIGRATE=true ;;
    --clean)   CLEAN=true   ;;
    --help)
      sed -n '5,15p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: ./deploy.sh [--build] [--migrate] [--clean]"
      exit 1
      ;;
  esac
done

# Clean database volume (DESTRUCTIVE)
if [ "$CLEAN" = true ]; then
  echo "⚠️  WARNING: Removing database volume — ALL DATA WILL BE LOST!"
  read -rp "Are you sure? (yes/NO): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted"
    exit 1
  fi
  echo "🗑️  Removing database volume..."
  docker compose --profile prod down -v
fi

# Stop containers
echo "🛑 Stopping containers..."
docker compose --profile prod down || true

# Rebuild image
if [ "$BUILD" = true ]; then
  echo "🏗️  Building backend image..."
  docker compose --profile prod build backend
fi

# Start containers
echo "▶️  Starting containers..."
docker compose --profile prod up -d

# Wait for backend to be ready
echo "⏳ Waiting for backend..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend ready!"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "⚠️  Backend did not respond within 30s. Check logs: docker logs photographer_app"
  fi
  sleep 1
done

# Run migrations
if [ "$MIGRATE" = true ]; then
  echo "🗄️  Running migrations..."
  docker exec -w /app/backend photographer_app node -e "
    const { DataSource } = require('typeorm');
    new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: ['dist/src/**/*.entity.js'],
      migrations: ['dist/src/migrations/*.js'],
      synchronize: false,
    }).initialize()
      .then(ds => ds.runMigrations())
      .then(() => { console.log('✅ Migrations done!'); process.exit(0); })
      .catch(e => { console.error('❌ Migration failed:', e.message); process.exit(1); });
  " || echo "⚠️  Migration command failed (non-fatal)"
fi

# Cleanup — remove dangling images and old build cache
echo "🧹 Cleaning up old Docker images..."
docker image prune -f -a
echo "✅ Done! Container status:"
docker compose --profile prod ps