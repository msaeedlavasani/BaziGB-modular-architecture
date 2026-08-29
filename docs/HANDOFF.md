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
/fa/games/...      /en/games/...
/fa/play/...       /en/play/...
/fa/login          /en/login
```

- middleware rewrites localized URLs to shared pages,
- root shell activates locale language/direction/theme/font/metadata,
- Header/Footer emit localized routes,
- Header exposes FA/EN switching while preserving logical path,
- local/bot game back navigation now remains inside the active locale,
- game discovery routes to one shared, locale-aware Game Hub per catalog game,
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

### Information architecture / Game Hub
- Lobby is game discovery only; create-room, bot, invite-code and global active-room workflows were removed.
- `games/[gameId]` is a shared data-driven Hub using the canonical game catalog and room API client.
- Each Hub offers bot play, online room creation, invite-code entry and only that game's active rooms.
- Match settings appear only for currently supported Tic-Tac-Toe/Backgammon flows.
- Active rooms are height-constrained with local scrolling and explicit loading/empty/error states.
- Middleware and locale/path-preserving language switching cover the new route.
- Gameplay engines and server realtime protocol were not changed.

### Global shell / theme
- Header is a full-width bottom-border-only AppBar with centered max-width inner toolbar, independent mobile/desktop treatment and fixed physical nav-right/brand-center/controls-left composition.
- Visible FA/EN switcher preserves logical path.
- Root no longer imposes duplicate global max-width/padding on every page/game.
- Persian font stylesheet only loads for Persian requests.
- Honey Bronze warning palette replaces default MUI orange.
- Global Button/Card/Paper decorative glow/shadow behavior was reduced.
- Focus-visible and reduced-motion behavior strengthened.
- Radius hierarchy normalized.
- Footer is minimal and mirrored: FA Brand right/legal center/eNamad left; EN is the reverse; mobile stacks. Lobby/Leaderboard/Tournaments links are excluded and eNamad remains in both locales.

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
- `BUG-001` overall runtime/compile validation: **RESOLVED; executable checks pass**.
- `BUG-002` stale locale-hook import: **RESOLVED AND VALIDATED**.
- `BUG-003` duplicate Backgammon SVG gradient id: **RESOLVED IN CODE**.
- `BUG-004` pre-package-build web type resolution failure: **RESOLVED by validation ordering**.
- `BUG-005` Lobby game-card navigation handler was unreliable: **RESOLVED with semantic localized links; end-to-end browser flow passed**.
- `BUG-006` global spacing scale mismatch (theme 4px vs authored 8px assumptions): **RESOLVED at the design-system/theme source; Lobby/Game Hub use canonical `PageContainer`**.
- `BUG-007` GameShell visual hierarchy duplicated identity/turn and floated settings: **RESOLVED through the shared composition contract and settings toolbar**.
- `BUG-008` concurrent `next build`/`next dev` corrupted shared `.next` vendor chunks: **RESOLVED; stop dev before build and restart it afterward**.
- `BUG-009` settings/board width mismatch created wasted lateral space: **RESOLVED through catalog-owned surface widths and a shared GameShell track**.
- `BUG-010` screenshot-led/fixed-breakpoint responsive behavior: **RESOLVED at the shared layer; per-game pixel widths were removed in favor of intrinsic ratios, dynamic viewport sizing, container-driven grids and a short-landscape composition**.
- `ENV-001` root-owned default npm cache: **OPEN local-environment issue**; use `npm ci --cache /private/tmp/bazigb-npm-cache`.
- `ENV-002` port 3000 occupied: **RESOLVED**; web dev server is now running on 3000.
- `ENV-003` server watch compile lacks generated Prisma client: **OPEN pre-existing tooling issue**; no server/protocol edits made.
- `ENV-004` Next dev watcher open-file limit: **RESOLVED at current runtime checkpoint**.
- `ENV-005` Socket.IO polling proxy resets during repeated responsive-route reloads: **OPEN backend-runtime observation**; HTTP UI routes stayed healthy.

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

## Validation status (2026-08-25)

- Dependency install: PASS with temporary npm cache (617 packages; audit reported 31 existing vulnerabilities).
- Shared package build: PASS.
- Architecture boundaries: PASS.
- Web typecheck: PASS after shared package build.
- Web build: PASS (`next build`, including `/games/[gameId]`).
- Spacing-system validation: PASS — canonical 8px theme scale; Hub measured at 16px/24px mobile and 32px/48px desktop inline/block spacing.
- 360px overflow audit: PASS for Lobby, Game Hub, Profile, Leaderboard and Tournaments.
- Responsive viewport matrix: PASS — 320/360 portrait, 667/844 landscape, 768/1024 medium and 1440 desktop have zero horizontal overflow; Tic-Tac-Toe is fully visible in the initial viewport at both tested landscape-phone sizes.
- Runtime route smoke: PASS — `/fa/games/chess`, `/en/games/chess`, `/fa/lobby` returned HTTP 200; localized Hub copy verified.
- Interactive room flow: PASS — Lobby game link → Chess Hub → create room → localized `/play/2AXPF`, connected and waiting for opponent.
- Server typecheck after Prisma client generation: PASS; existing room API on port 3001 returned HTTP 200.
- Refresh-ready hot-reload preview: `http://localhost:3000/fa/lobby` (official web dev script; process left running).
- Web build safety: never run `build:web` while `dev:web` is active in the same checkout; both write `apps/web/.next`.
- Port-3100 temporary production preview: stopped after the port-3000 dev server passed.
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

## 2026-08-27 — Current rules/responsive checkpoint

- Canonical rules document: `docs/game-rules-contract.md`.
- Local Backgammon refresh preserves unresolved dice; browser regression passed.
- Backgammon rolls are non-undoable by game-owned policy in web and server.
- Hit/bar state and checker conservation have package regression tests.
- Persian Vazirmatn is self-hosted from `@fontsource-variable/vazirmatn`; no
  runtime Google Fonts dependency remains.
- Header uses equal physical side slots; Footer uses parent container queries.
- Final package/boundary/typecheck/build suite passed after stopping the web dev
  server; the refresh-ready dev server was restarted at `http://localhost:3000`.

## 2026-08-27 — Backgammon vertical-slice handoff

- The approved rules-first Backgammon slice is implemented; no branch, merge,
  deployment, push or gameplay-asset redesign was performed as part of it.
- Canonical completion is explicit: `playing → roundEnd → acknowledged next game`,
  or `playing → finished` for a completed match/single game.
- Local and online paths use the adapter's optional `startNextGame` capability.
- Undo cannot reverse a roll or cross game/match completion.
- Target-point settings, score multipliers, cube reset, Crawford and dead-cube
  restrictions are package-owned and covered by regression tests.
- Executed validation: Backgammon 29/29; gateway 8/8; package build, boundaries,
  server/web typechecks, optimized web build, design-system/governance checks and
  diff whitespace check passed.
- Runtime smoke: `/fa/game/backgammon` loaded RTL at 1280px with no horizontal
  overflow or console errors. Dev remains refresh-ready on localhost port 3000.
- Known test limitation: the complete server suite has two unrelated existing
  Admin controller failures due to missing `roomService` mocks. Do not report the
  full server suite as passing.
- Known rules limitations are versioned in `packages/games/backgammon/RULES.md` and
  `docs/game-rules-contract.md`; do not market this as complete tournament rules.
- Next human gate: accept the game-completion/next-game experience, then separately
  approve either the Header composition track or the next game's rules audit.

## Active-state routing

Do not reconstruct the backlog from this historical handoff. Resume from
`ai/current-state.json`, select a route in `ai/retrieval-manifest-v1.json`, and
resolve task state and priority only through `ai/work-registry-v1.json`.
