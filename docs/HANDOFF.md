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
6. never claim unexecuted validation as PASS,
7. explicitly tell the user when accumulated visual changes justify a local run/review.

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
- `i18n/profile.ts`, `i18n/auth.ts`, `i18n/leaderboard.ts`, `i18n/tournament-detail.ts` — page-domain message dictionaries.
- `i18n/routing.ts` — canonical route identities + localized app/game/play/tournament builders.
- `hooks/useAppLocale.ts` — canonical client locale resolver.
- locale-aware theme factory + Providers.
- bilingual Footer Web/Server Site Settings contract.
- canonical `lib/game-catalog.ts` with real `/game`, `/play`, Lobby/Profile/Tournament consumers.
- focused bilingual Admin Footer editor at `/admin/footer`.

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
- `bazigb-locale` cookie preserves locale across compatibility redirects.
- Middleware sets `x-bazigb-locale`; root layout uses it for HTML language/direction, metadata, theme and font.
- Header/Footer emit localized public navigation links.
- Admin remains locale-neutral; its content editor writes locale-specific managed content.

## Completed/substantially migrated consumers

- `/game/[gameId]`
- `/play/[roomId]`
- Lobby
- Tournaments list
- Tournament detail/bracket
- Profile
- OTP/Login
- Leaderboard

Client-owned copy is localized. Data/server-owned strings remain verbatim by design.

## Tournament detail / bracket decisions

- Status/errors/not-found/join/player-count/champion/bracket/round labels are locale-aware.
- Tournament game title uses canonical game presentation metadata when recognized.
- Date formatting follows locale.
- Bracket connector geometry is intentionally rendered LTR in both languages so progression math and connector positions remain deterministic; surrounding copy remains locale-aware.
- Logical inline spacing replaces physical left/right spacing in touched bracket UI.

## eNamad product policy — RESOLVED

**Show eNamad in both Persian and English shells for now.**

Do not add locale-based hiding. Revisit only if the product later separates Iranian and international market policies.

## Admin Footer editor

Canonical bilingual editor: `/admin/footer`.

- Loads `fa` and `en` Footer content independently.
- Writes `footer.fa` / `footer.en` through `saveLocalizedFooterSettings()`.
- Uses one shared `FooterContent` schema with locale-specific managed values.
- Persian/English tabs track dirty state independently.
- eNamad remains outside editable content because visibility is currently fixed for both locales.

### DEBT-016 — dead Footer editor logic in `/admin`

The existing `/admin` monolith still contains Footer editor state/load/save functions but no rendered Footer editor UI in the current page body. Treat that as dead page-local logic.

Do not recreate the editor inside the monolith. During Admin/Component Graveyard cleanup:
- add discoverability/navigation to `/admin/footer`,
- remove the legacy dead Footer state/functions,
- preserve existing unrelated admin behavior.

Destructive cleanup waits for executable validation.

## Important content boundaries

Do not client-search/replace these:
- server chat/system payload text,
- tournament API fields such as name/description/prize,
- tournament/player/champion names,
- join-result server messages.

If multilingual versions are required, solve them in the data/protocol/content model.

## Component graveyard state

Canonical:
- GameShell
- Dice3D
- Header/Footer
- focused `/admin/footer` managed-content editor
- game-specific boards remain game-specific

Candidates/debt:
- GameCard — UNUSED_CANDIDATE / INLINE_DUPLICATE
- EmptyState — UNUSED_CANDIDATE
- LoadingSkeleton — UNUSED_CANDIDATE / TOO_NARROW?
- Modal — UNUSED_CANDIDATE
- legacy Footer editor state/functions inside `/admin` — DEAD PAGE-LOCAL LOGIC (`DEBT-016`)

A duplicate locale hook created during this refactor was already found and removed after confirming no consumers.

## Debt status

- DEBT-001 global locale/direction: SUBSTANTIALLY MITIGATED; runtime validation needed.
- DEBT-002 Lobby mixed language: SUBSTANTIALLY RESOLVED.
- DEBT-003 GameCard mismatch: OPEN.
- DEBT-004 singleton RTL theme: MITIGATED; runtime validation needed.
- DEBT-005 Footer single-locale: SUBSTANTIALLY MITIGATED; bilingual read/write path exists. Admin discoverability/legacy cleanup remains.
- DEBT-006 duplicate game metadata: RESOLVED for primary consumers.
- DEBT-007 locale-aware routes: SUBSTANTIALLY MITIGATED; normalize remaining neutral links.
- DEBT-008 hard-coded game-entry copy: SUBSTANTIALLY RESOLVED.
- DEBT-009 feedback primitive bypass: OPEN.
- DEBT-010 Tournament mixed language: SUBSTANTIALLY RESOLVED for list + detail client-owned copy.
- DEBT-011 Footer Web/Admin/Server: SUBSTANTIALLY MITIGATED; focused bilingual editor exists.
- DEBT-012 Admin monolith: OPEN / non-blocking.
- DEBT-013 catalog graveyard risk: RESOLVED.
- DEBT-014 duplicate locale hook: RESOLVED.
- DEBT-015 server/data-owned localization boundary: TRACKED.
- DEBT-016 dead Footer editor logic in `/admin`: OPEN; safe cleanup pending validation.

## Visual review checkpoint

**A local run is now useful and should show major visual/product differences.**

Visible changes now include:
- actual `/fa/*` and `/en/*` URLs,
- RTL Persian vs LTR English shell,
- locale-specific typography and metadata,
- localized Header/Footer/Lobby/Profile/Login/Leaderboard/Tournaments/GameShells,
- localized Tournament detail/bracket,
- bilingual managed Footer content path (visible once locale-specific Footer values are saved).

This is not validation PASS; it is only the point where a local visual review has meaningful value.

## Current next action

Proceed automatically:

1. targeted inventory/normalization of remaining high-traffic locale-neutral links,
2. Component Graveyard Cleanup preparation (consumer proof first),
3. shared feedback pattern decision + Lobby/GameShell standardization,
4. known-bug pass,
5. executable validation in a suitable environment; one targeted visual check only if justified.

Do not destructively delete graveyard candidates until executable validation is available.

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
