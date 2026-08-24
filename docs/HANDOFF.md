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

Locales: `fa` RTL and `en` LTR. `DESIGN_SYSTEM.md` is now **v2.2.0**.

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

## Visual consistency / shape system

`DEBT-021` is resolved in code pending visual validation.

The previous MUI shape base was `12px`. Because numeric `sx` radius values multiply the base, common values such as `borderRadius: 3/4` produced 36/48px corners on ordinary surfaces.

Canonical base is now `4px`:

```text
2   -> 8px   compact controls
2.5 -> 10px  buttons / inputs
3   -> 12px  icon containers / small surfaces
4   -> 16px  cards / panels / major surfaces
```

Theme exports `shapeScale`. Circles, avatars, game pieces and specialized board geometry are intentional exceptions.

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
- focus-visible and reduced-motion handling strengthened,
- radius hierarchy normalized through 4px MUI base.

### Header / root shell
- Header hardened statically for 360px,
- explicit language switcher,
- root no longer imposes duplicate 1200px/padding constraints on every page/game,
- Persian font stylesheet only loads for Persian requests.

### Tournaments
- list uses canonical loading/empty states,
- theme-token CTA/progress treatment,
- localized login/detail links,
- retry action,
- restrained card interaction,
- detail/bracket narrow-screen hierarchy hardened while bracket geometry remains intentionally LTR.

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
`BUG-002` resolved in code:
- removed stale import of deleted `i18n/useAppLocale`,
- canonical `hooks/useAppLocale` import,
- localized Lobby back route,
- semantic waiting/spectator/chat colors,
- narrow-screen chat composer stacks,
- realtime/gameplay protocol behavior preserved.

## Game-specific UI cleanup

### Tic-Tac-Toe
- removed hard-coded Persian turn/winner copy from board presentation,
- active locale game-shell labels,
- semantic theme colors,
- keyboard-focusable cells,
- reduced-motion/focus-visible handling.

### Chess
- `ChessInfo` now uses locale-aware labels instead of Persian-only captured/history copy,
- board geometry remains intentionally `direction: ltr`,
- fixed board wood/square colors are classified as game-art styling rather than generic app-palette leakage.

### Vegas
- board chrome and state labels were migrated away from Persian-only presentation,
- semantic theme treatment replaces several unrelated dashboard-style colors where appropriate,
- game-art/player identity colors remain game-specific,
- game engine/rules were not changed.

### Backgammon
Backgammon board chrome is now locale-aware while board geometry remains intentionally LTR.

Implemented:
- `apps/web/src/i18n/backgammon-board.ts` is the presentation dictionary,
- Off/roll/waiting/double/end-turn/doubling-dialog copy is bilingual,
- double dialog direction follows active locale instead of fixed RTL,
- dice separator follows locale,
- CTA controls use semantic theme colors instead of unrelated hard-coded orange/gray application styling,
- introduced animation respects reduced-motion,
- physical board coordinate placement remains fixed LTR by design,
- duplicate `bgPtLight` SVG gradient definition removed.

`BUG-003` duplicate Backgammon SVG gradient ID: **RESOLVED IN CODE / executable validation pending.**

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
- `DEBT-021` oversized/inconsistent radius baseline — RESOLVED IN CODE / visual validation pending.
- `BUG-001` overall runtime/compile validation — outstanding.
- `BUG-002` stale deleted locale-hook import in `/play` — RESOLVED IN CODE.
- `BUG-003` duplicate Backgammon SVG gradient id — RESOLVED IN CODE / validation pending.

## Validation infrastructure

Branch-only `.github/workflows/foundation-web-check.yml` exists and is intended to run:
- `npm ci`,
- shared package build,
- boundary check,
- web typecheck,
- web build.

No completed run is currently associated with the latest branch commit. This is not PASS.

## Current next action

Continue automatically:
1. finish remaining high-traffic locale-neutral route scan,
2. static compile-risk scan around newly migrated game-specific UI,
3. review recurring feedback patterns without speculative abstraction,
4. prepare safe Admin dead Footer cleanup without expanding the monolith,
5. perform final known-bug/UI pass,
6. then declare a local visual-review checkpoint.

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
