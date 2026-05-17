#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Создайте .env: cp .env.example .env && nano .env"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

if [ -z "${PUBLIC_URL:-}" ] || [ "$PUBLIC_URL" = "http://YOUR_SERVER_IP" ]; then
  echo "Укажите PUBLIC_URL в .env (IP или домен сайта)"
  exit 1
fi

echo "==> Сборка образов..."
docker compose build

echo "==> Запуск PostgreSQL..."
docker compose up -d db
echo "Ожидание готовности БД..."
for i in $(seq 1 30); do
  if docker compose exec -T db pg_isready -U "${POSTGRES_USER:-proektoria}" -d "${POSTGRES_DB:-proektoria}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "==> Миграции Alembic..."
docker compose run --rm backend alembic upgrade head

echo "==> Запуск всех сервисов..."
docker compose up -d

echo ""
echo "Готово. Откройте: ${PUBLIC_URL}"
echo "Демо: citizen@example.com / password123 (если БД пустая — seed из init_db при старте backend)"
echo "Логи: docker compose logs -f"
