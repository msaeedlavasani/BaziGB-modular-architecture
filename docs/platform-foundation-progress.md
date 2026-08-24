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

Lobby was migrated to the shared product primitives instead of keeping page-local duplicates.

Implemented:
- game selection consumes `GameCard`,
- recent/room loading consumes `LoadingSkeleton`,
- recent/room empty states consume `EmptyState`,
- retryable errors expose retry actions,
- game/room navigation uses explicit localized route builders,
- room-code input remains LTR and join arrow follows locale,
- mode controls expose semantic pressed/focus states,
- recent cards and room rows use semantic theme surfaces/borders,
- mobile layout adapts selection/mode/room hierarchy,
- introduced hover motion respects reduced motion.

Debt movement:
- `DEBT-003`: RESOLVED IN CODE.
- `DEBT-009`: SUBSTANTIALLY MITIGATED in Lobby.
- `DEBT-007`: reduced by explicit localized Lobby navigation.

Validation: NOT RUN.

---

## 2026-08-24 — GameShell visual hierarchy pass
- Expanded shell content width from `md` to `lg` for board-heavy games.
- Separated utility header from primary game title.
- Moved connection/turn/game/match state into a secondary chip hierarchy.
- Added explicit centered main game-content region.
- Winner state became a restrained semantic panel instead of a high-elevation full-primary block.
- Room code explicitly remains LTR.
- Mobile room presentation compacts without removing copy-code action.
- Validation: NOT RUN.

---

## 2026-08-24 — Theme interaction cleanup

Found:
- MUI default warning orange could leak because `palette.warning` was not defined,
- global Button hover glow conflicted with the Design System rule against ubiquitous glow,
- global Paper shadow made `elevation={0}` visually noisy,
- non-interactive Cards globally received interaction hover behavior.

Implemented:
- `palette.warning` now uses Honey Bronze tokens,
- global Button glow removed while tactile movement/focus remain,
- Paper no longer has a forced global shadow,
- Card lift/glow is opt-in through explicit interactive state,
- reduced-motion and focus-visible handling strengthened.

Tracked as `DEBT-019` and resolved in code pending executable validation.

---

## 2026-08-24 — Root layout surface cleanup
- Removed global `maxWidth: 1200` + fixed main padding from root layout so individual pages/GameShell own content width and responsive hierarchy.
- Removed duplicate root content constraints that were especially harmful for board-heavy games.
- Persian font stylesheet is loaded only for `fa` requests; English uses its configured Latin stack.
- Validation: NOT RUN.

---

## 2026-08-24 — Header 360px hardening
- Reduced xs toolbar padding/gaps and mobile brand size.
- Primary nav uses compact icon targets on mobile with accessible labels.
- Language/sound/profile controls use compact mobile dimensions.
- Desktop labels remain at larger breakpoints.
- Active nav/profile expose `aria-current`.
- Touched physical spacing migrated to logical spacing.
- Validation: NOT RUN.

---

## 2026-08-24 — Design System bilingual sync

`DESIGN_SYSTEM.md` upgraded to v2.1.0:
- Persian RTL / English LTR,
- locale-derived direction and typography,
- LTR identifiers/codes explicitly allowed,
- 360px Header usability in completion requirements,
- shared state primitives must earn reuse,
- default MUI colors must not leak around theme tokens,
- global hover glow discouraged,
- completion checklist includes locale direction/typography.

Static inspection identified `UI-001`: Profile stats were two columns at xs and too dense for the 360px target.

---

## 2026-08-24 — Tournaments shared feedback / visual pass
- Tournaments list now uses `LoadingSkeleton` and `EmptyState` instead of parallel loading/empty implementations.
- Retryable load failure has an explicit retry action.
- Removed hard-coded orange CTA/progress treatment; primary/warning theme tokens drive state presentation.
- Login and detail navigation now use explicit localized route helpers.
- Replaced class-based spinner dependency with MUI `CircularProgress`.
- Reduced card-hover decoration to border emphasis rather than generic dashboard shadow/glow.
- Validation: NOT RUN.

---

## 2026-08-24 — Targeted branch validation workflow
- Added `.github/workflows/foundation-web-check.yml` for this branch only.
- Intended checks: `npm ci`, shared package builds, architecture-boundary check, web typecheck, web build.
- The connector has not yet surfaced a completed status/check for the latest branch commits.
- Therefore this does **not** count as validation PASS.

---

## 2026-08-24 — Profile 360px + route hardening

Resolved `UI-001` in code:
- stats now use 1 column on xs, 2 on sm, 4 on md,
- Profile header stacks on mobile instead of forcing navigation/logout into one row,
- profile hero/avatar hierarchy compacts at xs,
- username/email text can wrap without breaking layout,
- Lobby and unauthenticated-login navigation are explicitly locale-scoped,
- back icon follows RTL/LTR,
- history table is contained in an intentional horizontal-scroll region rather than forcing the whole page to overflow,
- empty history uses canonical `EmptyState`,
- history/password loading actions use visible `CircularProgress` rather than class-name animation assumptions,
- surface/background values touched in this pass use theme tokens instead of duplicated raw dark colors.

Validation: NOT RUN.

---

## 2026-08-24 — Multiplayer room UI hardening + compile-risk fix

A concrete regression was discovered during the UI pass:
- `/play/[roomId]` still imported `@/i18n/useAppLocale` even though that duplicate module had already been deleted after `hooks/useAppLocale.ts` became canonical.
- This is a compile-blocking stale import, not merely visual debt.

Fixed:
- switched `/play/[roomId]` to canonical `@/hooks/useAppLocale`,
- targeted search confirms no remaining `i18n/useAppLocale` import,
- GameShell back route is explicitly localized instead of relying on compatibility redirect,
- spectator/waiting treatments now derive from theme tokens rather than raw Honey Bronze rgba literals,
- removed unnecessary large shadow from waiting panel,
- waiting panel hierarchy is constrained/centered responsively,
- chat speaker colors now use semantic theme colors instead of an unrelated hard-coded blue,
- chat composer stacks on narrow mobile widths,
- Enter handling prevents accidental newline/send duplication,
- send button disables for empty messages.

Tracked as `BUG-002` (stale deleted-module import) — RESOLVED IN CODE, executable validation pending.

Validation: NOT RUN.

---

## Current static risk before local review

### RTL infrastructure verification — `DEBT-020`

The app now derives `html dir` and `theme.direction` from locale and touched layouts use logical CSS. However MUI 5 + Emotion can require an RTL style cache/plugin for components that emit physical left/right CSS. `stylis-plugin-rtl` is not currently declared in the web package.

Do not add/update package dependencies without a coherent lockfile/install step in an executable environment. Therefore:
- do not claim complete MUI RTL validation yet,
- continue static removal of physical-direction assumptions,
- verify real MUI component mirroring during the eventual local run,
- add the RTL Emotion cache/plugin only if the runtime review confirms it is required (or when dependency installation/lockfile update can be executed safely).

This is an implementation/validation issue, not a human product decision.

### Visual review policy

User preference remains: **do not request local run yet**. Continue static high-impact UI cleanup first.

### Next
1. audit Tournament detail/Profile/game-entry remaining physical-direction and 360px issues,
2. inspect game-specific boards/surrounding controls for shell-level overflow issues without redesigning game art,
3. normalize remaining high-traffic feedback patterns only where recurrence is proven,
4. prepare Admin dead Footer logic cleanup safely,
5. known-bug/static compile-risk pass,
6. sync HANDOFF/Foundation docs,
7. only then declare the local visual-review checkpoint.
