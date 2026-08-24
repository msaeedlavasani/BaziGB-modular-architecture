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
7. tell the user when UI cleanup has reached a useful local-run checkpoint.

Current user preference: **do not request local visual review yet; reduce known UI/visual/component issues first.**

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

Locales: `fa` RTL and `en` LTR. `DESIGN_SYSTEM.md` v2.1.0 reflects this model.

## Public locale routing

Active through one shared page tree:

```text
/fa/lobby          /en/lobby
/fa/profile        /en/profile
/fa/leaderboard    /en/leaderboard
/fa/tournaments    /en/tournaments
/fa/game/...       /en/game/...
/fa/play/...       /en/play/...
/fa/login          /en/login
```

- middleware rewrites localized URLs to shared pages,
- root shell activates locale language/direction/theme/font/metadata,
- Header/Footer emit localized routes,
- Header exposes FA/EN switching while preserving logical path,
- Admin remains locale-neutral.

## eNamad policy

**Show eNamad in both Persian and English shells for now.**

## Shared UI / Component Graveyard

Canonical by real use:
- GameShell
- Dice3D
- Header/Footer
- GameCard
- EmptyState
- LoadingSkeleton
- focused `/admin/footer` editor
- game-specific boards remain game-specific

Remaining candidate:
- `Modal` — no verified consumer; do not force adoption and do not delete before executable verification.

## Major UI cleanup completed in code

### Lobby
- shared `GameCard`, `LoadingSkeleton`, `EmptyState`,
- explicit localized navigation,
- retryable errors,
- LTR invite code,
- locale-aware arrow,
- semantic selected/focus states,
- mobile-adaptive game/mode/room hierarchy.

### GameShell
- `lg` width for board-heavy games,
- utility header separated from title/state,
- centered main game-content region,
- localized shell labels,
- logical spacing,
- LTR room code,
- locale-aware back arrow,
- restrained winner treatment.

### Theme / surfaces
- Honey Bronze `warning` palette replaces MUI default orange,
- no forced shadow on every Paper,
- non-interactive Cards do not globally lift/glow,
- global Button hover glow removed,
- focus-visible and reduced-motion handling strengthened.

### Header / root shell
- Header hardened statically for 360px,
- explicit language switcher,
- root no longer imposes duplicate 1200px/padding constraints on every page/game,
- Persian font stylesheet only loads for Persian requests.

### Tournaments list
- canonical loading/empty states,
- theme-token CTA/progress treatment,
- localized login/detail links,
- retry action,
- restrained card interaction.

### Profile
`UI-001` resolved in code:
- 1-column xs stats, 2-column sm, 4-column md,
- mobile header stacks,
- compact profile hero,
- safe username/email wrapping,
- localized Lobby/login navigation and locale-aware back icon,
- history table overflow contained locally,
- canonical empty history treatment.

### Multiplayer `/play/[roomId]`
A concrete compile-risk regression was found: this page still imported the already-deleted `i18n/useAppLocale` module.

`BUG-002` resolved in code:
- canonical `hooks/useAppLocale` import restored,
- targeted search shows no remaining `i18n/useAppLocale` import,
- localized Lobby back route,
- semantic waiting/spectator/chat colors,
- removed unrelated hard-coded chat blue and heavy waiting shadow,
- narrow-screen chat composer stacks,
- realtime/gameplay protocol behavior preserved.

## Admin Footer

Canonical bilingual editor: `/admin/footer`.

`DEBT-016`: main `/admin` still contains dead legacy Footer editor state/load/save logic without rendered editor UI. Remove only with safe executable validation or a validated isolated rewrite.

## RTL implementation risk

`DEBT-020` is OPEN / runtime-validation dependent.

Current app has locale `html dir`, locale `theme.direction`, and product layouts increasingly use logical CSS. However MUI 5 + Emotion may require an RTL style cache/plugin for internal physical styles; `stylis-plugin-rtl` is not currently declared.

Do not add dependency/lockfile changes blindly in connector-only mode. Verify MUI mirroring during the eventual local run and add the RTL Emotion cache/plugin only with a safe install/lockfile update if needed.

## Current debt / bug focus

- `DEBT-007` remaining locale-neutral internal links — targeted review continues.
- `DEBT-009` repeated feedback patterns outside migrated Lobby/Tournaments — targeted review continues.
- `DEBT-012` Admin monolith — non-blocking.
- `DEBT-015` server/data-owned localization boundary — tracked.
- `DEBT-016` dead Admin Footer logic — cleanup pending validation.
- `DEBT-020` MUI/Emotion RTL cache/plugin verification — runtime dependent.
- `BUG-001` overall runtime/compile validation — outstanding.
- `BUG-002` stale deleted locale-hook import in `/play` — RESOLVED IN CODE.

## Validation infrastructure

Branch-only `.github/workflows/foundation-web-check.yml` exists and is intended to run:
- `npm ci`,
- shared package build,
- boundary check,
- web typecheck,
- web build.

The connector has not surfaced a completed status for current commits. This is not PASS.

## Current next action

Continue automatically:
1. audit Tournament detail and local game-entry UI for remaining 360px/physical-direction issues,
2. inspect game-specific surrounding controls for shell-level overflow without redesigning game art,
3. normalize only proven recurring feedback patterns,
4. prepare safe Admin dead Footer cleanup,
5. perform static known-bug/compile-risk pass,
6. then declare a new local visual-review checkpoint.

Do not request local run before that checkpoint unless a runtime-only blocker makes static progress impossible.

## Validation

- Build: NOT CONFIRMED
- Typecheck: NOT CONFIRMED
- Tests: NOT RUN
- Browser visual verification: NOT RUN
- Deployment: NOT RUN

Never report PASS without actual execution.

## Safety

- keep `main` untouched,
- keep governance branch untouched,
- no merge/deploy without explicit release authorization,
- do not duplicate Persian/English app trees,
- do not make presentation metadata authoritative for game rules/capability,
- do not destructively delete remaining graveyard candidates before consumer proof + executable validation.
