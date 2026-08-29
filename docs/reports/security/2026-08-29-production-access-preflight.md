# BaziGB Production Access Preflight

**Date:** 2026-08-29
**Status:** READ-ONLY INSPECTION COMPLETE — access established with a dedicated key; remediation not yet authorized

## Authorized scope

Human Direction approved a read-only production metadata inspection. The preflight was limited to local SSH metadata and one non-interactive authentication attempt with strict host-key checking. No secret value, production file, service, database, or configuration was read or changed.

## Result

- The Mac contains SSH private/public key pairs with restrictive private-key permissions.
- The production IP has historical ED25519, RSA, and ECDSA host identities recorded in local `known_hosts`.
- The remote endpoint presented an ED25519 identity that does not match the recorded host identity.
- Strict host-key checking stopped the connection before authentication. Codex did not enter the server.

The observed remote fingerprint is intentionally not promoted to trusted state by this report. It must be verified independently through the hosting-provider console, a trusted recovery console, or a previously authenticated administrator.

## Required next decision

Do not delete the old `known_hosts` entry and do not run the current deployment script, because that script automatically removes the recorded host identity. First establish whether the server was legitimately rebuilt or replaced and obtain the expected current SSH fingerprint from an independent trusted channel. Only then may a separately approved host-key update occur.

Production secret metadata inspection remains blocked until host identity is verified.

## Credential disclosure after preflight

Human Direction pasted the current root password into chat after the blocked connection. The value is intentionally not repeated or stored in repository artifacts. It must now be treated as compromised and reset through the trusted hosting-provider console before any SSH retry. The replacement value must be entered directly into KeePassXC by Human Direction and must not be sent through chat.

## Independent host verification and key-authentication result

Human Direction obtained the ED25519 fingerprint from the trusted hosting-provider console. It exactly matched the key presented by the remote endpoint. Codex then:

- created a local backup of `known_hosts`;
- replaced only the historical records for the production IP with the independently verified ED25519 key;
- preserved strict host-key checking;
- attempted non-interactive SSH key authentication without using a root password.

The server rejected both previously available local SSH identities. Authentication stopped before login, so no production command, file read, or mutation occurred at that point.

## Approved dedicated-key access and metadata inspection

Human Direction approved creation of a dedicated ED25519 key on the FileVault-protected Mac and manually installed only its public half on the production server. The private key remains outside the repository at `~/.ssh/bazigb_production_ed25519` with mode `600`. Strict host-key checking remained enabled.

The subsequent inspection used explicitly bounded, read-only SSH commands. No password was transmitted through chat or command arguments, no secret value was printed, and no production file, service, database, or configuration was changed.

Observed production metadata:

- `bazigb-server.service` and `bazigb-web.service` are loaded and running.
- Their working directories are `/opt/bazigb/apps/server` and `/opt/bazigb/apps/web`.
- Neither unit declares `User=` or `Group=`; systemd therefore runs them with its default system-level identity, which is root for system units.
- Neither unit declares `EnvironmentFile=`. The application-level environment file discovered by name is `/opt/bazigb/.env`.
- Only environment key names were inspected: `NODE_ENV`, `PORT`, `DB_TYPE`, `DATABASE_URL`, `POSTGRES_PASSWORD`, `JWT_SECRET`, `SMSIR_API_KEY`, and `SMSIR_TEMPLATE_ID`. Values were not read or recorded.
- `/opt/bazigb/.env` is owned by numeric user `501`, group `staff`, and has mode `0644`.
- `/opt/bazigb/apps/server/prisma/dev.db` is owned by numeric user `501`, group `staff`, and has mode `0644`.

## Validated risks and next gate

1. Both application services currently execute with root authority instead of a dedicated least-privileged runtime identity.
2. The environment file and SQLite database are readable by every local server user because they have mode `0644`.
3. Ownership by numeric user `501` and group `staff` is inconsistent with a deliberate Linux production service identity and should be normalized during the release hardening change.
4. The dedicated key currently authorizes root access. It is an interim inspection path, not the target deployment architecture.

The next step requires separate approval because it mutates production: create dedicated deployment/runtime identities, install a least-privileged key, restrict file ownership and modes, update the systemd units, restart through a controlled release gate, verify health, and only then revoke the interim root key.

## Least-privileged access checkpoint

After explicit approval, the production host was changed only far enough to establish and verify a fallback-safe access checkpoint:

- a passwordless-login-disabled system account named `bazigb-deploy` was created with its own home and primary group;
- the dedicated public key was installed with directory mode `0700` and `authorized_keys` mode `0600`;
- non-interactive key authentication succeeded as UID/GID `1000` with no supplementary groups and no administrative privilege;
- the temporary transferred public-key file was removed;
- the interim root authorization was intentionally retained because the current release script still assumes root authority and no bounded deployment privilege has yet been installed.

Inspection of the local release script identified a hard stop before root-key revocation: it defaults to root SSH, automatically removes the recorded host key, uses destructive synchronization against the active directory, installs dependencies in place, restarts services directly, and tolerates a failed API health check. These behaviours violate the approved release contract. Root-key revocation must wait until the versioned, atomic, fail-closed deployment path is implemented and successfully rehearsed.

## Local release-path remediation checkpoint

The unsafe local release path has now been replaced in the working tree, without deploying or changing the active production services:

- `scripts/deploy.sh` requires an exact approved Git revision, rejects a dirty working tree, preserves strict SSH host trust, defaults to `bazigb-deploy`, and uploads only into a new versioned candidate directory;
- `scripts/bazigb-release` validates candidate identity and lockfile integrity, creates an online SQLite checkpoint with integrity validation, performs an atomic current-link switch, requires both API and web health checks, and restores the previous release on activation failure;
- `scripts/prepare-release-host.sh` defines separate deploy/runtime identities, protected shared secret/data locations, constrained sudo authority, and hardened Systemd units staged as `.service.next` so preparation cannot activate them accidentally;
- `scripts/release-safety.test.mjs` supplies fail-closed and candidate-integrity regression coverage.

Validation completed locally: seven release-safety tests pass, all three shell files pass syntax validation, and the scoped diff passes whitespace validation. The exercise did not contact or mutate production.

The next production gate remains explicit: back up the active host, transfer and inspect the controller, run host preparation, upload and verify a real committed candidate, review staged units, approve cutover, verify health and rollback, and only then remove the interim root authorization. The current dirty working tree cannot be a candidate and no production deployment is authorized by this checkpoint.

## Production npm connectivity finding

During isolated candidate preparation, direct HTTPS access from the Iran-hosted Production VPS to `registry.npmjs.org` timed out. The candidate-only `npm ci` process remained blocked on network I/O and was terminated with `SIGTERM`; it never reached verification or activation, and the active services remained unchanged.

Human Direction selected Liara's documented Iranian npm mirror. The endpoint `https://package-mirror.liara.ir/repository/npm/` returned HTTP 200 from the Production VPS. The release script now passes that HTTPS registry explicitly for the candidate install, while retaining the lockfile, npm package integrity verification and fail-closed behaviour. No global npm configuration was changed on the host. The operational reason is recorded as restricted or unreliable access from Iranian servers to the public npm registry.
