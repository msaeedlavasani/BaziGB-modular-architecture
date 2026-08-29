# BaziGB Platform Foundation

**Status:** Foundation audit complete; bilingual + shared-UI implementation active
**Working branch:** `refactor/platform-foundation-i18n-v3`
**Production baseline:** `main` (untouched)
**Governance source:** latest verified governance on `ai/autonomous-development-system-v1`

This is the canonical architecture/debt record for the platform-foundation refactor. Stage history lives in `docs/platform-foundation-progress.md`; continuation state lives in `docs/HANDOFF.md`.

## 1. Bilingual Architecture

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

Supported locales:
- `fa` — Persian / RTL / Vazirmatn-first
- `en` — English / LTR / Latin system stack

Game rules/state/IDs/API/database/realtime contracts remain language-neutral. User-facing copy, navigation, metadata, presentation formatting and managed presentation content are localized.

## 2. Locale Routing

Public localized URLs are active without duplicating the page tree:

```text
/fa/lobby           /en/lobby
/fa/profile         /en/profile
/fa/leaderboard     /en/leaderboard
/fa/tournaments     /en/tournaments
/fa/game/[gameId]   /en/game/[gameId]
/fa/games/[gameId]  /en/games/[gameId]
/fa/play/[roomId]   /en/play/[roomId]
/fa/login           /en/login
```

- middleware keeps localized URLs visible while rewriting internally to shared pages,
- root shell activates locale `lang`, `dir`, metadata, typography and theme direction,
- Header/Footer emit localized routes,
- Header provides explicit FA/EN switching while preserving the logical path,
- Admin remains locale-neutral.

## 3. Localization Foundation

Message domains currently include:
- `i18n/messages.ts`
- `i18n/profile.ts`
- `i18n/auth.ts`
- `i18n/leaderboard.ts`
- `i18n/tournament-detail.ts`
- `i18n/game-shell.ts`
- `i18n/language-switcher.ts`

Canonical client locale resolver: `hooks/useAppLocale.ts`.

The duplicate `i18n/useAppLocale.ts` was removed after consumer verification (`DEBT-014`).

## 4. Design System Alignment

`DESIGN_SYSTEM.md` is now **v2.2.0** and reflects both bilingual behavior and a canonical visual-shape hierarchy.

Current system rules include:
- Persian RTL / English LTR,
- locale-derived direction/typography,
- logical CSS instead of page-level left/right hacks,
- direction-independent identifiers/codes may remain LTR,
- 360px minimum mobile target,
- theme tokens over arbitrary/default MUI colors,
- global glow is not a default hover language,
- structural loading/empty/error patterns are shared only when they genuinely recur,
- canonical corner-radius hierarchy: compact controls `8px`, controls/inputs `10px`, small surfaces `12px`, cards/panels `16px`.

### Shape baseline

MUI numeric `sx` border-radius values multiply `theme.shape.borderRadius`. The previous `12px` base made common values such as `borderRadius: 3/4` render at 36/48px and produced over-rounded inconsistent surfaces.

The theme base is now **4px**:

```text
2   -> 8px
2.5 -> 10px
3   -> 12px
4   -> 16px
```

The theme exports `shapeScale` for explicit-pixel cases. Functional exceptions remain valid for circles, avatars, game pieces and specialized board geometry.

Theme cleanup also ensures:
- `warning` stays in Honey Bronze instead of MUI default orange,
- global Paper styling does not force visual elevation onto `elevation={0}` surfaces,
- non-interactive Cards do not globally lift/glow,
- Buttons/IconButtons expose consistent focus-visible behavior,
- reduced-motion preference is respected globally.

## 5. Managed Footer

Backward-compatible contract:

```text
legacy: footer          # Persian compatibility
new:    footer.fa
new:    footer.en
response: footer + footers.fa + footers.en
```

- no DB migration required,
- focused bilingual editor: `/admin/footer`,
- eNamad is visible in both Persian and English for now.

## 6. Game Presentation Metadata

`apps/web/src/lib/game-catalog.ts` is the canonical web presentation bridge with real consumers across Lobby/game/Profile/Tournament presentation.

Runtime rules/capabilities remain GameAdapter/server-owned.

## 7. Shared UI / Component Graveyard

Canonical by real use:
- `GameShell`
- `Dice3D`
- `Header`
- `Footer`
- `GameCard`
- `EmptyState`
- `LoadingSkeleton`
- focused `/admin/footer` editor
- game-specific boards remain game-specific

Remaining candidate:
- `Modal` — locale-neutral/token-aligned but no verified consumer; do not force adoption and do not delete before executable verification.

Graveyard rule remains: inspect → verify consumers → compare duplicate → migrate → validate → delete only proven dead code.

## 8. Shared GameShell

The canonical shell now:
- serves local/bot and multiplayer routes,
- localizes connection/room/match/rematch/back/waiting labels,
- uses locale-aware back direction,
- keeps room codes LTR,
- uses logical spacing,
- provides `lg` width for board-heavy games,
- separates utility header, primary title, secondary state and main board content,
- keeps winner treatment restrained and semantic.

## 9. Lobby

Lobby is now the bounded game-discovery surface only. It renders the canonical
catalog through `GameCard` and routes to the shared locale-aware Game Hub.
Create-room, bot, invite-code, recent-match and global active-room workflows no
longer live in Lobby.

### Shared Game Hub

`/[locale]/games/[gameId]` is one data-driven page for every catalog game. It
reuses `game-catalog`, room APIs and shared feedback components, and exposes:
- play with bot,
- create online room,
- join by invite code,
- active rooms filtered to the selected game.

Match-length settings appear only for Tic-Tac-Toe and Backgammon, matching the
existing supported online behavior. The active-room region has a fixed maximum
height and local scrolling, with structural loading, actionable empty and
retryable error states. Room chips show status only and do not repeat the game
name/icon already established by the page.

`DEBT-003` is resolved in code. `DEBT-009` is substantially mitigated.

## 10. Responsive/UI Hardening

### Header
- compact mobile navigation/control layout for 360px,
- accessible mobile icon navigation,
- localized language switcher,
- logical spacing and `aria-current`.

### Root layout
- global max-width/padding removed so each page/GameShell owns its proper content geometry,
- avoids double-padding and narrow board constraints,
- Persian webfont loads only for Persian locale.

### Tournaments list
- shared structural loading/empty states,
- theme-token CTA/progress/status treatment,
- localized login/detail links,
- restrained card hover treatment.

### Profile
`UI-001` is resolved in code:
- 1-column stats at xs, 2 at sm, 4 at md,
- mobile header stacks cleanly,
- profile hero compacts on narrow viewports,
- username/email wrap safely,
- locale-aware Lobby/login routes and back arrow,
- table overflow is contained inside history region,
- empty history uses canonical `EmptyState`.

### Multiplayer room
A stale deleted-module import was discovered and fixed (`BUG-002`). `/play/[roomId]` now:
- imports the canonical locale hook,
- uses explicit localized Lobby back route,
- uses semantic spectator/waiting/chat colors,
- removes unrelated raw blue chat color and heavy waiting-panel shadow,
- stacks chat composer on narrow screens,
- preserves actual realtime/game logic.

## 11. RTL Infrastructure Risk

### DEBT-020 — MUI/Emotion RTL style-cache verification

The app derives `html dir`, `theme.direction`, and touched product layouts use logical CSS. However MUI 5 + Emotion may require an RTL cache/plugin for components that emit physical CSS. `stylis-plugin-rtl` is not currently declared in the web package.

Current rule:
- do not claim full MUI RTL correctness from static code alone,
- do not change dependency/lockfile state without an executable install step,
- verify actual MUI mirroring at the later local run,
- add the Emotion RTL cache/plugin only if runtime validation confirms it is required or when lockfile-safe dependency installation is available.

This is an implementation/validation issue, not a product decision.

## 12. Bug / Debt Ledger

- `DEBT-001` global locale/direction — SUBSTANTIALLY MITIGATED; runtime validation pending.
- `DEBT-002` mixed-language Lobby — SUBSTANTIALLY RESOLVED.
- `DEBT-003` GameCard mismatch — RESOLVED IN CODE.
- `DEBT-004` singleton RTL theme coupling — MITIGATED; see `DEBT-020` for runtime MUI RTL verification.
- `DEBT-005` Footer single-locale — SUBSTANTIALLY MITIGATED.
- `DEBT-006` duplicate game presentation metadata — RESOLVED for primary consumers.
- `DEBT-007` locale routing/link dispersion — SUBSTANTIALLY MITIGATED; targeted remaining-link review continues.
- `DEBT-008` hard-coded game-entry copy — SUBSTANTIALLY RESOLVED.
- `DEBT-009` shared feedback primitive bypass — SUBSTANTIALLY MITIGATED in Lobby/Tournaments; targeted review continues.
- `DEBT-010` Tournament mixed-language presentation — SUBSTANTIALLY RESOLVED.
- `DEBT-011` Footer Web/Admin/Server coupling — SUBSTANTIALLY MITIGATED.
- `DEBT-012` Admin operational monolith — OPEN / NON-BLOCKING.
- `DEBT-013` game-catalog graveyard risk — RESOLVED.
- `DEBT-014` duplicate locale hook — RESOLVED.
- `DEBT-015` server/data-owned localization boundary — TRACKED.
- `DEBT-016` dead Footer logic in `/admin` — OPEN; focused editor is canonical, deletion pending safe validation.
- `DEBT-017` Persian hard-coded GameShell labels — RESOLVED IN CODE.
- `DEBT-018` missing visible language switcher — RESOLVED IN CODE.
- `DEBT-019` MUI warning/default hover-glow divergence — RESOLVED IN CODE.
- `DEBT-020` MUI/Emotion RTL cache/plugin verification — OPEN / RUNTIME-VALIDATION DEPENDENT.
- `DEBT-021` oversized/inconsistent MUI radius baseline — RESOLVED IN CODE; visual validation pending.
- `UI-001` Profile 360px density — RESOLVED IN CODE.
- `BUG-001` runtime/compile state — RESOLVED; package/web typechecks, boundaries, production build and local routes pass.
- `BUG-002` `/play` imported deleted `i18n/useAppLocale` — RESOLVED AND VALIDATED by web typecheck/build.
- `BUG-004` initial web typecheck could not resolve workspace package declarations before package build — RESOLVED by the required `build:packages` ordering; subsequent web typecheck passed.
- `BUG-005` Lobby game cards received focus but client-handler navigation did not fire reliably — RESOLVED by rendering discovery cards as real locale-aware links; browser flow to Hub and room creation passed.
- `BUG-006` theme spacing base was 4px while application `sx` values and intended page geometry assumed 8px — RESOLVED in the design-system source of truth; `PageContainer` now enforces canonical page gutters/padding.
- `BUG-007` GameShell composition repeated game identity/turn state and left settings as an unbounded floating row — RESOLVED through the canonical GameShell composition contract and shared settings toolbar.
- `BUG-008` running `next build` while `next dev` was active corrupted their shared `.next` artifacts and caused missing `vendor-chunks/@mui.js` at runtime — RESOLVED by stopping dev, moving the generated cache aside and restarting cleanly. Never run web build concurrently with web dev in this checkout.
- `BUG-009` GameShell settings and primary surfaces used independent widths, leaving compact boards visually detached with wasted lateral space — RESOLVED through catalog-owned `surfaceMaxWidth` and one shared GameShell layout track.
- `BUG-010` responsive behavior depended on named breakpoints, fixed heights and per-game pixel widths, requiring screenshot-led correction — RESOLVED at the shared composition layer with fluid spacing, container-driven grids, intrinsic game geometry, CTA hierarchy and short-landscape GameShell mode. `BUG-009`'s pixel-width implementation is superseded by this rule.
- `ENV-001` default npm cache contains root-owned files — OPEN / LOCAL ENVIRONMENT; validation uses `/private/tmp/bazigb-npm-cache` without changing user ownership.
- `ENV-002` port 3000 was occupied in this workspace — RESOLVED; dev server now runs on 3000.
- `ENV-003` watch-mode dev server cannot compile until its generated Prisma client is restored; this pre-existing server/tooling issue is outside the UI/IA scope.
- `ENV-004` Next dev watcher previously hit the local open-file limit (`EMFILE`) — RESOLVED at the current runtime checkpoint; hot reload is ready on port 3000.
- `ENV-005` repeated Socket.IO polling proxies reset while the responsive browser matrix reloaded game routes — OPEN / BACKEND RUNTIME; HTTP pages remained healthy and no gameplay protocol change was made.

## 13. Validation Infrastructure

A targeted branch-only workflow exists at `.github/workflows/foundation-web-check.yml` with:
- `npm ci`,
- shared package build,
- boundary check,
- web typecheck,
- web build.

Local validation on 2026-08-25: dependency install, shared package build,
boundary check, web typecheck and optimized web build passed.

## 14. Current UI Cleanup Order

The IA refactor is implemented and ready for local review after the current web
build/dev-server checkpoint.

## 15. Safety

- `main`: untouched.
- Governance branch: untouched.
- Merge: not performed.
- Deployment: not performed.
- Shared package build, boundaries and web typecheck: PASSED locally on 2026-08-25.
- Optimized web build: PASSED locally on 2026-08-25.
- Dev-server status: see current HANDOFF.
- Never report PASS from static inspection alone.

## 16. Game Rules Boundary

The canonical rules architecture and change workflow are versioned in
[`game-rules-contract.md`](./game-rules-contract.md). Game packages own pure
legality, transitions, invariants, serialization and undo policy; the server
owns authoritative online sequencing and persistence; UI layers only present
and submit canonical actions.

`BUG-014` local Backgammon state was ephemeral, allowing refresh to regenerate
an unresolved roll. **RESOLVED IN CODE AND BROWSER-VALIDATED.**

`BUG-015` generic undo history treated random rolls like reversible checker
moves. **RESOLVED IN CODE** through the game-owned `canUndoMove` contract on
both local and server paths; package/server validation is required before final
closure.

`BUG-016` Backgammon hit/bar continuity lacked an explicit conservation
contract. **RESOLVED IN CODE** with direct move validation, bar serialization
coverage and fifteen-checker invariants; rendered multiplayer validation remains.

`BUG-017` Backgammon automatically crossed from one completed game into the next,
allowing Undo and result presentation to blur the boundary. **RESOLVED IN CODE AND
TARGETED TESTS** through explicit `roundEnd`, acknowledgement-driven next-game
transition, adapter ownership and Undo-history sealing.

`ENV-006` a stale nested Vitest 4 installation shadowed the repository's declared
Vitest 1.6 runner in the server workspace. **RESOLVED RECOVERABLY FOR THE CURRENT
CHECKOUT**; the incompatible directory was moved to `/private/tmp`. Two unrelated,
pre-existing Admin controller tests still need their `roomService` mocks updated.
