#!/usr/bin/env bash
# ========================================================
# ZABAY REMOTE DATABASE BACKUP & RESTORATION UTILITY
# Role 1: Lead DBA & Cloud Infrastructure Engineer
# ========================================================
# Usage:
#   ./scripts/remote-backup-restore.sh backup [DATABASE_URL]
#   ./scripts/remote-backup-restore.sh restore [DATABASE_URL] [BACKUP_FILE]
# ========================================================

set -euo pipefail

ACTION="${1:-help}"
DB_URL="${2:-${DATABASE_URL:-}}"
BACKUP_DIR="./db/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p "$BACKUP_DIR"

if [ "$ACTION" = "backup" ]; then
    if [ -z "$DB_URL" ]; then
        echo "Error: DATABASE_URL is not set or provided."
        echo "Usage: $0 backup <DATABASE_URL>"
        exit 1
    fi
    BACKUP_FILE="$BACKUP_DIR/zabay_backup_${TIMESTAMP}.dump"
    echo "==> Executing remote PostgreSQL backup from cloud database..."
    pg_dump "$DB_URL" \
        --format=custom \
        --no-owner \
        --no-privileges \
        --verbose \
        --file="$BACKUP_FILE"
    echo "==> Remote backup successfully saved to: $BACKUP_FILE"
    echo "==> File size: $(du -h "$BACKUP_FILE" | cut -f1)"

elif [ "$ACTION" = "restore" ]; then
    RESTORE_FILE="${3:-}"
    if [ -z "$DB_URL" ] || [ -z "$RESTORE_FILE" ]; then
        echo "Error: DATABASE_URL and BACKUP_FILE must both be specified."
        echo "Usage: $0 restore <DATABASE_URL> <BACKUP_FILE>"
        exit 1
    fi
    if [ ! -f "$RESTORE_FILE" ]; then
        echo "Error: Backup file '$RESTORE_FILE' does not exist."
        exit 1
    fi
    echo "==> Restoring cloud PostgreSQL database from: $RESTORE_FILE..."
    pg_restore \
        --dbname="$DB_URL" \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        --verbose \
        "$RESTORE_FILE"
    echo "==> Database successfully restored."

else
    echo "Zabay Remote Database Backup & Restoration Utility (Role 1)"
    echo "---------------------------------------------------------"
    echo "Commands:"
    echo "  $0 backup <DATABASE_URL>                     Dump cloud database to ./db/backups"
    echo "  $0 restore <DATABASE_URL> <PATH_TO_DUMP>     Restore cloud database from dump file"
fi
