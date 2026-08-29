# Implementation Plan: Versioned Atomic Systemd and SQLite Releases

**Date:** 2026-08-28
**Status:** Planned only; no production or repository implementation authorized

## Selected Design And Constraints

The selected Alpha design is Systemd plus SQLite with immutable release directories, atomic activation, external data and secrets, and separate human authority for backup, secret access, migration, deployment, and restore. The normative control is `docs/release-and-secrets-contract.md`. This plan does not authorize execution.

## Source Revision And Drift Check

The source audit targeted revision `17049d2704f755a1df85190580027001c0bb6856` and snapshot `codex-security-snapshot/v1:sha256:d8701aa488a6470a4a2b6878ec08ee7b5cdbd597762a6f02e527c53ef3f5967d`. Source drift is present. Before implementation, refresh every affected deployment and runtime file and return to design review if the runtime boundary has materially changed.

## Affected Components

- `scripts/deploy.sh`
- `scripts/backup-db.sh`
- `docker-compose.yml`
- `Caddyfile`
- `apps/server/src/main.ts`
- runtime Systemd definitions and production paths, after separately approved inspection

## Ordered Work Packages

1. `ST-SECRETS-001`: create the redacted inventory, remove fallbacks, scope deployment identity, pin host identity, and allowlist origins.
2. `DO-RECOVERY-001`: create approved production/local checkpoints and encrypted credential recovery; prove retrieval and restore.
3. `DO-RELEASE-001`: implement manifest, versioned directories, atomic activation, mandatory verification, and rollback.
4. Stage the exact candidate and inject release failures.
5. Build one identifiable release candidate and request production authority separately.

## Compatibility And Migration

Keep SQLite and the current public same-origin behavior for Alpha. Release files, runtime configuration, database, logs, and backups move to separate paths. PostgreSQL is excluded and tracked as `DO-PG-001`.

## Tactical Protections During Migration

Until atomic release activation exists, remove automatic host-key deletion, disable the Docker production path, remove predictable fallbacks, make health failures fatal, and preserve a verified pre-change checkpoint. These protections still need explicit implementation approval.

## Tests And Security Validation

- configuration fails closed for missing production secrets;
- explicit CORS origin tests;
- host-key mismatch rejection;
- transfer, install, migration, restart, and health failure injection;
- candidate checksum and active-pointer verification;
- database integrity and restored critical-path check;
- `SEC-003` revalidation.

## Performance And Resource Benchmarks

Measure staging deploy duration, interruption time, rollback duration, release disk retention, database backup duration, restore duration, and service RSS. No current value is claimed as measured.

## Rollout And Rollback

Introduce release paths and permissions before switching activation. Keep the previous verified release and checkpoint through the observation window. Application rollback switches the pointer and restarts services. Data restore stops writes and requires separate destructive-recovery approval.

## Acceptance Criteria

- the promoted artifact is byte-identical to the validated candidate;
- an interrupted transfer does not alter the active release;
- missing secret, host mismatch, failed migration, or failed health check stops activation;
- previous application release is restored without overwriting data or secrets;
- a database copy is restored and validated, not merely copied;
- every authority and evidence transition is recorded.

## Open Decisions

- password manager or operating-system keychain choice;
- RPO, RTO, release retention, and observation window;
- exact staging environment and production runtime paths;
- implementation and production execution approvals.
