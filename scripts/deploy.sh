#!/usr/bin/env bash
# BaziGB release candidate publisher.
# This script never writes into the active release and never changes SSH trust.
set -euo pipefail

PROD_HOST="${PROD_HOST:-bazigb-deploy@193.151.153.204}"
RELEASE_ROOT="${BAZIGB_RELEASE_ROOT:-/srv/bazigb}"
SSH_KEY="${BAZIGB_SSH_KEY:-${HOME}/.ssh/bazigb_production_ed25519}"
NPM_REGISTRY="${BAZIGB_NPM_REGISTRY:-https://package-mirror.liara.ir/repository/npm/}"
RELEASE_ID="${RELEASE_ID:-}"
CANDIDATE_APPROVED="${CANDIDATE_APPROVED:-}"
ACTIVATE_APPROVED="${ACTIVATE_APPROVED:-}"

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

[[ -n "${RELEASE_ID}" ]] || die 'RELEASE_ID is required and must name the approved Git revision.'
[[ "${RELEASE_ID}" =~ ^[0-9a-f]{7,40}$ ]] || die 'RELEASE_ID must be a 7-40 character lowercase Git revision.'
[[ "${CANDIDATE_APPROVED}" == "${RELEASE_ID}" ]] || die 'CANDIDATE_APPROVED must exactly equal RELEASE_ID.'
[[ -z "${ACTIVATE_APPROVED}" || "${ACTIVATE_APPROVED}" == "${RELEASE_ID}" ]] || die 'ACTIVATE_APPROVED must be empty or exactly equal RELEASE_ID.'
[[ -f "${SSH_KEY}" ]] || die "SSH key not found: ${SSH_KEY}"
[[ "${NPM_REGISTRY}" == https://* ]] || die 'BAZIGB_NPM_REGISTRY must use HTTPS.'

GIT_REVISION="$(git rev-parse HEAD)"
[[ "${GIT_REVISION}" == "${RELEASE_ID}" ]] || die 'RELEASE_ID does not equal the checked-out Git revision.'
[[ -z "$(git status --porcelain)" ]] || die 'The working tree is dirty; an uncommitted candidate cannot be released.'

SSH=(ssh -i "${SSH_KEY}" -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes)
RSYNC_SSH="ssh -i ${SSH_KEY} -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes"
CANDIDATE_PATH="${RELEASE_ROOT}/releases/${RELEASE_ID}"
MANIFEST="$(mktemp)"
trap 'rm -f "${MANIFEST}"' EXIT

LOCK_SHA256="$(shasum -a 256 package-lock.json | awk '{print $1}')"
cat >"${MANIFEST}" <<EOF
release_id=${RELEASE_ID}
git_revision=${GIT_REVISION}
package_lock_sha256=${LOCK_SHA256}
EOF

printf 'Building candidate %s...\n' "${RELEASE_ID}"
npm run build

printf 'Preparing isolated release directory...\n'
"${SSH[@]}" "${PROD_HOST}" sudo /usr/local/sbin/bazigb-release prepare "${RELEASE_ID}"

printf 'Uploading candidate without touching the active release...\n'
rsync -az --delete --timeout=600 \
  -e "${RSYNC_SSH}" \
  --exclude={.git,node_modules,data,dev.db,.env,.DS_Store,*.log,test-socket.mjs} \
  ./ "${PROD_HOST}:${CANDIDATE_PATH}/"
rsync -az -e "${RSYNC_SSH}" "${MANIFEST}" "${PROD_HOST}:${CANDIDATE_PATH}/release.manifest"

printf 'Installing locked production dependencies inside the candidate...\n'
"${SSH[@]}" "${PROD_HOST}" npm ci \
  --prefix "${CANDIDATE_PATH}" \
  --registry "${NPM_REGISTRY}" \
  --fetch-retries 2 --fetch-timeout 120000 \
  --omit=dev --workspaces --include-workspace-root

printf 'Verifying immutable candidate metadata...\n'
"${SSH[@]}" "${PROD_HOST}" sudo /usr/local/sbin/bazigb-release verify "${RELEASE_ID}" "${LOCK_SHA256}"

if [[ -z "${ACTIVATE_APPROVED}" ]]; then
  printf 'Candidate %s is verified and awaiting separate production activation approval.\n' "${RELEASE_ID}"
  exit 0
fi

printf 'Activating with rollback-on-failure...\n'
"${SSH[@]}" "${PROD_HOST}" sudo /usr/local/sbin/bazigb-release activate "${RELEASE_ID}" "${LOCK_SHA256}"

printf 'Release %s is active and healthy.\n' "${RELEASE_ID}"
