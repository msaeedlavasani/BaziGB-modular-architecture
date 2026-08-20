#!/bin/bash

# مسیرهای اصلی
DB_PATH=${1:-/opt/bazigb/apps/server/prisma/dev.db}
BACKUP_DIR=${2:-/opt/bazigb/backups}
RETENTION=7

# ساخت پوشه بکاپ در صورت عدم وجود
mkdir -p "$BACKUP_DIR"

# نام فایل بکاپ با برچسب زمان
TIMESTAMP=$(date +"%Y%m%d-%H%M")
BACKUP_FILE="$BACKUP_DIR/dev-$TIMESTAMP.db"

echo "Starting backup of $DB_PATH to $BACKUP_FILE..."

# کپی دیتابیس
cp "$DB_PATH" "$BACKUP_FILE"

# بررسی موفقیت کپی و خالی نبودن فایل
if [ ! -s "$BACKUP_FILE" ]; then
    echo "Error: Backup file is empty or was not created."
    exit 1
fi

echo "Backup created successfully: $(du -sh "$BACKUP_FILE" | cut -f1)"

# بررسی سلامت دیتابیس اگر sqlite3 نصب باشد
if command -v sqlite3 >/dev/null 2>&1; then
    INTEGRITY=$(sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;")
    if [ "$INTEGRITY" == "ok" ]; then
        echo "Integrity check: OK"
    else
        echo "Integrity check failed: $INTEGRITY"
        exit 1
    fi
else
    echo "sqlite3 not found, skipping integrity check."
fi

# حذف فایل‌های قدیمی‌تر از ۷ روز
echo "Cleaning up backups older than $RETENTION days..."
find "$BACKUP_DIR" -name "dev-*.db" -type f -mtime +$RETENTION -delete

echo "Backup process completed."
