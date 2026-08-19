#!/usr/bin/env bash
# ============================================================
# BaziGB — دیپلوی Zero Build
# بیلد محلی → انتقال آرتیفکت به سرور (بدون بیلد روی VPS)
# جلوگیری از OOM و محدودیت منابع سرور
# ============================================================
set -euo pipefail

PROD_HOST="${PROD_HOST:-root@193.151.153.204}"
PROD_PATH="${PROD_PATH:-/opt/bazigb}"

echo "▶ [1/4] بیلد محلی همه پکیج‌ها..."
npm run build

echo "▶ [2/4] انتقال با rsync (زمان‌بندی بالا)..."
rsync -az --delete --timeout=600 \
  --exclude={.git,node_modules,data,dev.db,.env,.DS_Store,*.log} \
  ./ "${PROD_HOST}:${PROD_PATH}/"

echo "▶ [3/4] بررسی آرتیفکت‌ها روی سرور..."
ssh "${PROD_HOST}" "ls -la ${PROD_PATH}/apps/server/dist/main.js && ls -la ${PROD_PATH}/apps/web/.next/BUILD_ID 2>/dev/null || ls -la ${PROD_PATH}/apps/web/.next"

echo "▶ [4/4] ری‌استارت سرویس‌ها روی سرور (در صورت نیاز)..."
ssh "${PROD_HOST}" "cd ${PROD_PATH} && (docker compose down || true) && (docker compose up -d || true)"

echo "✅ دیپلوی Zero Build کامل شد."
echo "   پس از اتمام، Hard Refresh (Ctrl+F5) را به کاربر یادآوری کنید."
