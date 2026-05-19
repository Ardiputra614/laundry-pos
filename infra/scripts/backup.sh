#!/bin/bash
set -euo pipefail

# Database backup script for Laundry POS
# Usage: ./backup.sh [output-dir]

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-root}"
DB_NAME="${DB_NAME:-laundry_pos}"
S3_BUCKET="${S3_BUCKET:-laundry-pos-backups}"

mkdir -p "$BACKUP_DIR"

echo "=== Database Backup: $DB_NAME ==="

# Dump database
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"
mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
  --single-transaction --routines --triggers --events \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "Backup saved: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +30 -delete

echo "=== Backup Complete ==="
