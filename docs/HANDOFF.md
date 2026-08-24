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

`DESIGN_SYSTEM.md` is now v2.1.0 and reflects this bilingual model instead of a global RTL assumption.

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

## eNamad policy — RESOLVED

Show eNamad in **both Persian and English** shells for now.

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
- `Modal` — locale-neutral/design-token aligned but still no verified consumer. Do not force adoption merely to keep it alive; do not delete before executable verification.

## Lobby UI cleanup

Lobby now uses shared product primitives rather than parallel inline implementations:
- `GameCard` for game selection,
- `LoadingSkeleton` for Recent Games and room-list loading,
- `EmptyState` for recent/room empty states,
- retry actions for retryable load failures,
- explicit localized game/room routes,
- LTR room-code input,
- locale-aware join arrow,
- semantic pressed/focus states for game mode,
- mobile-adaptive selection/mode/room layout,
- reduced-motion-safe introduced hover motion.

`DEBT-003`: RESOLVED IN CODE.
`DEBT-009`: SUBSTANTIALLY MITIGATED in Lobby.

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

## Theme / interaction cleanup

`DEBT-019` was found and resolved in code:
- MUI `warning` previously inherited unrelated default orange; it now uses the Honey Bronze token family.
- global MUI Button hover previously added bronze glow everywhere; global glow was removed while subtle tactile movement/focus remains.

This aligns implementation with the Design System rule that glow should signal meaningful interaction, not every hover.

## Header 360px hardening

Header received a targeted minimum-mobile pass:
- smaller xs toolbar gaps/padding and logo,
- compact icon-first primary navigation,
- compact language/sound/profile controls,
- Tooltip labels preserve discoverability,
- `aria-current` marks active routes,
- touched spacing uses logical properties.

This is static/code hardening only; browser validation at 360px is still NOT RUN.

## Admin Footer

Canonical bilingual editor: `/admin/footer`.

`DEBT-016`: `/admin` still contains dead legacy Footer editor state/load/save logic without rendered Footer-editor UI. Keep the focused editor canonical; remove dead logic only with safe executable validation or a validated isolated rewrite.

## Current debt / bug focus

- `DEBT-007` remaining locale-neutral internal links — targeted normalization pending.
- `DEBT-009` repeated feedback/state patterns outside Lobby — targeted review pending.
- `DEBT-012` Admin monolith — non-blocking.
- `DEBT-015` server/data-owned localization boundary — tracked.
- `DEBT-016` dead Admin Footer logic — cleanup pending validation.
- `DEBT-019` theme default-warning/global-glow divergence — RESOLVED IN CODE.
- `UI-001` Profile stats remain two columns at `xs`; static inspection indicates excessive density risk at the 360px minimum. Fix before local visual-review checkpoint.
- runtime/compile validation remains outstanding.

## Current next action

Continue automatically:
1. fix Profile 360px stats/header density and convert its public neutral links/redirect to explicit localized routes,
2. audit Tournaments/game-entry screens for narrow-screen hierarchy and physical RTL/LTR assumptions,
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
