#!/usr/bin/env bash
# ============================================================
# BaziGB — راه‌اندازی یک‌باره سرور (runtime) روی VPS تازه
# VPS فعلی خالی است: node/docker/caddy نصب نیستند.
# این اسکریپت روی سرور اجرا می‌شود: Node 20 LTS + Caddy + systemd
# ============================================================
set -euo pipefail

DOMAIN="${BAZIGB_DOMAIN:-}"   # مثلاً bazigb.ir — اگر خالی باشد Caddy فقط HTTP روی پورت 80
APP_DIR="${BAZIGB_APP_DIR:-/opt/bazigb}"

echo "▶ [1/4] نصب Node.js 20 LTS..."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://nodejs.org/dist/v20.18.0/node-v20.18.0-linux-x64.tar.xz -o /tmp/node.tar.xz
  tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1
  rm -f /tmp/node.tar.xz
fi
node -v && npm -v

echo "▶ [2/4] نصب Caddy (ریورس پروکسی)..."
if ! command -v caddy >/dev/null 2>&1; then
  curl -fsSL https://getcaddy.com | bash 2>/dev/null || {
    apt-get update -y >/dev/null 2>&1 || true
    apt-get install -y caddy >/dev/null 2>&1 || echo "caddy از apt نصب نشد — ادامه با nginx-less (فقط سرویس)؟ خیر؛ از باینری استفاده کنید."
  }
fi
command -v caddy && caddy version || echo "⚠ Caddy در دسترس نیست — از پورت مستقیم استفاده می‌شود."

echo "▶ [3/4] وابستگی‌ها (npm ci — بدون بیلد)..."
cd "${APP_DIR}"
npm ci --omit=dev --workspaces --include-workspace-root 2>&1 | tail -3 || npm install --omit=dev 2>&1 | tail -3

echo "▶ [4/4] نصب سرویس‌های systemd + Caddyfile..."
mkdir -p /etc/bazigb /var/log/bazigb

# سرویس سرور NestJS
cat > /etc/systemd/system/bazigb-server.service <<'UNIT'
[Unit]
Description=BaziGB NestJS Server
After=network.target
[Service]
Type=simple
WorkingDirectory=/opt/bazigb/apps/server
Environment=NODE_ENV=production
ExecStart=/usr/local/bin/node dist/main.js
Restart=always
RestartSec=3
[Install]
WantedBy=multi-user.target
UNIT

# سرویس وب Next.js (standalone)
cat > /etc/systemd/system/bazigb-web.service <<'UNIT'
[Unit]
Description=BaziGB Next.js Web
After=network.target
[Service]
Type=simple
WorkingDirectory=/opt/bazigb/apps/web
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/local/bin/node .next/standalone/apps/web/server.js
Restart=always
RestartSec=3
[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now bazigb-server bazigb-web 2>&1 | tail -2

echo "✅ راه‌اندازی سرور کامل شد. وضعیت:"
systemctl --no-pager status bazigb-server --lines=0 | head -3
systemctl --no-pager status bazigb-web --lines=0 | head -3
