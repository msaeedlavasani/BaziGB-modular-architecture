#!/usr/bin/env bash
set -euo pipefail

[[ "$(node --version)" == 'v24.20.0' ]] || { echo 'Release smoke requires Node v24.20.0.' >&2; exit 1; }

probe() {
  label="$1" url="$2" deadline=$((SECONDS + 30))
  while (( SECONDS <= deadline )); do
    status="$(curl --silent --location --output /dev/null --write-out '%{http_code}' --connect-timeout 2 --max-time 5 "${url}" || true)"
    if [[ "${status}" == '200' ]]; then
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
DATABASE_URL=file:./dev.db npm run prisma:generate -w @bazigb/server
npm run build:packages
npm run build:web
npm run build:server

tmp_base="${TMPDIR:-/tmp}"
[[ "$(uname -s)" != 'Darwin' ]] || tmp_base='/private/tmp'
tmp_root="$(mktemp -d "${tmp_base}/bazigb-release-smoke.XXXXXX")"
tmp_root_real="$(cd "${tmp_root}" && pwd -P)"
server_pid=''
web_pid=''
cleanup() {
  [[ -z "${web_pid}" ]] || kill "${web_pid}" 2>/dev/null || true
  [[ -z "${server_pid}" ]] || kill "${server_pid}" 2>/dev/null || true
  rm -rf "${tmp_root}"
}
trap cleanup EXIT

install -m 0600 /dev/null "${tmp_root_real}/smoke.db"
npm prune --omit=dev --ignore-scripts

NODE_ENV=production JWT_SECRET=ci-artifact-smoke-only PORT=3101 \
  DATABASE_URL="file:${tmp_root_real}/smoke.db" RELEASE_EXPECTED_DATABASE_PATH="${tmp_root_real}/smoke.db" \
  node apps/server/dist/main.js >"${tmp_root}/server.out" 2>&1 &
server_pid=$!
PORT=3100 HOSTNAME=127.0.0.1 API_PROXY_TARGET=http://127.0.0.1:3101 \
  node apps/web/.next/standalone/apps/web/server.js >"${tmp_root}/web.out" 2>&1 &
web_pid=$!

probe api-database-target http://127.0.0.1:3101/api/release-health
probe web http://127.0.0.1:3100/fa/lobby
probe web-same-origin-api http://127.0.0.1:3100/api/release-health
