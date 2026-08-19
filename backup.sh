#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/entity"
DB_PATH="/var/www/entity/data/entity.db"
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR"

cp "$DB_PATH" "$BACKUP_DIR/entity-$(date +%Y%m%d-%H%M%S).db"

find "$BACKUP_DIR" -name "entity-*.db" -mtime +$KEEP_DAYS -delete

echo "Backup done: $(ls -lh "$BACKUP_DIR"/entity-*.db | tail -1)"
