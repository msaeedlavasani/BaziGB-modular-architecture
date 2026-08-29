# BaziGB — Next Task Handoff

Updated: 2026-08-29

## Purpose

This is the only handoff file that must be supplied to a fresh Codex task. It
prevents the new task from reconstructing the project from the long chat or
reading historical reports by default.

## Repository checkpoint

- Repository: `BaziGB-modular-architecture`
- Branch: `codex/release-candidate-preflight`
- Local candidate commit: `a577fe0`
- Protected remote revision: `a577fe0c3d7810a061a3218a02b2cc9d749f1607`
- Working tree at handoff creation: clean
- Working tree after the Private Alpha checkpoint: clean; the checkpoint is
  committed and pushed on this tracked branch, while production remains unchanged
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

The candidate remains **NO-GO for activation** because release, recovery,
observability, legal, committed-candidate and human-experience gates remain
open. The production dependency-security gate and mandatory full workspace
machine-validation gate now pass locally. No deployment, candidate activation,
or production change was performed.

The refreshed production-only audit (`npm audit --omit=dev --package-lock-only`
through the documented HTTPS mirror) reported:

- 0 vulnerabilities
- 0 high
- 0 moderate
- 0 critical

The previously reported server-runner and Vegas test failures do not reproduce
in the clean, supported-runtime validation described below. They are not
current machine-validation blockers.

## Current local continuation: Private Alpha scope

The human adjusted the local Alpha scope. The uncommitted implementation keeps
four games, local bots, invite-code rooms, public room discovery and a public
leaderboard. Tournament navigation and server APIs remain unavailable. Admin
operations remain server-protected but are not advertised to Alpha users. The
lobby presents a small bilingual “Free experimental version” badge.

In a temporary clean installation with Node 24.19.0 and Vitest 1.6.1, the
new route/capability tests passed (3/3), the server suite passed (21/21), the
complete workspace suite passed (90/90), and package, server and web builds
passed. After the scope adjustment, server and web typechecks, updated route
tests (3/3), and the web build passed. The temporary install was created without scripts; Prisma generation
could not update a sandboxed cache, so the matching generated client from the
checkout was used only for the temporary server build.

This scope is machine-validated and human-accepted: the six-item browser
navigation, room, and tournament-redirect check passed in both locales on
2026-08-30. The next separate product boundary is `LA-TRUST-001`, which
requires approval of its legal/support content; do not begin it implicitly.

### 2026-08-30 local Alpha corrections

The following corrections are included in the Private Alpha checkpoint; they
are not deployed or applied to production:

- The game-hub `Select` now provides a direct array of `MenuItem` children, so
  the MUI Fragment runtime error no longer blocks Tic-Tac-Toe.
- The local Prisma schema was created only in the ignored `apps/server/prisma/dev.db`.
  The local leaderboard is consequently honestly empty until real local games
  create users; it must not fall back to fake players.
- The leaderboard requests explicit 10-player pages, shows an honest empty or
  error state, and uses Previous/Next navigation instead of a long list.
- UI fixtures for leaderboard and tournaments now require the explicit local
  `NEXT_PUBLIC_BAZIGB_UI_DEMOS` switch (for example `leaderboard`). They are
  visibly labelled where rendered and are hard-disabled unless
  `NODE_ENV=development`; production cannot use them as an API fallback.
- A room page returns to its own game hub, not directly to the lobby.
- Leaderboard now uses the shared `PageContainer`, `PageStack`, and
  `PageHeader`; Header uses flow layout with semantic navigation, centered
  brand, and one grouped control rail rather than absolute-positioned regions.

Targeted server and web typechecks, guard and local-demo tests, and governance
validation passed. Read-only requests
through the local web proxy returned an empty real leaderboard and an active
public Tic-Tac-Toe room. Human browser validation passed for visual composition,
room creation, and room navigation. The local web and server processes may be
present on ports 3000 and 3001, but their terminal lifetime is not durable;
`DO-ENV-001` remains the P0 root-cause task.

## Completed bounded task

Controlled dependency modernization changed only the relevant runtime and
compatibility surfaces:

- root Node engine: `>=20.19.0`;
- web: Next.js `16.3.3`, retaining React 18;
- server: Nest `12.0.1`, Config `12.0.0`, and matching JWT/testing packages;
- the Next 16 asynchronous `headers()` migration in the root layout and its
  generated TypeScript configuration changes.

Targeted server and web typechecks passed after the normal internal-package
build and local Prisma generation. The optimized web build and the complete
workspace typecheck, boundary, governance, and build gates passed. Next 16
emits a non-blocking deprecation warning for the existing `middleware` file
convention.

QA-SERVER-001 was then repaired without changing its manifest or Vegas. In a
temporary copy of the same workspaces, using Node 24.19.0, Liara's npm mirror,
and scripts disabled for installation, the lockfile was rebuilt surgically:
only 16 stale server-local Vitest 4/Rolldown entries were removed. The candidate
lockfile exactly matched that temporary result before transfer. A clean
installation resolved the server through root Vitest 1.6.1; all 18 server tests
passed. The one full workspace test gate then passed (including Vegas 10/10),
as did full typecheck/boundaries, governance, and build.

Do not continue dependency modernization or alter Vegas from this handoff.
Human experiential browser testing remains assigned to the user; release,
commit, push, deployment and production actions each need their own authority.

The local release-candidate preflight is recorded in
`docs/reports/aipde/2026-08-29-local-release-candidate-preflight.md`.
Machine evidence is green. The preflight observed a dirty, detached worktree;
that state was then safely preserved in local commit `1b97f8d` on this branch,
and the branch is pushed to its tracked `origin` ref. It remains ineligible
for activation until it passes the remaining release gates.

## Initial reading budget

Read only these sources first:

1. `ai/NEXT_TASK_HANDOFF.md`
2. `ai/COLLABORATION_CONTRACT.md`
3. `ai/retrieval-manifest-v1.json`
4. `docs/release-and-secrets-contract.md` — only the dependency, candidate and
   deployment-gate sections
5. root and affected workspace package manifests/lockfile
6. the release script only if dependency installation behavior is relevant

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
