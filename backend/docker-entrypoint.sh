#!/bin/bash
set -e

echo "Aguardando o banco de dados ficar pronto..."
until pg_isready -h "${DB_HOST:-db}" -p 5432 -U "${DB_USER:-admin}" -d "${DB_NAME:-ecotrack}" 2>/dev/null; do
  sleep 2
done

echo "Aplicando migrations (yoyo)..."
/app/backend/.venv/bin/yoyo apply \
  --database "postgresql+psycopg://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}" \
  --batch \
  /app/backend/migrations

echo "Iniciando o servidor..."
cd /app
exec /app/backend/.venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000
