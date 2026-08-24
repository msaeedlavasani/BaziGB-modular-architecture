# BaziGB — HANDOFF

## Current state

- Production baseline: `main`
- Working branch: `refactor/platform-foundation-i18n-v3`
- Governance source: latest verified governance on `ai/autonomous-development-system-v1`
- `main`: NOT MODIFIED
- Governance branch: NOT MODIFIED
- Merged: NO
- Deployed: NO
- Production verified: NO

## Operating mode

Continue autonomously from one approved implementation stage to the next. Do **not** wait for another user instruction unless a genuine human product/architecture decision is required.

After every meaningful stage:
1. update code,
2. update `docs/platform-foundation-progress.md`,
3. sync this HANDOFF,
4. update `docs/platform-foundation.md` when architecture/debt status materially changes,
5. report bugs/debt honestly,
6. never claim unexecuted validation as PASS.

## Bilingual architecture

```text
shared components
shared business logic
shared game engine
shared realtime/server contracts
        +
locale content
RTL / LTR
localized typography
localized metadata
localized routes
```

Locales: `fa` (RTL) and `en` (LTR).

## Foundation present

- `i18n/config.ts` — locale/direction/font/metadata.
- `i18n/messages.ts` — shared shell/game/multiplayer/Lobby/Tournament messages.
- `i18n/profile.ts`, `i18n/auth.ts`, `i18n/leaderboard.ts` — page-domain message dictionaries.
- `i18n/routing.ts` — canonical route identities + localized app/game/play/tournament builders.
- `hooks/useAppLocale.ts` — canonical client locale resolver.
- locale-aware theme factory + Providers.
- bilingual Footer Web/Server Site Settings contract.
- canonical `lib/game-catalog.ts` with real `/game`, `/play`, Lobby/Profile consumers.

## Public locale routing is ACTIVE on this branch

`apps/web/src/middleware.ts` exposes localized URLs while reusing one page tree:

```text
/fa/lobby          /en/lobby
/fa/profile        /en/profile
/fa/leaderboard    /en/leaderboard
/fa/tournaments    /en/tournaments
/fa/game/...       /en/game/...
/fa/play/...       /en/play/...
/fa/login          /en/login
```

Behavior:
- `/` → preferred locale Lobby (default `fa`).
- Neutral public routes redirect to the preferred locale.
- `bazigb-locale` cookie preserves locale across compatibility redirects during migration.
- Middleware sets `x-bazigb-locale`; root layout uses it for HTML language/direction, metadata, theme and font.
- Header/Footer now emit localized public navigation links.
- Admin remains locale-neutral until bilingual Admin/Footer-content work.

## Completed/substantially migrated consumers

- `/game/[gameId]`
- `/play/[roomId]`
- Lobby
- Tournaments list
- Profile
- OTP/Login
- Leaderboard

Client-owned copy is localized. Data/server-owned strings remain verbatim by design.

## Important content boundaries

Do not client-search/replace these:
- server chat/system payload text,
- tournament API fields such as name/description/prize,
- join-result server messages.

If multilingual versions are required, solve them in the data/protocol/content model.

## Component graveyard state

Canonical:
- GameShell
- Dice3D
- Header/Footer
- game-specific boards remain game-specific

Candidates:
- GameCard — UNUSED_CANDIDATE / INLINE_DUPLICATE
- EmptyState — UNUSED_CANDIDATE
- LoadingSkeleton — UNUSED_CANDIDATE / TOO_NARROW?
- Modal — UNUSED_CANDIDATE

A duplicate locale hook created during this refactor was already found and removed after confirming no consumers. Do not allow the refactor itself to create a new graveyard.

## Debt status

- DEBT-001 global locale/direction: SUBSTANTIALLY MITIGATED; runtime validation needed.
- DEBT-002 Lobby mixed language: SUBSTANTIALLY RESOLVED.
- DEBT-003 GameCard mismatch: OPEN.
- DEBT-004 singleton RTL theme: MITIGATED; runtime validation needed.
- DEBT-005 Footer single-locale: PARTIAL; Admin editor + eNamad English policy remain.
- DEBT-006 duplicate game metadata: RESOLVED for primary consumers.
- DEBT-007 locale-aware routes: SUBSTANTIALLY MITIGATED; normalize remaining neutral links.
- DEBT-008 hard-coded game-entry copy: SUBSTANTIALLY RESOLVED.
- DEBT-009 feedback primitive bypass: OPEN.
- DEBT-010 Tournament list mixed language: SUBSTANTIALLY RESOLVED; detail/bracket remains.
- DEBT-011 Footer Web/Admin/Server: PARTIAL; Admin remains.
- DEBT-012 Admin monolith: OPEN / non-blocking.
- DEBT-013 catalog graveyard risk: RESOLVED.
- DEBT-014 duplicate locale hook: RESOLVED.
- DEBT-015 server/data-owned localization boundary: TRACKED.

## Current next action

Proceed automatically:

1. Migrate Tournament detail/bracket client-owned copy and logical RTL/LTR positioning.
2. Normalize remaining high-traffic internal links to explicit localized route helpers; middleware redirects remain compatibility safety only.
3. Implement Admin bilingual Footer editor for `footer.fa` / `footer.en` while preserving legacy Persian compatibility.
4. Component Graveyard Cleanup.
5. Shared feedback pattern decision + Lobby/GameShell standardization.
6. Known-bug pass.
7. Executable validation in a suitable environment; one targeted visual check only if justified.

## Human decision not currently blocking

- Whether eNamad should appear on the English shell. Current behavior is preserved. Ask only when this policy must be changed/finalized.

## Validation

- GitHub Actions lookup on a branch checkpoint returned no workflow runs.
- Build: NOT RUN
- Typecheck: NOT RUN
- Tests: NOT RUN
- Browser visual verification: NOT RUN
- Deployment: NOT RUN

Never report PASS without actual execution.

## Safety

- Keep `main` untouched.
- Keep governance branch untouched.
- Do not merge or deploy without explicit release authorization.
- Do not create a second Persian/English app.
- Do not make presentation metadata authoritative for engine/runtime capability.
- Do not delete graveyard candidates before consumer verification and executable validation.
