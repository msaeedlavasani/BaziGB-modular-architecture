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

Continue autonomously through the approved foundation/UI cleanup path. Do **not** wait for another user instruction unless a genuine human product/architecture decision is required.

After every meaningful stage:
1. update code,
2. update `docs/platform-foundation-progress.md`,
3. sync this HANDOFF,
4. update `docs/platform-foundation.md` when architecture/debt materially changes,
5. report bugs/debt honestly,
6. never claim unexecuted validation as PASS,
7. explicitly tell the user when UI cleanup has reached a useful local-run checkpoint.

User preference for the current stage: **delay local visual review until known visual/UI/component issues are reduced further.**

## Architecture

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

## Public locale routing

Active on this branch through one shared page tree:

```text
/fa/lobby          /en/lobby
/fa/profile        /en/profile
/fa/leaderboard    /en/leaderboard
/fa/tournaments    /en/tournaments
/fa/game/...       /en/game/...
/fa/play/...       /en/play/...
/fa/login          /en/login
```

- Middleware rewrites localized URLs internally to shared pages.
- Root shell activates locale language/direction/theme/font/metadata.
- Header/Footer emit localized routes.
- Header exposes FA/EN switching while preserving the current logical path.
- Admin remains locale-neutral.

## Completed/substantially migrated consumers

- `/game/[gameId]`
- `/play/[roomId]`
- Lobby copy/metadata + canonical visual primitives
- Tournaments list
- Tournament detail/bracket
- Profile
- OTP/Login
- Leaderboard
- Header/Footer
- GameShell

Data/server-owned strings remain verbatim unless their protocol/content model is explicitly localized.

## eNamad policy — RESOLVED

Show eNamad in **both Persian and English** shells for now.

## Admin Footer

Canonical bilingual editor: `/admin/footer`.

- independent `footer.fa` / `footer.en` managed content,
- shared `FooterContent` schema,
- eNamad visibility is not editable because current product policy keeps it in both languages.

`DEBT-016`: `/admin` still contains dead legacy Footer editor state/load/save logic without rendered Footer-editor UI. Remove only when safe executable validation is available or a validated isolated rewrite is performed.

## Shared UI / Component Graveyard

Canonical by real use:
- GameShell
- Dice3D
- Header/Footer
- `GameCard` — Lobby selectable-game primitive
- `EmptyState` — Lobby product-level empty state
- `LoadingSkeleton` — Lobby repeated-section structural loading
- game-specific boards

Remaining candidate:
- `Modal` — now locale-neutral/design-token aligned but still has no verified consumer. Do not force adoption merely to keep it alive; do not delete before executable verification.

Do not create additional wrappers unless a recurring product pattern justifies them.

## Lobby UI cleanup

Lobby no longer maintains a parallel implementation for the shared patterns:
- game selection uses `GameCard`,
- Recent Games loading uses `LoadingSkeleton`,
- room-list loading uses structural `LoadingSkeleton`,
- recent/room empty states use `EmptyState`,
- retryable errors provide retry actions,
- game/room navigation uses explicit localized route builders,
- room code input remains LTR in both locales,
- join arrow follows locale,
- mode choices expose semantic pressed/focus states,
- mobile selection/mode/room hierarchy adapts for narrow screens,
- introduced hover motion respects reduced-motion.

`DEBT-003`: RESOLVED IN CODE.
`DEBT-009`: SUBSTANTIALLY MITIGATED for Lobby.

## GameShell current hierarchy

The canonical shell now has:
- `lg` width for board-heavy games,
- compact utility header for back/timer/room code,
- primary centered game title,
- secondary state/match chip row,
- explicit centered main game-content region,
- localized connection/room/match/back/rematch/waiting copy,
- room code forced LTR,
- locale-aware back arrow,
- restrained semantic winner panel.

This is intended to keep the game/board visually dominant instead of surrounding it with generic dashboard surfaces.

## Current debt focus

- `DEBT-007` remaining locale-neutral internal links — targeted normalization pending.
- `DEBT-009` repeated feedback/state patterns outside Lobby — targeted review pending.
- `DEBT-012` Admin monolith — non-blocking.
- `DEBT-015` server/data-owned localization boundary — tracked.
- `DEBT-016` dead Admin Footer logic — cleanup pending validation.
- runtime/compile validation remains outstanding.

## Current next action

Continue automatically:
1. audit Profile/Tournaments/game-entry screens for 360px responsive hierarchy and physical RTL/LTR assumptions,
2. normalize remaining high-traffic neutral internal links,
3. review repeated loading/empty/error patterns outside Lobby and only promote patterns that genuinely recur,
4. prepare safe Admin dead-logic cleanup without expanding the monolith,
5. known-bug/UI pass,
6. then declare a new local visual-review checkpoint.

Do not request a local run yet unless this cleanup reaches that checkpoint or a runtime-only blocker requires it.

## Validation

Current connector environment still cannot execute the app locally.

- Build: NOT RUN
- Typecheck: NOT RUN
- Tests: NOT RUN
- Browser visual verification: NOT RUN
- Deployment: NOT RUN

Never report PASS without actual execution.

## Safety

- Keep `main` untouched.
- Keep governance branch untouched.
- No merge/deploy without explicit release authorization.
- Do not duplicate Persian/English app trees.
- Do not make presentation metadata authoritative for game rules/capability.
- Do not destructively delete graveyard candidates before consumer proof + executable validation.
