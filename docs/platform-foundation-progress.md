# Platform Foundation — Implementation Progress

This is the stage-by-stage execution log. Architecture/debt lives in `docs/platform-foundation.md`; current continuation state lives in `docs/HANDOFF.md`.

## 2026-08-24 — Consumer migration preparation
- Added canonical `apps/web/src/hooks/useAppLocale.ts`.
- Locale-neutral routes used Persian during the pre-route migration phase.
- Validation: NOT RUN.

---

## 2026-08-24 — `/game/[gameId]`
- Removed page-local game title/chip maps.
- Uses game catalog + typed game-shell messages.
- Added safe `isWebGameId()` route guard.
- Validation: NOT RUN.

---

## 2026-08-24 — `/play/[roomId]` initial migration
- Removed page-local title/chip maps and game allowlist duplication.
- Uses catalog + multiplayer messages.
- Localized waiting/spectator/turn/winner/chat/room-share copy.
- Runtime/socket/game behavior preserved.
- Validation: NOT RUN.

---

## 2026-08-24 — Lobby localization migration
- Removed local status/game metadata registries.
- Uses `WEB_GAME_IDS`, catalog title/guard helpers and centralized route builders.
- Localized page-owned copy/results/errors/actions/dates.
- Initial migration intentionally preserved inline card/loading/empty UI for later graveyard cleanup.
- Validation: NOT RUN.

---

## 2026-08-24 — Tournaments list localization
- Migrated client-owned list/filter/status/error/action copy.
- Dates now locale-aware.
- API-owned tournament name/description/prize/join message remain verbatim.
- Identified tournament data localization as a separate content boundary.
- Validation: NOT RUN.

---

## 2026-08-24 — Profile localization
- Added `apps/web/src/i18n/profile.ts`.
- Profile uses canonical locale resolver.
- Removed hard-coded page RTL.
- Localized profile editing/password/stats/history/results/errors.
- Game history uses canonical game titles for recognized IDs.
- Date presentation switches `fa-IR` / `en-US`.
- Validation: NOT RUN.

---

## 2026-08-24 — OTP/Login
- Added `apps/web/src/i18n/auth.ts`.
- Migrated client-owned login/OTP/new-user copy and validation fallback messages.
- Phone/verification-code inputs intentionally remain LTR.
- Iranian `09xxxxxxxxx` mobile-number constraint remains product/auth behavior.
- Validation: NOT RUN.

---

## 2026-08-24 — Leaderboard
- Added `apps/web/src/i18n/leaderboard.ts`.
- Migrated title/subtitle/search/errors/podium/rating/rankings/stats/current-user/empty-state copy.
- Touched physical alignment migrated to logical layout properties.
- Validation: NOT RUN.

---

## 2026-08-24 — Locale route activation
- Activated `/fa/*` and `/en/*` through middleware rewrites to one shared page tree.
- Root layout receives active locale for `lang`, `dir`, metadata, font and MUI direction.
- Header/Footer emit localized routes.
- Removed duplicate unused `i18n/useAppLocale.ts`; `hooks/useAppLocale.ts` is canonical.
- GitHub Actions lookup found no workflow run at that checkpoint.
- Validation: NOT RUN.

---

## 2026-08-24 — Tournament detail / bracket
- Added localized detail/bracket messages and locale-aware date/status/action/round presentation.
- Kept bracket geometry intentionally LTR while surrounding presentation remains locale-aware.
- eNamad policy resolved: visible in both `fa` and `en` for now.
- Validation: NOT RUN.

---

## 2026-08-24 — Admin bilingual Footer editor
- Added focused `/admin/footer` editor for independent `footer.fa` / `footer.en` content.
- Existing `/admin` still contains dead legacy Footer editor logic with no rendered editor UI (`DEBT-016`).
- Destructive cleanup remains deferred until executable validation.
- Validation: NOT RUN.

---

## 2026-08-24 — Shared UI / visual foundation cleanup
- `GameCard` redesigned as canonical selectable game tile with selected/focus/reduced-motion states.
- `EmptyState` upgraded to reusable product-level empty-state panel.
- `LoadingSkeleton` generalized into a configurable structural grid.
- `Modal` made locale-neutral/design-token aligned but remains an unused candidate.
- `GameShell` localized and corrected for RTL/LTR back direction and logical spacing.
- Added visible FA/EN Header switcher while preserving current logical path.
- Validation: NOT RUN.

---

## 2026-08-24 — Lobby canonical UI migration
- Lobby migrated to `GameCard`, `LoadingSkeleton`, and `EmptyState` instead of page-local duplicates.
- Retryable errors expose retry actions.
- Game/room navigation uses localized route builders.
- Room code remains LTR and join arrow follows locale.
- Mode controls expose semantic pressed/focus states.
- Mobile hierarchy adapts for narrow viewports.
- Validation: NOT RUN.

---

## 2026-08-24 — GameShell visual hierarchy pass
- Expanded shell content width to `lg` for board-heavy games.
- Separated utility header from primary game title.
- Moved connection/turn/game/match state into secondary hierarchy.
- Added explicit centered main game-content region.
- Winner state became a restrained semantic panel.
- Room code explicitly remains LTR.
- Validation: NOT RUN.

---

## 2026-08-24 — Theme interaction cleanup
- Defined Honey Bronze `warning` palette instead of MUI default orange.
- Removed global button hover glow.
- Removed forced global Paper shadow.
- Card lift/glow became opt-in.
- Reduced-motion/focus treatment strengthened.
- Tracked as `DEBT-019` and resolved in code pending executable validation.

---

## 2026-08-24 — Root layout surface cleanup
- Removed global `maxWidth: 1200` + fixed main padding so pages/GameShell own content geometry.
- Avoided double-padding and narrow board constraints.
- Persian font stylesheet loads only for `fa`.
- Validation: NOT RUN.

---

## 2026-08-24 — Header 360px hardening
- Reduced xs toolbar spacing and mobile brand size.
- Primary nav uses compact icon targets on mobile.
- Language/sound/profile controls compact at mobile widths.
- Active nav/profile expose `aria-current`.
- Touched physical spacing migrated to logical spacing.
- Validation: NOT RUN.

---

## 2026-08-24 — Design System bilingual sync
- `DESIGN_SYSTEM.md` upgraded to v2.1.0 for locale-derived direction/typography, 360px requirements, feedback reuse, palette discipline and interaction rules.
- Static inspection identified `UI-001`: Profile stats were too dense at xs.

---

## 2026-08-24 — Tournaments shared feedback / visual pass
- Tournaments list uses `LoadingSkeleton` and `EmptyState`.
- Retryable load failure has explicit retry.
- Removed hard-coded orange CTA/progress treatment.
- Login/detail navigation uses localized route helpers.
- Reduced hover decoration to border emphasis.
- Validation: NOT RUN.

---

## 2026-08-24 — Targeted branch validation workflow
- Added `.github/workflows/foundation-web-check.yml` for this branch only.
- Intended checks: `npm ci`, shared package builds, architecture-boundary check, web typecheck, web build.
- A completed current status has not yet been confirmed by the connector.
- No PASS claimed.

---

## 2026-08-24 — Profile 360px + route hardening
- Resolved `UI-001` in code: 1/2/4-column stats across xs/sm/md.
- Mobile header stacks rather than forcing one row.
- Hero/avatar compacts and text wraps safely.
- Lobby/login navigation explicitly locale-scoped.
- History-table overflow is contained locally.
- Empty history uses canonical `EmptyState`.
- Validation: NOT RUN.

---

## 2026-08-24 — Multiplayer room UI hardening + compile-risk fix
- Found and fixed stale import of deleted `i18n/useAppLocale`; canonical hook is `hooks/useAppLocale` (`BUG-002`).
- GameShell back route is explicitly localized.
- Spectator/waiting/chat colors use theme semantics.
- Removed heavy waiting-panel shadow.
- Chat composer stacks on narrow mobile widths.
- Validation: NOT RUN.

---

## 2026-08-24 — Shape / corner-radius consistency pass
- MUI shape base changed from 12px to 4px so numeric `sx` radii become predictable rather than 36/48px on common surfaces.
- Added `shapeScale` and aligned Button/TextField/Select/Chip explicit radii.
- Numeric hierarchy now maps `2=8px`, `2.5=10px`, `3=12px`, `4=16px`.
- Specialized game geometry/circles remain exceptions.
- `DESIGN_SYSTEM.md` upgraded to v2.2.0 with formal radius hierarchy.
- `DEBT-021`: RESOLVED IN CODE / visual validation pending.
- Validation: NOT RUN.

---

## 2026-08-24 — Game-board static UI audit: Tic-Tac-Toe / Chess / Backgammon

### Tic-Tac-Toe
Found that the game-specific board still bypassed the bilingual/theme work even though GameShell was localized.

Fixed:
- removed board-level hard-coded Persian turn/winner copy,
- board uses active locale game-shell labels,
- replaced unrelated hard-coded blue player styling with semantic theme colors; X/O symbols still provide non-color distinction,
- cells are actual keyboard-focusable buttons rather than clickable generic boxes,
- board surfaces derive from theme colors,
- focus-visible/reduced-motion treatment added,
- radius follows canonical shape scale.

### Chess
Static review confirmed:
- `direction: ltr` is intentional game geometry,
- responsive board wrapper already uses `width: 100%` + `maxWidth: 560`,
- wood/square colors are specialized board-art styling and are not treated as generic app palette leakage.

### Backgammon
Static review confirmed:
- board layout intentionally uses LTR and physical point geometry inside the game surface,
- wrapper already uses `width: 100%` + `maxWidth: 960`,
- game-art wood/leather/checker colors remain specialized visual assets/styles.

New finding:
- `BUG-003`: SVG `<defs>` declares `id="bgPtLight"` twice. This duplicate ID is non-blocking from static evidence but should be cleaned during the next safe Backgammon edit/validation pass.

Validation: NOT RUN.

---

## 2026-08-25 — Game-discovery IA and shared Game Hub

- Header contract retained as a full-width, bottom-border-only AppBar with a centered max-width toolbar and fixed physical composition: navigation right, brand center, controls left.
- Header icon/text spacing was moved to logical inline spacing; the circular FA/EN control remains centered.
- Footer removed shell-navigation links, added Privacy, and now mirrors Brand/legal/eNamad across FA/EN while stacking on mobile; eNamad remains in both locales.
- Lobby was reduced to catalog-driven game discovery only.
- Added shared `games/[gameId]` Hub with locale-aware routes, bot/create/join actions, supported match settings and active rooms filtered to the selected game.
- Active-room height is constrained with local scrolling; loading/empty/error states are explicit and room status chips do not repeat game identity.
- Middleware, route builders and the existing path-preserving language switch support the new route.
- Gameplay engines and realtime/server protocol were not changed.
- Validation: `npm ci` (temporary cache), shared package build, boundaries, web typecheck and optimized web build PASS.
- Ledger: `BUG-004` resolved by package-build ordering; `ENV-001` records the root-owned default npm cache.
- Local runtime ledger: `ENV-002` port 3000 occupied, `ENV-003` missing generated Prisma client for server watch mode, and `ENV-004` Next watcher `EMFILE`. No unrelated process was terminated and no server/protocol code was changed.
- A production-build preview is running on port 3100; FA Hub, EN Hub and FA Lobby returned HTTP 200 with locale-specific Hub copy.

## 2026-08-25 — Port 3000 dev-server checkpoint

- Port 3000 became available and the official web dev script started successfully with hot reload.
- `/fa/games/chess`, `/en/games/chess` and `/fa/lobby` returned HTTP 200; FA/EN Hub copy was verified in the rendered HTML.
- The temporary port-3100 production preview was stopped after the dev server passed.
- `ENV-002` and `ENV-004` are resolved for the current runtime session.

## 2026-08-25 — Game-card navigation and room-flow fix

- Reproduced `BUG-005`: a Lobby game card received focus but did not reliably navigate through its click handler.
- `GameCard` now supports semantic Next links and Lobby cards expose real localized Hub URLs.
- Generated the local Prisma client; server typecheck passed. The already-running room API on port 3001 returned HTTP 200.
- Browser validation passed end to end: Lobby → Chess Hub → Create Online Room → `/fa/play/2AXPF`; the room displayed connected/waiting state with one of two seats occupied.
- Gameplay engine and realtime/server protocol were unchanged.

## 2026-08-25 — Canonical spacing-system correction

- Root cause `BUG-006`: theme spacing used a 4px base while pages/components were authored and reviewed as if numeric MUI spacing used the standard 8px base.
- Restored the canonical 8px theme spacing scale and documented its exact numeric mapping in `DESIGN_SYSTEM.md`.
- Added shared `PageContainer` with semantic narrow/content/wide widths and canonical responsive page gutters/block padding.
- Migrated Lobby and all Game Hub states to `PageContainer`; removed their feature-local outer spacing contracts.
- Runtime measurement passed: Game Hub is 16px/24px at 360px and 32px/48px at desktop for inline/block spacing, matching the canonical contract.
- 360px overflow audit passed for Lobby, Game Hub, Profile, Leaderboard and Tournaments (`scrollWidth === innerWidth === 360`).
- Web typecheck, architecture boundaries and optimized web build passed. Build emitted only the existing non-blocking Google Fonts optimization warning.

## 2026-08-25 — GameShell visual-integration correction

- Screenshot review identified composition debt beyond raw spacing: repeated game identity, repeated turn status and an unbounded settings row.
- Added the canonical GameShell hierarchy to `DESIGN_SYSTEM.md`.
- Removed repeated game identity chips from shared local/multiplayer shells.
- Removed Tic-Tac-Toe's duplicate below-board turn label; score remains as secondary information.
- Settings now render in one restrained, responsive, content-sized shared toolbar up to 880px.
- Game rules, engine state and server protocol were unchanged.

## 2026-08-25 — Next dev/build artifact recovery

- Reproduced `BUG-008`: concurrent build/dev use of `apps/web/.next` produced missing vendor chunks including `@mui.js`.
- Stopped dev, moved the corrupt generated cache recoverably to `/private/tmp/bazigb-next-corrupt-20260825`, and restarted dev from a clean cache.
- Browser verification of `/fa/games/tic-tac-toe` passed with the complete Hub, active rooms and no console errors.
- Operational rule: stop web dev before `build:web`; restart dev after the build. Do not treat `next build` and `next dev` as safe concurrent writers.

## 2026-08-25 — Game surface/toolbar track unification

- Screenshot review identified `BUG-009`: Tic-Tac-Toe settings used a ~600px toolbar while the board was hard-coded to 340px.
- Added presentation-only `surfaceMaxWidth` to the canonical game catalog: Tic-Tac-Toe 600, Chess 560, Backgammon/Vegas 960.
- GameShell now applies the selected game's single centered track to both settings and primary content in local and multiplayer routes.
- Tic-Tac-Toe fills the shared track instead of declaring a private width.
- Browser measurement passed: desktop toolbar/board are both exactly 600px at x=420; 360px viewport toolbar/board are both 328px at x=16 with no overflow.

## 2026-08-25 — Responsive-system correction after visual-review feedback

- Reclassified the pixel-based game track and named-breakpoint grids as an insufficient responsive model (`BUG-010`).
- Removed per-game `surfaceMaxWidth`; the catalog now records only intrinsic board geometry through optional `surfaceRatio`.
- GameShell derives size from actual inline space, dynamic viewport block space and one shared comfort cap.
- Short landscape GameShell composition now places supporting title/settings beside the primary surface. At 667×375 the Tic-Tac-Toe board is fully inside the initial viewport (y=124, bottom=371); at 844×390 it is y=124, bottom=386.
- Added content-driven `ResponsiveGrid` (`auto-fit/minmax`, container units) and migrated Lobby and Hub actions.
- Hub create-room remains the primary CTA and spans the intermediate two-column layout; Bot and join-by-code remain paired secondary actions.
- Replaced fixed page/footer spacing with fluid `clamp()` rules. Footer height at 844×390 is 155px and at 1440×900 is 185px.
- Active-room scrolling now uses logical block size with a viewport-relative cap instead of a standalone 420px value.
- Automated viewport matrices covered 320/360 portrait, 667/844 landscape, 768/1024 medium and 1440 desktop with zero horizontal overflow.

---

## 2026-08-27 — Game-rules contract and exploit regressions

- Added a versioned Game Rules contract separating pure rules, invariants,
  undo policy, AI, server authority, persistence and presentation.
- Backgammon now rejects a second unresolved roll and exposes game-owned undo
  eligibility; rolls no longer enter local or server undo history.
- Local bot state survives refresh in session storage. Browser validation
  confirmed the unresolved dice remain and the Roll action does not reappear.
- Direct Backgammon moves are validated against canonical legal moves. Hit
  serialization and fifteen-checker conservation now have regression coverage.
- Replaced the external Google Fonts request with repository-installed,
  self-hosted variable Vazirmatn so typography no longer depends on international
  network access.
- Header side groups now occupy equal physical slots around the centered brand.
  Footer container rules were corrected to query their parent container.

## Current static risk before local review

### DEBT-020 — MUI/Emotion RTL style-cache verification
The app derives locale direction and touched layouts use logical CSS, but actual MUI 5/Emotion mirroring may still require an RTL cache/plugin. Do not change dependencies without an executable lockfile-safe install. Verify at local run.

### Visual review policy
User preference remains: **do not request local run yet**. Continue static high-impact UI cleanup first.

### Next
1. finish Tournament detail + local game-entry narrow-screen/logical-route audit,
2. continue Vegas/Backgammon surrounding-control overflow scan without redesigning game art,
3. normalize only proven recurring feedback patterns,
4. prepare safe Admin dead Footer cleanup,
5. static known-bug/compile-risk pass including `BUG-003`,
6. then declare the local visual-review checkpoint.

## 2026-08-26 — Backgammon gameplay findings captured during Design System Pilot

These findings were observed during UI acceptance but are not authorized as
incidental Design System fixes. They require a separate gameplay-interaction and
rule-correctness scope with engine/server/client evidence.

### BUG-011 — Player perspective and ownership are unclear

- The Backgammon board uses one fixed LTR geometry and does not visibly orient
  the local player's home/off direction toward that player.
- Both players can receive the same apparent perspective, and the opening state
  does not explain which checker color belongs to the local player or where that
  player bears off.
- Required investigation: player-relative coordinate projection versus engine
  coordinates, online/local identity mapping, home-board and off-tray cues,
  ownership legend, and parity between both clients.

### BUG-012 — Mobile destination interaction feels delayed or requires repeated taps

- User-observed on a narrow mobile viewport when selecting a checker destination.
- Candidate causes include undersized or overlapping hit targets, selection-state
  latency, automatic forced-move effects, event competition, and render/update
  delay. No cause is validated yet.
- Required evidence: touch-target geometry, event trace, state-transition timing,
  and a repeatable mobile interaction test before changing move logic.

### BUG-013 — Local Undo may restore a state that permits another dice roll

- User-observed: Undo can allow the same player to roll again unless the opponent
  has already rolled.
- The local route stores both Backgammon `roll` and `move` states in one generic
  undo stack. Correct behavior must be specified before implementation: whether
  Undo reverses a checker move only, the full turn, or a pre-roll decision.
- Required evidence: product rule, engine-state transitions, deterministic dice
  and randomness policy, multiplayer parity, and regression tests. Do not patch
  the button state alone.

## 2026-08-27 — Second Design System human gate rejected

- Human review rejected the corrected Candidate because overflow-only checks did
  not protect mobile information density, task priority or game-surface quality.
- Root causes confirmed: ActionCard preserved desktop anatomy on mobile;
  Backgammon checkers imposed a 26px minimum; StatusCluster grouped legacy Chips
  without owning their internal anatomy; Tic-Tac-Toe repeated GameShell score;
  and Brand plus Lobby navigation duplicated one destination.
- Added narrow ActionCard anatomy and a 2x2 compact Lobby grid. At 320x700 all
  four Lobby games are visible by y=491 and all three Game Hub play modes are
  visible by y=689, with `scrollWidth === innerWidth === 320`.
- Mobile GameShell settings now use a collapsed native disclosure so the board is
  prioritized. The 320px Backgammon render contains all 30 checker elements
  between x=30.55 and x=268.33 with no horizontal overflow.
- Added direction-safe StatusPill and removed the duplicate Tic-Tac-Toe score.
- Removed the Header Lobby item; the centered brand remains the single Lobby entry.
- Re-themed the Backgammon surface toward the shared midnight/bronze/ivory visual
  language and produced a four-game concept board. Art direction and richer game
  marks remain a human-gated Candidate decision, not a shipped asset.

## 2026-08-27 — Backgammon rules-first vertical slice

- Added a sourced package-level rules dossier and machine-readable rules profile.
- Replaced automatic game rollover with explicit `roundEnd` acknowledgement and
  an adapter-owned `startNextGame` transition shared by local and online flows.
- Sealed Undo at roll, game and match boundaries; refresh cannot regenerate an
  unresolved roll or reopen a completed game.
- Added target-point match settings, single/gammon/backgammon scoring, cube reset,
  Crawford and dead-cube behavior. The UI only exposes settings declared by the
  Backgammon profile.
- Made bar ownership and counts visible while retaining canonical package state.
- Validation: Backgammon 29/29 tests; server gameplay gateway 8/8 tests; package
  build, boundaries, server/web typechecks, design-system and governance checks
  and optimized web build passed. The Persian local-game smoke had RTL direction,
  no horizontal overflow and no console errors. Full server suite is not green
  because two pre-existing Admin controller tests omit required `roomService` mocks.
- Remaining sourced rule scope: resignation, dedicated opening roll and optional
  federation variants. These are documented limitations, not implicit UI guesses.
- Header redesign, richer game marks and other game audits remain outside this
  approved vertical slice.

## 2026-08-28 — Counter localization and bounded borne-off anatomy

### BUG-014 — Backgammon checker counters used inconsistent thresholds and digits

- Human evidence showed the off tray growing up to eight marks, showing a count
  only above eight, and rendering raw Latin digits in Persian. Point-stack counts
  also bypassed the locale formatter.
- Point, bar and off counts now share one locale-aware formatter. Persian renders
  Persian digits and English renders Latin digits at every count.
- Each occupied off tray now shows a count from the first borne-off checker and
  renders at most three decorative marks, so its geometry is bounded from 1–15.
- Validation: localized-counter tests 2/2, Web typecheck, Design System check and
  diff check passed. Human visual acceptance remains pending.
- Recurrence control: `BUG-008` build/dev collisions are now prevented by the
  isolated `.next-verify` validation output rather than a handoff warning alone.

### BUG-015 — Doubling cube collided with captured checkers on the bar

- Human evidence showed the accepted cube sharing the same central lane as Bar
  checkers and obscuring their count and ownership.
- The central band now has independent Bar and Cube Dock lanes. The unowned cube
  is centered; player one ownership docks at the bottom and player two at the top.
- Cube values use the same locale-aware number formatting as board counters.
- Validation: Cube Dock tests 2/2, localized-counter tests 2/2, Web typecheck,
  Design System check and diff check passed. Human visual acceptance is pending.
- The standard mandatory-dice rule remains enabled after verification against
  the U.S. Backgammon Federation rules; no undocumented House Rule was added.
- Human review rejected the side-by-side Cube lane. The revised anatomy keeps a
  single Bar: top-owner Cube precedes top captured checkers; bottom-owner Cube
  follows bottom captured checkers. Unknown ownership hides the Cube.

### PI-BG-012 — Forced bear-off assistance

- When the rules package exposes exactly one valid next move and that move bears
  off a checker, local play now auto-drafts it. Any ambiguity or non-bear-off move
  remains manual.
- Auto-drafted moves remain in the current turn transaction and are undoable
  until explicit End Turn.
- Initial human acceptance failed because auto-draft ran only inside Roll/Move
  handlers. The lifecycle now reconciles restored, refreshed and indirectly
  updated transactions without requiring a new click.
- A human retest exposed three lifecycle gaps: equivalent forced orders could
  wait unnecessarily, Undo immediately replayed an automatic move, and the
  fifteenth borne-off checker still waited for End Turn. The controller now
  converges only bear-off-only chains with an identical final state, suppresses
  auto-play after Undo until a new interaction, clears that suppression on
  refresh, and commits a terminal automatic draft immediately.
- Validation: local turn-controller tests 9/9, including refresh-scoped
  suppression and the reported forced five-die scenario; targeted tests 45/45,
  Backgammon tests 34/34, Web typecheck and diff check passed. Human lifecycle
  and terminal-completion retest remains pending.
