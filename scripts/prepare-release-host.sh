#!/usr/bin/env bash
# One-time, explicitly approved preparation for the versioned release path.
# Running this script changes production and is never part of deploy.sh.
set -euo pipefail

[[ "$(id -u)" -eq 0 ]] || { echo 'Run as root.' >&2; exit 1; }

ROOT="${BAZIGB_RELEASE_ROOT:-/srv/bazigb}"
LEGACY_ROOT="${BAZIGB_LEGACY_ROOT:-/opt/bazigb}"
CONTROLLER_SOURCE="${1:-scripts/bazigb-release}"
SQLITE_BACKUP_SOURCE="${2:-scripts/sqlite-backup.py}"
NODE_ARCHIVE_SOURCE="${3:-}"
DEPLOY_USER="bazigb-deploy"
RUNTIME_USER="bazigb-runtime"
APP_GROUP="bazigb-app"
NODE_VERSION="24.20.0"
NODE_ARCHIVE="node-v${NODE_VERSION}-linux-x64.tar.xz"
NODE_SHA256="2f2c0da162318f0de47665410c7c8c2ed3d36c8f3105de4bbc61176c70a7cbf2"
NODE_ROOT="/opt/bazigb-runtime"
NODE_TARGET="${NODE_ROOT}/node-v${NODE_VERSION}-linux-x64"
NODE_CURRENT="${NODE_ROOT}/current"

[[ -f "${CONTROLLER_SOURCE}" ]] || { echo 'Release controller source is missing.' >&2; exit 1; }
[[ -f "${SQLITE_BACKUP_SOURCE}" ]] || { echo 'SQLite backup helper source is missing.' >&2; exit 1; }
[[ -f "${NODE_ARCHIVE_SOURCE}" ]] || { echo 'Approved Node.js runtime archive is missing.' >&2; exit 1; }
[[ "$(basename "${NODE_ARCHIVE_SOURCE}")" == "${NODE_ARCHIVE}" ]] || { echo 'Unexpected Node.js archive name.' >&2; exit 1; }
[[ "$(sha256sum "${NODE_ARCHIVE_SOURCE}" | awk '{print $1}')" == "${NODE_SHA256}" ]] || { echo 'Node.js archive checksum mismatch.' >&2; exit 1; }
[[ -f "${LEGACY_ROOT}/.env" ]] || { echo 'Legacy environment file is missing.' >&2; exit 1; }
[[ -f "${LEGACY_ROOT}/apps/server/prisma/dev.db" ]] || { echo 'Legacy SQLite database is missing.' >&2; exit 1; }
command -v visudo >/dev/null 2>&1 || { echo 'visudo is required.' >&2; exit 1; }

getent group "${APP_GROUP}" >/dev/null || groupadd --system "${APP_GROUP}"
getent group "${RUNTIME_USER}" >/dev/null || groupadd --system "${RUNTIME_USER}"
id "${DEPLOY_USER}" >/dev/null 2>&1 || useradd --create-home --shell /bin/bash --user-group "${DEPLOY_USER}"
id "${RUNTIME_USER}" >/dev/null 2>&1 || useradd --system --home-dir /nonexistent --shell /usr/sbin/nologin --gid "${RUNTIME_USER}" "${RUNTIME_USER}"
usermod -a -G "${APP_GROUP}" "${DEPLOY_USER}"
usermod -a -G "${APP_GROUP}" "${RUNTIME_USER}"

install -d -m 0750 -o root -g "${APP_GROUP}" "${ROOT}"
install -d -m 2770 -o "${DEPLOY_USER}" -g "${APP_GROUP}" "${ROOT}/releases"
install -d -m 0750 -o root -g "${RUNTIME_USER}" "${ROOT}/shared"
install -d -m 0750 -o "${RUNTIME_USER}" -g "${RUNTIME_USER}" "${ROOT}/shared/data"
install -d -m 0700 -o root -g root "${ROOT}/shared/backups"

install -d -m 0755 -o root -g root "${NODE_ROOT}"
if [[ ! -d "${NODE_TARGET}" ]]; then
  tar -xJf "${NODE_ARCHIVE_SOURCE}" -C "${NODE_ROOT}"
  chown -R root:root "${NODE_TARGET}"
fi
[[ "$("${NODE_TARGET}/bin/node" --version)" == "v${NODE_VERSION}" ]] || { echo 'Versioned Node.js runtime verification failed.' >&2; exit 1; }
ln -sfn "${NODE_TARGET}" "${NODE_ROOT}/.current-${NODE_VERSION}"
mv -Tf "${NODE_ROOT}/.current-${NODE_VERSION}" "${NODE_CURRENT}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
checkpoint="${ROOT}/shared/backups/pre-cutover-${timestamp}"
install -d -m 0700 -o root -g root "${checkpoint}"
cp -a /etc/systemd/system/bazigb-server.service "${checkpoint}/"
cp -a /etc/systemd/system/bazigb-web.service "${checkpoint}/"
if [[ -f /etc/caddy/Caddyfile ]]; then
  cp -a /etc/caddy/Caddyfile "${checkpoint}/Caddyfile"
fi

install -m 0755 -o root -g root "${SQLITE_BACKUP_SOURCE}" /usr/local/sbin/bazigb-sqlite-backup
/usr/local/sbin/bazigb-sqlite-backup "${LEGACY_ROOT}/apps/server/prisma/dev.db" "${checkpoint}/dev.db"
sha256sum "${checkpoint}/dev.db" >"${checkpoint}/SHA256SUMS"
if [[ ! -f "${ROOT}/shared/.env" ]]; then
  install -m 0640 -o root -g "${RUNTIME_USER}" "${LEGACY_ROOT}/.env" "${ROOT}/shared/.env"
fi
if [[ ! -f "${ROOT}/shared/data/dev.db" ]]; then
  /usr/local/sbin/bazigb-sqlite-backup "${LEGACY_ROOT}/apps/server/prisma/dev.db" "${ROOT}/shared/data/dev.db"
fi
chown "${RUNTIME_USER}:${RUNTIME_USER}" "${ROOT}/shared/data/dev.db"
chmod 0660 "${ROOT}/shared/data/dev.db"
chmod 0600 "${LEGACY_ROOT}/.env" "${LEGACY_ROOT}/apps/server/prisma/dev.db"

install -m 0755 -o root -g root "${CONTROLLER_SOURCE}" /usr/local/sbin/bazigb-release
cat >/etc/sudoers.d/bazigb-release <<'SUDOERS'
Cmnd_Alias BAZIGB_RELEASE = /usr/local/sbin/bazigb-release prepare *, /usr/local/sbin/bazigb-release verify *, /usr/local/sbin/bazigb-release canary *, /usr/local/sbin/bazigb-release preflight *, /usr/local/sbin/bazigb-release activate *
bazigb-deploy ALL=(root) NOPASSWD: BAZIGB_RELEASE
SUDOERS
chmod 0440 /etc/sudoers.d/bazigb-release
visudo -cf /etc/sudoers.d/bazigb-release >/dev/null

cat >/etc/systemd/system/bazigb-server.service.next <<'UNIT'
[Unit]
Description=BaziGB NestJS Server
After=network.target

[Service]
Type=simple
User=bazigb-runtime
Group=bazigb-app
SupplementaryGroups=bazigb-runtime
WorkingDirectory=/srv/bazigb/current/apps/server
EnvironmentFile=/srv/bazigb/shared/.env
Environment=NODE_ENV=production
Environment=PATH=/opt/bazigb-runtime/current/bin:/usr/bin:/bin
ExecStart=/opt/bazigb-runtime/current/bin/node dist/main.js
Restart=always
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/srv/bazigb/shared/data

[Install]
WantedBy=multi-user.target
UNIT

cat >/etc/systemd/system/bazigb-web.service.next <<'UNIT'
[Unit]
Description=BaziGB Next.js Web
After=network.target

[Service]
Type=simple
User=bazigb-runtime
Group=bazigb-app
WorkingDirectory=/srv/bazigb/current/apps/web
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/opt/bazigb-runtime/current/bin/node .next/standalone/apps/web/server.js
Restart=always
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict

[Install]
WantedBy=multi-user.target
UNIT

echo 'Host preparation completed. Units are staged as *.service.next and are not active.'
echo 'Do not replace active units until a candidate has passed verify and cutover is explicitly approved.'
