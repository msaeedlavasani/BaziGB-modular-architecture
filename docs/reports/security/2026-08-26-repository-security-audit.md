# BaziGB Repository Security Audit

## Record

- Date: 2026-08-26
- Scan ID: `574cc239-9a07-4c8d-b25f-0676ba95d11f`
- Branch: `refactor/platform-foundation-i18n-v3`
- Source revision: `17049d2704f755a1df85190580027001c0bb6856`
- Working-tree snapshot: the scan included uncommitted files; canonical snapshot digest `codex-security-snapshot/v1:sha256:d8701aa488a6470a4a2b6878ec08ee7b5cdbd597762a6f02e527c53ef3f5967d`
- Mode: whole-repository, static, read-only
- Validation: independent architecture review, independent baseline audit, and independent finding validation
- Outcome: 8 reportable findings; 3 high and 5 medium
- Coverage: partial because runtime, network, dependency-advisory, archive, and restore testing were not authorized

No product file was changed, no remediation was applied, and no deployment or external issue creation occurred during this audit.

## Threat model

Protected assets include user identity and roles, phone and OTP data, JWTs, room seats and game state, scores and history, tournament brackets, the database and backups, the SMS credential, and the JWT signing secret.

Primary trust boundaries are the browser to Next proxy boundary, Next and Caddy to Nest REST and Socket.IO, Nest guards and gateways to Prisma, the gateway to game adapters, and the deployment host to its database and backups.

Relevant attacker capabilities include an unauthenticated REST client, an unauthenticated Socket.IO client, a seated player using a crafted client, a former administrator retaining an issued token, and an attacker reaching a conditional Docker deployment.

## Validated findings

### SEC-001 — Tournament lifecycle mutations lack authentication

Severity: High

Affected controls:

- `apps/server/src/tournaments/tournament.controller.ts:18-53`
- `apps/server/src/tournaments/tournament.service.ts:295-339`

An unauthenticated caller can create tournaments, register arbitrary existing users, seed brackets, and select a valid participant as the winner. DTO and state validation constrain input shape but do not prove caller authority.

Required outcome: authenticated lifecycle operations, explicit organizer or administrator authorization, self-registration bound to the authenticated user, and auditable state transitions.

### SEC-002 — Demoted administrators retain JWT privileges

Severity: High

Affected controls:

- `apps/server/src/auth/jwt.guard.ts:13-17`
- `apps/server/src/common/admin.guard.ts:18-25`
- `apps/server/src/auth/auth.service.ts:228-240`

The request guard confirms that the account still exists and is active, but then authorizes the role stored in the previously issued seven-day JWT. A demoted administrator therefore keeps administrative authority until the token expires. Account deactivation is checked correctly; role revocation is not.

Required outcome: authorize with the current database role, or introduce token versioning and revocation with shorter privileged sessions.

### SEC-003 — Conditional Docker deployment uses predictable credentials

Severity: High when that deployment path is used

Affected controls:

- `docker-compose.yml:7-11`
- `docker-compose.yml:25-30`

The checked-in Docker path publishes PostgreSQL and supplies known fallback database and JWT secrets. Current documentation instead indicates a systemd and SQLite production path, so this finding does not assert that the live server is exposed. It proves that the alternative checked-in production path is unsafe by default.

Required outcome: establish one canonical deployment architecture, require secrets with fail-closed configuration, remove public database exposure, and rotate any fallback value that has ever been used.

### SEC-004 — Unrelated sockets can reset active games

Severity: Medium

Affected control:

- `apps/server/src/game/game.gateway.ts:579-606`

The `nextRound` and `newGame` events accept a room code and replace persistent game state without proving that the socket is a player, owner, or even a member of the Socket.IO room. `newGame` also resets scores.

Required outcome: a shared room-action authorization policy enforcing membership, action role, phase, ownership where applicable, and rate limits for every mutating event.

### SEC-005 — Non-players can answer Backgammon doubling offers

Severity: Medium

Affected control:

- `apps/server/src/game/game.gateway.ts:672-692`

The handler only proves that the responder is not the offerer. Any unrelated socket with the room code can accept or reject the offer because it never proves that the caller is the seated opponent.

Required outcome: authorize the exact seated opponent before changing doubling state.

### SEC-006 — Move payload can substitute another player identity

Severity: Medium

Affected controls:

- `apps/server/src/game/game.gateway.ts:521-529`
- `packages/games/backgammon/src/rules.ts:259-312`
- `packages/games/vegas/src/rules.ts:234-304`

The gateway verifies that it is the caller's turn but forwards the client-controlled `move.player`. Some adapter legality comparisons omit player identity while later mutations use that supplied identity. A crafted current-turn client can therefore manipulate another player's state or corrupt the room state.

Required outcome: derive the actor from the authenticated socket boundary, overwrite untrusted actor fields, enforce the same invariant inside every adapter, and add adversarial protocol contract tests.

### SEC-007 — Anonymous clients can create unbounded persistent rooms

Severity: Medium

Affected controls:

- `apps/server/src/rooms/room.controller.ts:38-41`
- `apps/server/src/game/game.gateway.ts:286-313`
- `apps/server/src/rooms/room.service.ts:124-183`

Both REST and Socket.IO paths create durable room rows without authentication, quotas, creation rate limits, bounded socket-provided identifiers, or abandoned-room cleanup. Public room listing is also unpaginated.

Required outcome: bounded guest capabilities or authentication, creation quotas and rate limits, identifier limits, room expiry, and paginated listing.

### SEC-008 — Sockets can inject chat into rooms they never joined

Severity: Medium

Affected control:

- `apps/server/src/game/game.gateway.ts:634-647`

The chat handler emits to any supplied room name without checking room existence, socket membership, an allowed chat role, or a WebSocket rate limit. Message length and displayed identity are server-controlled, which limits identity spoofing but not unauthorized injection or spam.

Required outcome: require valid room membership and chat role, reject nonexistent rooms, and apply the shared WebSocket rate-limit policy.

## Deferred validation

### OTP rate limiting behind the reverse proxy

The rate limiter may see all users as the proxy IP because the effective trusted-proxy configuration was not verified. Confirming the denial-of-service impact requires a controlled runtime check.

Relevant files:

- `apps/server/src/common/rate-limit.guard.ts`
- `apps/server/src/main.ts`

### Backup and restore integrity

The backup script was reviewed statically. Snapshot consistency, off-host retention, recovery time, and actual restore integrity require a separately approved restore drill.

Relevant file:

- `scripts/backup-db.sh`

## Explicit exclusions

- Generated dependencies and build outputs under `node_modules`, `.next`, `dist`, and `coverage`
- Binary archives and screenshots
- Source execution and network testing
- Dependency advisory lookup
- Live production inspection
- Backup restoration

## Task-list implications

These findings belong to the system-level workstreams for Security Architecture, Game Protocol Integrity, Identity and Access Management, Abuse Prevention, Delivery Architecture, Operational Resilience, Evaluation, and Governance. They must not be treated as eight isolated patches. The first implementation scope should establish shared policies, reusable controls, contract tests, and evidence gates; individual findings should then be closed through those system controls.

Every implementation scope still requires explicit human approval.
