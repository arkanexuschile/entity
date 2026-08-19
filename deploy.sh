#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/entity"
BACKUP_DIR="/var/backups/entity"
NODE_VERSION="22"

echo "=== Entity Deploy ==="

cd "$APP_DIR"

echo "[1/6] Pulling main..."
git pull origin main

echo "[2/6] Installing dependencies..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use $NODE_VERSION
npm ci --omit=dev

echo "[3/6] Building..."
npm run build

echo "[4/6] Running migrations..."
npm run db:migrate

echo "[5/6] Creating backup..."
mkdir -p "$BACKUP_DIR"
cp data/entity.db "$BACKUP_DIR/entity-$(date +%Y%m%d-%H%M%S).db"

echo "[6/6] Restarting service..."
sudo systemctl restart entity

echo "=== Deploy complete ==="
