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
