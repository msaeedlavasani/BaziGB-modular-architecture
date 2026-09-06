#!/usr/bin/env bash
set -euo pipefail

[[ "$(node --version)" == 'v24.20.0' ]] || { echo 'Release smoke requires Node v24.20.0.' >&2; exit 1; }

probe() {
  label="$1" url="$2" deadline=$((SECONDS + 30))
  while (( SECONDS <= deadline )); do
    status="$(curl --silent --output /dev/null --write-out '%{http_code}' --connect-timeout 2 --max-time 5 "${url}" || true)"
    if [[ "${status}" =~ ^[23][0-9][0-9]$ ]]; then
      printf 'artifact_health_ok endpoint=%s status=%s\n' "${label}" "${status}"
      return 0
    fi
    sleep 2
  done
  printf 'artifact_health_fail endpoint=%s status=%s\n' "${label}" "${status:-none}" >&2
  return 1
}

# Reproduce the deploy order: locked install with scripts disabled, explicit
# Prisma generation, build, then a production-only dependency tree.
npm ci --ignore-scripts
npm run prisma:generate -w @bazigb/server
npm run build:packages
npm run build:web
npm run build:server

tmp_root="$(mktemp -d)"
server_pid=''
web_pid=''
cleanup() {
  [[ -z "${web_pid}" ]] || kill "${web_pid}" 2>/dev/null || true
  [[ -z "${server_pid}" ]] || kill "${server_pid}" 2>/dev/null || true
  [[ ! -L apps/server/prisma/dev.db ]] || rm apps/server/prisma/dev.db
  rm -rf "${tmp_root}"
}
trap cleanup EXIT

[[ ! -e apps/server/prisma/dev.db && ! -L apps/server/prisma/dev.db ]] || {
  echo 'Release smoke refuses to replace an existing database.' >&2
  exit 1
}
ln -s "${tmp_root}/smoke.db" apps/server/prisma/dev.db
node_modules/.bin/prisma db push --schema apps/server/prisma/schema.prisma --skip-generate
npm prune --omit=dev --ignore-scripts

NODE_ENV=production JWT_SECRET=ci-artifact-smoke-only PORT=3101 \
  node apps/server/dist/main.js >"${tmp_root}/server.out" 2>&1 &
server_pid=$!
PORT=3100 HOSTNAME=127.0.0.1 node apps/web/.next/standalone/apps/web/server.js >"${tmp_root}/web.out" 2>&1 &
web_pid=$!

probe api http://127.0.0.1:3101/api/rooms
probe web http://127.0.0.1:3100/fa/lobby
