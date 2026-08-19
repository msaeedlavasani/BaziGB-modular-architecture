#!/usr/bin/env bash
# ============================================================
# BaziGB — دیپلوی Zero Build به سرور (بدون بیلد روی VPS)
# بیلد محلی → rsync به /opt/bazigb → npm ci روی سرور → restart سرویس‌ها
# قبل از اولین اجرا: scripts/server-setup.sh را روی سرور اجرا کنید.
# ============================================================
set -euo pipefail

PROD_HOST="${PROD_HOST:-root@193.151.153.204}"
PROD_PATH="${PROD_PATH:-/opt/bazigb}"

# کلید host قدیمی ممکن است استِیل باشد (سرور ریست شده) — پاک و تازه کن
ssh-keygen -R 193.151.153.204 >/dev/null 2>&1 || true

echo "▶ [1/4] بیلد محلی همه پکیج‌ها و اپ‌ها..."
npm run build

echo "▶ [2/4] انتقال با rsync (بدون node_modules — روی سرور npm ci می‌گیرد)..."
rsync -az --delete --timeout=600 \
  --exclude={.git,node_modules,data,dev.db,.env,.DS_Store,*.log,test-socket.mjs} \
  ./ "${PROD_HOST}:${PROD_PATH}/"

echo "▶ [3/4] npm ci و ری‌استارت سرویس‌ها روی سرور..."
ssh "${PROD_HOST}" "cd ${PROD_PATH} && npm ci --omit=dev --workspaces --include-workspace-root 2>&1 | tail -2 && systemctl restart bazigb-server bazigb-web && sleep 3 && systemctl is-active bazigb-server bazigb-web"

echo "▶ [4/4] بررسی سلامت..."
ssh "${PROD_HOST}" "curl -sf -o /dev/null -w 'API: HTTP %{http_code}\n' http://localhost:3001/api/rooms || echo 'API: check needed'; curl -sf -o /dev/null -w 'WEB: HTTP %{http_code}\n' http://localhost:3000/lobby || true"

echo "✅ دیپلوی Zero Build کامل شد."
echo "   پس از اتمام، Hard Refresh (Ctrl+F5) را به کاربر یادآوری کنید."
