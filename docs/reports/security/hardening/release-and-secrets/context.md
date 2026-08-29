# Release and Secrets Hardening Context

**Date:** 2026-08-28
**Status:** Derived evidence context; current source drift recorded

This is derived design context. The security audit and source remain read-only evidence.

| Evidence | Title | Path | Relevance |
| --- | --- | --- | --- |
| `SEC-003` | Conditional Docker deployment uses predictable credentials | `docs/reports/security/2026-08-26-repository-security-audit.md` | Competing production paths and fallback secrets fail open. |
| `RESTORE-01` | Backup and restore integrity is unvalidated | `docs/reports/security/2026-08-26-repository-security-audit.md` | A copied SQLite file is not proven recoverable. |
| `DEPLOY-01` | Direct live-directory deployment | `scripts/deploy.sh` | Root SSH, host-key deletion, destructive sync, and tolerated health failure weaken release identity and rollback. |
| `DB-01` | Active persistence is SQLite | `apps/server/prisma/schema.prisma` | PostgreSQL is not the current application persistence contract. |
| `CORS-01` | Broad credentialed CORS | `apps/server/src/main.ts` | Runtime origin trust is not explicitly bounded. |

Source identity is the security audit snapshot `codex-security-snapshot/v1:sha256:d8701aa488a6470a4a2b6878ec08ee7b5cdbd597762a6f02e527c53ef3f5967d`, based on revision `17049d2704f755a1df85190580027001c0bb6856`. The current working tree has moved, so source drift is present. Relevant current files were reopened before drafting.
