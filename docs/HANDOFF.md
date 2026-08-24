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
2. update implementation docs as practical,
3. sync this HANDOFF,
4. update `docs/platform-foundation.md` when architecture/debt materially changes,
5. report bugs/debt honestly,
6. never claim unexecuted validation as PASS,
7. tell the user when UI cleanup has reached a useful local-run checkpoint.

### Git / branch authority boundary

Autonomy applies inside the already-approved working branch. It does **not** authorize silent repository-structure changes.

Without explicit user approval, do not:
- create another working branch,
- switch the canonical working branch,
- merge/rebase major branch history,
- delete branches,
- modify `main`,
- deploy.

Normal implementation commits on `refactor/platform-foundation-i18n-v3` are allowed and must be reported.

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
- local/bot game back navigation now remains inside the active locale,
- multiplayer game back navigation remains inside the active locale,
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

Canonical MUI shape base is now `4px`:

```text
2   -> 8px   compact controls
2.5 -> 10px  buttons / inputs
3   -> 12px  icon containers / small surfaces
4   -> 16px  cards / panels / major surfaces
```

Theme exports `shapeScale`. Circles, avatars, game pieces and specialized board geometry are intentional exceptions.

## Major UI cleanup completed in code

### Global shell / theme
- Header hardened for ~360px widths.
- Visible FA/EN switcher preserves logical path.
- Root no longer imposes duplicate global max-width/padding on every page/game.
- Persian font stylesheet only loads for Persian requests.
- Honey Bronze warning palette replaces default MUI orange.
- Global Button/Card/Paper decorative glow/shadow behavior was reduced.
- Focus-visible and reduced-motion behavior strengthened.
- Radius hierarchy normalized.

### Lobby
- canonical `GameCard`, `LoadingSkeleton`, `EmptyState`,
- localized routes/copy/status,
- retryable errors,
- LTR invite codes,
- mobile-adaptive game/mode/room hierarchy.

### GameShell
- wider board-capable content region,
- utility header separated from game title/state,
- centered game-content region,
- localized shell labels,
- logical spacing and locale-aware arrows,
- LTR room code,
- restrained winner state.

### Tournaments
- canonical loading/empty/error treatment,
- theme-token CTA/progress styling,
- localized list/detail routes,
- narrow-screen tournament-detail hierarchy,
- bracket geometry intentionally remains LTR while presentation is localized.

### Profile / Auth / Leaderboard
- bilingual client-owned copy,
- Profile mobile density fixed,
- safe wrapping and local table overflow,
- localized routes and date presentation,
- auth phone/code inputs intentionally remain LTR.

### Multiplayer `/play/[roomId]`
`BUG-002`: **RESOLVED IN CODE**.
- removed stale deleted locale-hook import,
- localized Lobby back route,
- semantic waiting/spectator/chat treatment,
- narrow-screen chat composer stacks,
- realtime/game protocol behavior preserved.

## Game-specific UI cleanup

### Tic-Tac-Toe
- bilingual board presentation,
- semantic theme treatment,
- keyboard-focusable cells,
- reduced-motion/focus-visible support.

### Chess
- `ChessInfo` bilingual,
- board geometry intentionally LTR,
- wood/square colors remain specialized game-art styling.

### Vegas
- board chrome/state labels bilingual,
- generic application chrome moved toward semantic theme treatment,
- game/player identity colors remain game-specific,
- game engine/rules untouched.

### Backgammon
- surrounding board chrome bilingual through `i18n/backgammon-board.ts`,
- board coordinate geometry intentionally LTR,
- Off/roll/waiting/double/end-turn/dialog presentation localized,
- dialog direction follows active locale,
- CTA chrome uses theme semantics,
- reduced-motion respected,
- duplicate SVG `bgPtLight` definition removed.

`BUG-003`: **RESOLVED IN CODE / executable validation pending.**

### Local/bot `/game/[gameId]`
- canonical game catalog + localized shell presentation,
- safe game-id guard,
- Lobby back navigation now uses `localizedAppRoute(locale, 'lobby')` instead of locale-neutral `/lobby`.

## Admin Footer

Canonical bilingual editor: `/admin/footer`.

`DEBT-016`: `/admin` still contains dead legacy Footer state/load/save logic with no rendered editor UI. This is non-blocking for visual review and should be removed after executable validation or via a separately validated isolated cleanup.

## Runtime-only RTL risk

`DEBT-020` remains OPEN until local/browser validation.

The app has locale `html dir`, `theme.direction`, and increasingly logical CSS. Actual MUI 5/Emotion internal mirroring may still require an RTL Emotion cache/plugin. `stylis-plugin-rtl` is not currently declared.

Do not change dependency/lockfile state blindly in connector-only mode. Verify during local review first.

## Current debt / bug focus

- `DEBT-007` locale-neutral navigation: high-traffic shell/game paths have been migrated; residual low-traffic cases can be caught during local review.
- `DEBT-009` repeated feedback patterns: major Lobby/Tournament flows migrated; do not invent wrappers for every MUI primitive.
- `DEBT-012` Admin monolith: non-blocking.
- `DEBT-015` server/data-owned localization boundary: tracked separately.
- `DEBT-016` dead Admin Footer logic: non-blocking cleanup after executable validation.
- `DEBT-020` MUI/Emotion RTL cache verification: **runtime dependent**.
- `DEBT-021` oversized radius baseline: **RESOLVED IN CODE / visual validation pending**.
- `BUG-001` overall runtime/compile validation: outstanding.
- `BUG-002` stale locale-hook import: **RESOLVED IN CODE**.
- `BUG-003` duplicate Backgammon SVG gradient id: **RESOLVED IN CODE**.

## Validation infrastructure

Branch-only `.github/workflows/foundation-web-check.yml` exists and is configured for:
- `npm ci`,
- shared package build,
- boundary check,
- web typecheck,
- web build.

The connector has not exposed a completed run for the latest branch commit. This is **not PASS**.

## LOCAL VISUAL REVIEW CHECKPOINT

**READY.**

Known high-impact static UI cleanup is now far enough along that another large code-only polish pass is lower value than running the branch locally.

The local review should now validate the things static inspection cannot prove:

1. `/fa/lobby` and `/en/lobby` shell direction, fonts and Header/Footer behavior.
2. FA/EN switch preserving the same logical page.
3. ~360px Header/Lobby/Profile/Tournaments layouts.
4. GameShell sizing and back navigation in both locales.
5. Tic-Tac-Toe, Chess, Vegas and Backgammon presentation in both locales.
6. Backgammon/Chess fixed LTR game geometry inside Persian RTL pages.
7. Tournament bracket horizontal behavior.
8. Footer + eNamad in both locales.
9. MUI component mirroring to determine whether `DEBT-020` actually requires an RTL Emotion cache/plugin.
10. Radius/surface hierarchy after the global 4px shape-base change.

Do not perform broad redesign during this local pass. Capture concrete visual/runtime defects and place them in the bug ledger for targeted correction.

## Validation status

- Build: NOT CONFIRMED
- Typecheck: NOT CONFIRMED
- Tests: NOT RUN
- Browser visual verification: NOT RUN
- Deployment: NOT RUN

Never report PASS without actual execution.

## Safety

- keep `main` untouched,
- keep governance branch untouched,
- no new branch without explicit user approval,
- no merge/deploy without explicit release authorization,
- do not duplicate Persian/English app trees,
- do not make presentation metadata authoritative for game rules/capability,
- do not destructively delete remaining graveyard candidates before consumer proof + executable validation.
