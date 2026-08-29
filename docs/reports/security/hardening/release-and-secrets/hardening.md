# Security Hardening Review: Release and Secrets

**Date:** 2026-08-28
**Outcome:** Structural hardening opportunity identified; implementation not started

## Evidence Basis

I inspected the recorded security finding, deferred restore concern, and current deployment, persistence, proxy, CORS, and environment examples. The strongest structural signal is not one bad command: release identity, runtime secrets, persistent data, and rollback are owned by overlapping scripts and competing deployment models.

## Constraints

Private Alpha should ship without combining feature delivery and a database-platform migration. Production actions, secret access, backups, rotation, and deployment remain separately approval-gated. No latency or memory measurements were supplied; those effects are source-derived or hypothetical.

## Opportunity Portfolio

| Opportunity | Evidence | Options | Recommendation | Proposal |
| --- | --- | --- | --- | --- |
| Own release and secret boundaries centrally | Predictable Docker credentials (`SEC-003`), unvalidated restore (`RESTORE-01`), direct live sync (`DEPLOY-01`) | 1. Patch current scripts; 2. Versioned Systemd/SQLite releases with scoped secrets | Option 2 for Alpha | [Release and secret ownership boundary](proposals/release-secret-boundary.md) |

## Recommendation Summary

I recommend keeping Systemd and SQLite for Alpha while replacing direct live synchronization with a versioned, atomic, fail-closed release boundary. This makes the smallest platform change that still separates releases, persistent data, secrets, and rollback. PostgreSQL becomes preferable only after Alpha when we can treat data migration as its own rehearsed project.

This design does not close `SEC-003` or prove restore integrity. Those outcomes require implementation and revalidation.

## Next Decisions

- Human acceptance of `docs/release-and-secrets-contract.md`.
- Separate approval for secret hardening and redacted inventory.
- Separate approval for real backup and restore rehearsal.
- Separate approval for release implementation, followed later by per-candidate deployment approval.
