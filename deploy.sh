#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/entity"
BACKUP_DIR="/var/backups/entity"
NODE_VERSION="22"
PNPM_VERSION="11.9.0"

echo "=== Entity Deploy ==="

cd "$APP_DIR"

echo "[1/7] Pulling main..."
git pull origin main

echo "[2/7] Installing dependencies..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use $NODE_VERSION
corepack enable
pnpm install --frozen-lockfile

echo "[3/7] Generating Prisma client..."
pnpm --filter @entity/database db:generate

echo "[4/7] Building..."
pnpm build

echo "[5/7] Running migrations..."
pnpm --filter @entity/database db:deploy

echo "[6/7] Creating backup (PostgreSQL)..."
mkdir -p "$BACKUP_DIR"
DATABASE_URL="${DATABASE_URL:-postgresql://entity:entity@localhost:5435/entity}"
pg_dump --no-owner --no-privileges -f "$BACKUP_DIR/entity-$(date +%Y%m%d-%H%M%S).sql" "${DATABASE_URL}"

echo "[7/7] Restarting service..."
sudo systemctl restart entity

echo "=== Deploy complete ==="