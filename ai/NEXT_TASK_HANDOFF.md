# BaziGB — Next Task Handoff

Updated: 2026-08-29

## Purpose

This is the only handoff file that must be supplied to a fresh Codex task. It
prevents the new task from reconstructing the project from the long chat or
reading historical reports by default.

## Repository checkpoint

- Repository: `BaziGB-modular-architecture`
- Branch: `refactor/platform-foundation-i18n-v3`
- Protected remote revision: `df7f09547916711d7c3e32e4f75442ecbe937768`
- Working tree at handoff creation: clean
- Production: active version unchanged; no cutover was performed
- Prepared candidate: the protected revision above was uploaded and verified,
  but was not activated
- Production npm access: use Liara's documented HTTPS mirror because direct npm
  access from the Iran-hosted VPS is unreliable:
  `https://package-mirror.liara.ir/repository/npm/`
- Production safety backups created under:
  `/srv/bazigb-safety-backups/20260828T234820Z`
  (database checkpoint and full active-release archive)
- Never read, print, copy, or request secret values. Production mutation and
  deployment require a fresh, explicit human approval.

## Current release decision

The candidate is **NO-GO for activation** until the production dependency
security gate is resolved. The last production dependency audit reported:

- 14 vulnerabilities
- 5 high
- 9 moderate
- 0 critical

These counts are evidence from the previous task and must be revalidated after
the dependency changes. Do not repeat unrelated architecture or UI audits.

## Next bounded task

Perform controlled dependency modernization for the Alpha candidate, focused
only on the production dependency/security gate:

1. inspect the exact dependency paths behind the reported findings;
2. plan the smallest coherent Node/Next/Nest-compatible upgrade set;
3. change lockfiles/manifests without unrelated refactoring;
4. run targeted security and compatibility checks first;
5. run the full required release validation once at the final gate;
6. update this handoff and the canonical current state;
7. stop before any production activation and present a GO/NO-GO result.

Human experiential browser testing remains assigned to the user.

## Initial reading budget

Read only these sources first:

1. `ai/NEXT_TASK_HANDOFF.md`
2. `ai/retrieval-manifest-v1.json`
3. `docs/release-and-secrets-contract.md` — only the dependency, candidate and
   deployment-gate sections
4. root and affected workspace package manifests/lockfile
5. the release script only if dependency installation behavior is relevant

Do not read the full chat, all reports, `docs/HANDOFF.md`, or the complete work
registry unless a concrete conflict or missing fact requires expansion.

## Resource policy

- Treat cost control as an internal execution policy, not a stream of human
  confirmations.
- Batch discovery, avoid repeated polling, filter large command output, and do
  not rerun unchanged checks.
- Use targeted checks during implementation and one complete validation at the
  release gate.
- Stop for human approval only when scope materially expands, production would
  be mutated, a destructive action is required, or a genuine product decision
  is missing.
- If the task becomes materially larger than this boundary, checkpoint it and
  recommend a fresh task instead of silently consuming the remaining window.

## Model routing recommendation

Use a balanced coding model with high reasoning for this dependency task. Use a
frontier/highest-cost model only if a security-sensitive compatibility conflict
cannot be resolved reliably. Routine documentation, log filtering and targeted
validation do not justify a frontier model.

