# Security Hardening Proposal: Own the Release and Secret Boundary

**Date:** 2026-08-28
**Status:** Option selected for contract design; implementation not authorized

## Decision

Choose how BaziGB should make a production release identifiable, reversible, and unable to start with unsafe credentials.

## Executive Recommendation

The complete option set is Option 1, **strengthen the current direct-sync scripts**, and Option 2, **use versioned atomic Systemd/SQLite releases with scoped runtime secrets**. I recommend Option 2 under the Private Alpha constraint. Option 1 remains reasonable only for a short emergency stabilization when release-directory work cannot be completed before an urgent fix.

## Evidence

| Evidence | Finding or document | What it establishes |
| --- | --- | --- |
| `SEC-003` | [Conditional Docker deployment uses predictable credentials](../../../2026-08-26-repository-security-audit.md) | The alternative production path fails open with known database and JWT values. |
| `RESTORE-01` | [Backup and restore integrity deferred](../../../2026-08-26-repository-security-audit.md) | Static backup review did not prove a usable restore. |
| `DEPLOY-01` | `scripts/deploy.sh` | Current deployment mutates the live directory through root SSH, removes host identity evidence, and tolerates failed checks. |
| `DB-01` | `apps/server/prisma/schema.prisma` | Current persistence is SQLite, so a PostgreSQL deploy path is not compatible by configuration alone. |
| `CORS-01` | `apps/server/src/main.ts` | Credentialed CORS currently accepts reflected origins rather than an allowlist. |

I reopened these current source files. The audit revision and working tree differ, so claims about current behavior are limited to the files inspected now.

## Current Design And Failure Mode

Observed facts show two competing production stories: a direct Systemd/SQLite path and a Docker/PostgreSQL path. The direct path copies into the active directory; the Docker path supplies unsafe fallback secrets. Restore remains unproven. We infer that no single boundary owns candidate identity, secret requirements, persistent data, activation, verification, and rollback. That condition makes drift likely even if each visible script receives a local fix.

## Desired Invariants

- Every active release maps to one immutable candidate manifest and checksum.
- Missing production secrets stop startup; no production fallback value exists.
- Release files, data, secrets, logs, and backups have separate lifetimes.
- Host identity mismatch stops deployment.
- Activation and application rollback are atomic and do not destroy the previous release.
- A backup is not called recoverable until restoration is tested.
- Database change, secret rotation, and deployment have separate human authority.

## Constraints And Non-Goals

Private Alpha keeps Systemd and SQLite. PostgreSQL, container orchestration, vendor selection, production access, actual rotation, and actual backup are non-goals for this design task. Browser experiential testing remains human-owned.

## Before Architecture

The [before diagram](../diagrams/release-secret-boundary-before.mmd) shows release code, live files, data, and secrets sharing an operational boundary while a conflicting alternative path can introduce fallback credentials.

## Options

### Option 1: Strengthen the current direct-sync scripts

This option preserves the current directory and operator workflow. We remove automatic host-key deletion, require secrets, disable Docker production use, add a pre-copy backup, and make health failures fatal. Its strongest case is delivery speed: no new release layout or service-pointer convention is introduced.

The security improvement is real but narrow. The same script still mutates the active tree, and rollback depends on reconstructing the earlier state. Resource cost is negligible, but reliability remains coupled to partial file transfer and dependency installation. Rollout is a focused script change; rollback is reverting the script, which cannot itself reconstruct a partially overwritten live directory.

See the [Option 1 diagram](../diagrams/release-secret-boundary-local-guards-after.mmd).

| Change | Before | After | Security consequence | Cost |
| --- | --- | --- | --- | --- |
| Host identity | deleted automatically | mismatch stops release | prevents silent host substitution | key enrollment procedure |
| Secrets | alternative fallbacks | required values | removes known defaults | configuration preparation |
| Health | failures tolerated | failures stop release | prevents false success | more blocked releases |
| Rollback | ad hoc | backup-assisted | improves recovery but remains coupled | backup time and storage |

### Option 2: Versioned atomic Systemd and SQLite releases

This option keeps the familiar runtime but changes ownership. A scoped deploy identity places one verified artifact in a versioned directory. Persistent SQLite data and root-owned secrets remain outside it. An atomic pointer activates the candidate; the previous verified pointer provides application rollback. Candidate, backup, staging, verification, and approval evidence are recorded before activation.

The attractive part is containment without a database-platform rewrite. A failed copy cannot corrupt the active release, secret requirements become a preflight property, and rollback no longer depends on reconstructing overwritten files. The main residual risk is database compatibility: an irreversible migration can still prevent application rollback. We address that with committed migrations, checkpoint and rehearsal gates, and an explicit stop before incompatible downgrade.

The extra process, checksum, and pointer consume negligible runtime memory or request latency because they are release-time controls. Operational complexity rises moderately: release retention, manifest generation, service permissions, and restore drills need ownership. Rollout can introduce directories and the deploy user before switching activation. Rollback returns the pointer and restarts services; data restoration remains a separately approved recovery action.

See the [Option 2 diagram](../diagrams/release-secret-boundary-atomic-systemd-after.mmd).

| Change | Before | After | Security consequence | Cost |
| --- | --- | --- | --- | --- |
| Release identity | mutable live tree | immutable version and checksum | makes provenance auditable | manifest tooling |
| Deployment authority | root SSH | scoped deploy identity | narrows host authority | permission design |
| Activation | destructive sync | atomic pointer | contains partial transfer failure | release layout |
| Data and secrets | adjacent to release | external lifetimes | prevents replacement and leakage through artifact sync | path migration |
| Recovery | copy-based backup | checkpoint plus restore proof | makes recovery claim testable | rehearsal time |

## Comparison

| Dimension | Option 1 | Option 2 |
| --- | --- | --- |
| Security | improves known defaults; control drift remains | centralizes candidate, identity, secret, and activation boundaries |
| Performance | neutral; source-derived | neutral at request time; source-derived |
| Memory | neutral; source-derived | neutral at request time; source-derived |
| Reliability | improves checks but keeps partial-live-mutation risk | isolates transfer and provides atomic application rollback |
| Operability | low initial change, continued manual recovery burden | moderate setup, clearer evidence and incident behavior |
| Migration | smallest change | directory, permissions, service, and data-path transition |

No performance or memory result is measured. Validation should compare deploy duration, service interruption, disk consumption, rollback duration, and critical-path availability on staging. Option 2 should win if rollback completes within the agreed threshold and the previous candidate remains intact after an injected transfer or health failure.

## Recommendation

I recommend Option 2 because it addresses the structural ownership problem while honoring the decision not to migrate databases before Alpha. Option 1 becomes preferable only when an urgent security patch must ship before the atomic layout is ready; in that case it is a temporary state with an expiry, not the canonical architecture.

## Evidence Coverage And Residual Risk

| Evidence | Option 1 | Option 2 | Tactical work still required |
| --- | --- | --- | --- |
| `SEC-003` — Predictable Docker credentials | mitigates | addresses the deployment-choice boundary | remove fallbacks and rotate any value ever used |
| `RESTORE-01` — Restore unvalidated | mitigates | mitigates | perform an approved restore drill |
| `DEPLOY-01` — Direct live sync | mitigates | addresses architecture | replace script and verify rollback |
| `CORS-01` — Broad origin trust | unaffected | unaffected | implement explicit allowlist and tests |

Neither option closes a finding until implementation and revalidation. Credential values that may have been used remain unknown and may still require rotation.

## Migration And Rollout

First establish the redacted inventory and candidate manifest without reading secret values. Then create the scoped deploy identity, pinned host key, external release/data/secret paths, and staging rehearsal. Move activation only after rollback works. Preserve the current release and database snapshot until the observation window passes. PostgreSQL stays outside this rollout.

## Validation Plan

- prove missing production secrets and unsafe Docker defaults fail closed;
- inject host-key, transfer, dependency, migration, health, and restart failures in staging;
- prove active release is unchanged before atomic activation;
- verify candidate checksum and previous-release rollback;
- validate explicit CORS origins;
- restore a database copy and run integrity plus critical application checks;
- revalidate `SEC-003` after implementation.

## Implementation Work Packages

- `ST-SECRETS-001`: redacted inventory, fail-closed configuration, scoped access, origin allowlist.
- `DO-RECOVERY-001`: production/local checkpoints, encrypted credential recovery, restore proof.
- `DO-RELEASE-001`: versioned directories, manifest, atomic activation, mandatory verification, rollback.
- `DO-PG-001`: independent post-Alpha PostgreSQL migration.

## Open Questions

- Which encrypted password manager or operating-system keychain becomes the human source of truth?
- What RPO, RTO, release retention, and staging observation window should Human Direction approve?
- Which exact production service definitions and runtime paths exist? Inspecting them requires separate production-access approval.
