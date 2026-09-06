# BaziGB Release and Secrets Contract

**Version:** 1.0.0
**Status:** Human-approved design; implementation and production execution not authorized
**Applies to:** Private Alpha and every later release

## Purpose

This contract makes a release predictable, reversible, observable, and explicit about authority. It also prevents credentials from becoming ambient project data. The product we ship is not only a playable site; it is a controlled experience in which users and operators can understand what is happening and recover safely when something fails.

## Current evidence and decision

Observed in the repository:

- the active Prisma schema is SQLite;
- the current deployment script targets a Systemd host and synchronizes directly into the live directory;
- the checked-in Docker path assumes PostgreSQL and contains predictable fallback credentials;
- the Caddy configuration names Docker services, while the active deployment path expects local Systemd services;
- the current deployment script connects as `root`, deletes the recorded SSH host key, uses `rsync --delete` against the live path, and tolerates failed health checks;
- the security audit has not validated a real database restore.

Decision for Private Alpha:

- Systemd plus SQLite is the one canonical production architecture.
- Docker Compose is not a production path until separately redesigned and approved.
- PostgreSQL migration is a post-Alpha project and must never share a release window with feature delivery.
- Same-origin browser access remains the default; the server must use an explicit origin allowlist.

This decision reduces simultaneous variables. It does not claim that the current release or secret handling is already safe.

## Release invariants

Every release must satisfy all of these conditions:

1. A release candidate is identified by an immutable Git revision and a generated manifest.
2. The same built artifact that passes validation is the artifact promoted to production.
3. Application files are deployed to a versioned release directory, never synchronized destructively into the active directory.
4. Activation is an atomic pointer switch; rollback is a pointer switch to the last verified release.
5. Persistent data, secrets, uploads, logs, and backups live outside release directories.
6. Database migrations are committed, reviewed, backed up, and applied once through the release gate. Production must not use interactive schema mutation or `db push`.
7. A failed mandatory check stops the release. Health checks must not use success-forcing fallbacks.
8. No release script may delete or replace an SSH host identity automatically.
9. Deployment, database mutation, secret rotation, and rollback are separately visible authorities. Approval for one does not imply approval for another.
10. Production verification is part of the release; a successful file transfer is not a successful release.

## Release state machine

`IMPLEMENTED → MACHINE VALIDATED → HUMAN ACCEPTED → COMMITTED → PUSHED → BACKED UP → STAGED → DEPLOY APPROVED → DEPLOYED → PRODUCTION VERIFIED → OBSERVED`

Rules:

- a state may advance only when its evidence is recorded;
- `DEPLOY APPROVED` always requires a fresh human approval naming the candidate and environment;
- database or secret changes require an additional explicit approval;
- any failed mandatory gate returns the candidate to the responsible earlier state;
- rollback does not erase evidence: the failed release remains recorded with cause and response.

## Candidate manifest

The candidate record must contain:

- Git revision and branch;
- dirty or clean working-tree status;
- artifact checksum;
- application and schema versions;
- included migrations;
- environment name and public origins;
- required secret names, never their values;
- machine checks and human checks with PASS, FAIL, NOT RUN, or BLOCKED;
- database backup identifier and integrity result;
- previous verified release identifier;
- deploy approver, timestamp, verification result, and rollback decision.

A dirty working tree cannot become a release candidate. It may be tested locally but must first be committed and remotely protected through separate approvals.

## Environment contract

| Property | Local | Staging | Production |
| --- | --- | --- | --- |
| Purpose | development | release rehearsal | user traffic |
| Data | synthetic or explicitly approved | non-production | production |
| Secrets | local development only | staging-only | production-only |
| Public origin | localhost or LAN test origin | fixed staging origin | fixed production origin |
| Database | local SQLite | isolated SQLite snapshot or approved fixture | protected SQLite |
| External SMS | stub by default | controlled test credential | production credential |

Secrets, databases, tokens, and user data must never be copied between environments merely for convenience.

## Database and migration contract

For Private Alpha, the production database is SQLite. Before a release that can affect persistence:

- pause or safely drain writes;
- create a consistent snapshot of the database and required sidecar files;
- run SQLite integrity validation on the snapshot;
- record the application revision and schema version paired with it;
- rehearse the migration against a copy before production;
- apply committed migrations with a non-interactive production command;
- verify reads, writes, critical counts, and schema version after activation.

A file copy alone is not restore proof. A release cannot be called recoverable until an approved restore drill opens the restored database and validates the critical application path.

PostgreSQL migration is explicitly deferred. Its future project requires its own data mapping, rehearsal, dual-version compatibility plan, cutover, verification, and rollback. It must not be combined with unrelated feature delivery.

## Secrets inventory contract

The inventory stores metadata only:

| Secret class | Current consumer | Required handling |
| --- | --- | --- |
| JWT signing secret | server authentication | production-only, high entropy, rotatable, never logged |
| SMS provider key | server OTP delivery | production-only, least privilege, provider revocation tested |
| SMS template identifier | server OTP delivery | configuration; classify as non-secret only after verification |
| SSH deployment key | release operator | non-root deploy identity, scoped host access, passphrase or agent protection |
| Runtime environment file or credential | Systemd services | root-readable only, outside release directory |
| TLS/account recovery material | host or provider | provider-controlled where possible; recovery path documented |

For every item, record owner, purpose, consumer, environments, storage location category, creation date, last rotation, next review, revocation method, and recovery dependency. Never record the value in Git, documentation, issue trackers, chat, logs, screenshots, shell history, candidate manifests, or unencrypted backups.

## Secret storage and recovery

For the current small team:

- the selected human source of truth is the local encrypted KeePassXC database `BaziGB-Credentials-v2.kdbx`;
- production services should receive secrets through root-owned runtime configuration or a later approved secrets manager;
- CI/CD, if introduced, receives only environment-scoped secrets and never a shared master credential;
- predictable fallback values are forbidden; missing production secrets must fail startup;
- secrets should be passed without exposing values in command arguments or logs.

Credential backup means an encrypted KeePassXC database on the human-approved MacBook plus a checksum-verified encrypted copy on the approved external drive. It must include recovery instructions and metadata, not a plaintext `.env`. A recovery check proves authorized access without revealing the values. Inspecting actual values, transferring them, or rotating them requires separate approval. The operational details are maintained in `docs/credentials-recovery-runbook.md`; the value-free inventory is `ops/secrets-inventory.json`.

Laptop-only storage is accepted temporarily because the user selected it, but it is a single-device risk. Off-device encrypted recovery and Time Machine remain later resilience work.

## Deployment identity and network boundaries

- replace root SSH deployment with a dedicated deploy user and the minimum required service/release permissions;
- pin the server host key and stop on a mismatch;
- never run `ssh-keygen -R` as part of deployment;
- do not expose the database publicly;
- bind application services to the intended local interface behind the reverse proxy;
- allow CORS only for explicit approved origins and only when cross-origin access is actually required;
- keep browser API and Socket.IO access same-origin where possible.

## Backup set

Before the first approved deployment under this contract, create and verify:

1. Current production checkpoint: active revision, runtime configuration metadata, service definitions, reverse-proxy configuration, database snapshot, and artifact checksum.
2. Local checkpoint: approved Git revision or Git bundle plus an inventory of intentional uncommitted work. Uncommitted work is not a durable release backup.
3. Credential recovery: encrypted recovery mechanism and inventory metadata, without plaintext secret values.

Each backup needs a timestamp, checksum, owner, storage location, retention rule, restore procedure, and result of its latest retrieval or restore test. Backup deletion or pruning must be explicit and recoverable where practical.

## Staging and deployment gates

### Production npm registry dependency

The Production VPS is hosted in Iran. Direct access from that host to the public npm registry has been observed to time out because of external-service and network limitations affecting Iranian servers. Production release installation therefore uses Liara's documented Iranian npm mirror by default:

`https://package-mirror.liara.ir/repository/npm/`

This is an explicit release dependency, not an untracked global server preference. The release command passes the registry URL for that invocation only. `package-lock.json`, npm integrity metadata, the approved Git revision, and the candidate checksum remain mandatory. The registry must use HTTPS, receives no project credential, and a mirror error fails the release closed; scripts must not silently switch registries. Operators may override the endpoint only through the visible `BAZIGB_NPM_REGISTRY` release input and must record the reason in release evidence.

Reference: Liara's official npm mirror documentation at `https://liara.ir/mirrors/npm/`.

The minimum ordered flow is:

1. Freeze the candidate and generate its manifest.
2. Run targeted tests, security contract tests, full required suite, type checks, boundaries, governance, and production build.
3. Obtain human experiential acceptance for the advertised Alpha critical paths.
4. Create the production and local checkpoints.
5. Rehearse the exact artifact, configuration shape, migration, health checks, and rollback in staging.
6. Review known findings and decide GO or NO-GO. Unresolved release blockers cannot be silently accepted.
7. Ask for explicit production deploy approval.
8. Deploy to a new versioned directory, install from the lockfile, migrate once, and atomically activate.
9. Verify API, web, authentication, room creation/join/reconnect, one critical path per advertised game, logs, database reads/writes, and external SMS when applicable.
10. Observe a defined window. Roll back on trigger; do not patch production ad hoc.

The first Systemd cutover is a distinct transaction because no previous versioned
`current` pointer exists. Before replacing active unit definitions, the controller
must checkpoint the legacy units. A failed restart or mandatory health check must
restore those unit files, reload Systemd, restart the legacy services, verify their
health, and remove the failed candidate from `current`. Later releases use the
normal versioned-pointer rollback path. Remote npm execution must prepend the
pinned runtime directory to `PATH` so npm lifecycle subprocesses use the same
approved Node.js version as the production services.

Production dependency installation must explicitly generate the Prisma client
after the locked install. Package-manager install-script policy is not accepted
as implicit generation evidence: candidate verification must reject the
uninitialized Prisma stub, and a runtime-equivalent server probe must reach the
API before activation approval.

Human browser and mobile experience tests remain assigned to the user. Machine health and contract checks remain part of the release system.

## No-go and rollback triggers

A release is NO-GO or must roll back when any of these occurs:

- candidate identity or checksum mismatch;
- missing required secret or unexpected fallback secret;
- SSH host-key mismatch;
- missing or invalid database checkpoint;
- migration failure or schema mismatch;
- mandatory test, health check, login, room, or critical-game-path failure;
- unexplained elevated server errors, authentication failures, data corruption, or reconnect failures;
- monitoring is unavailable for a change that depends on it;
- the previous verified release cannot be identified.

Rollback restores the previous application release first when the database remains compatible. If data restoration is required, stop writes and obtain explicit destructive-recovery approval before restoring. Never improvise a downgrade across an incompatible migration.

## Incident and communication behavior

The operator records what users may experience, which release is active, whether data may be affected, the decision owner, and the next update time. User-facing disruptions should be explained plainly. Internal errors must never expose secrets or raw credentials.

## Deferred product decisions recorded with this contract

- voice is limited to private rooms; public and ranked voice stays disabled until moderation exists;
- spectators cannot chat or speak; they may express only bounded contextual reactions such as encouragement, excitement, surprise, and great move;
- AI Arena is deferred;
- PostgreSQL migration is post-Alpha and isolated from normal releases.

These are release-scope constraints, not implemented-feature claims.

## Authority matrix

| Action | Design approval | Execution approval | Evidence required |
| --- | --- | --- | --- |
| Edit this contract | Human Direction | approved task scope | governance validation |
| Inspect secret metadata | Human Direction | separate approval | redacted inventory |
| Read actual secret values | Human Direction | separate critical approval | named purpose and access log |
| Create encrypted credential backup | Human Direction | separate approval | recovery check |
| Create production database backup | Human Direction | separate approval | checksum and integrity check |
| Restore production data | Human Direction | explicit destructive-recovery approval | restore plan and rollback consequence |
| Rotate a secret | Human Direction | per-secret approval | consumer update and revocation proof |
| Deploy candidate | Human Direction | per-candidate approval | complete manifest and GO decision |

## Acceptance of this contract

The contract is machine-valid when governance, JSON parsing, link/path review, and diff checks pass. It becomes accepted only after Human Direction reviews the selected architecture, authority boundaries, backup model, and deferred PostgreSQL decision. Acceptance authorizes the contract, not its implementation or any production action.
