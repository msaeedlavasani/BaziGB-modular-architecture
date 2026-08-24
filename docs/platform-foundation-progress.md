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

## 2026-08-24 — `/play/[roomId]`
- Removed page-local title/chip maps and game allowlist duplication.
- Uses catalog + multiplayer messages + canonical locale resolver.
- Localized waiting/spectator/turn/winner/chat/room-share copy.
- Runtime/socket/game behavior preserved.
- Validation: NOT RUN.

---

## 2026-08-24 — Lobby
- Removed local status/game metadata registries.
- Uses `WEB_GAME_IDS`, catalog title/guard helpers and centralized route builders.
- Localized page-owned copy/results/errors/actions/dates.
- Initial migration intentionally preserved inline card/loading/empty UI for later graveyard cleanup.
- Validation: NOT RUN.

---

## 2026-08-24 — Tournaments list
- Migrated client-owned list/filter/status/error/action copy.
- Dates now locale-aware.
- API-owned tournament name/description/prize/join message remain verbatim.
- Identified tournament data localization as a separate content boundary.
- Validation: NOT RUN.

---

## 2026-08-24 — Profile
- Added `apps/web/src/i18n/profile.ts`.
- Profile now uses canonical locale resolver.
- Removed hard-coded RTL from page root so direction is inherited from active locale theme/shell.
- Localized profile editing, password validation/actions, stats, history headers/results/errors and fallback labels.
- Game history uses canonical game titles for recognized game IDs.
- Date presentation switches `fa-IR` / `en-US`.
- Validation: NOT RUN.

---

## 2026-08-24 — OTP/Login
- Added `apps/web/src/i18n/auth.ts`.
- Migrated all client-owned login/OTP/new-user copy and validation fallback messages.
- Phone and verification-code inputs intentionally remain LTR because their data format is direction-independent numeric/Latin content.
- Iranian `09xxxxxxxxx` mobile-number constraint remains product/auth behavior and was not changed for English.
- Validation: NOT RUN.

---

## 2026-08-24 — Leaderboard
- Added `apps/web/src/i18n/leaderboard.ts`.
- Migrated title/subtitle/search/errors/podium labels/rating/rankings/stats/current-user/empty-state copy.
- Replaced physical right alignment/margin usage touched by this migration with logical `end` / `marginInlineStart` equivalents.
- Validation: NOT RUN.

---

## 2026-08-24 — Locale route activation
- Activated `/fa/*` and `/en/*` through middleware rewrites to one shared page tree.
- Root layout now receives active locale for `lang`, `dir`, metadata, font and MUI direction.
- Header/Footer emit localized routes.
- Removed duplicate unused `i18n/useAppLocale.ts`; `hooks/useAppLocale.ts` is canonical.
- GitHub Actions lookup found no workflow run; validation remains NOT RUN.

---

## 2026-08-24 — Tournament detail / bracket
- Added localized detail/bracket messages and locale-aware date/status/action/round presentation.
- Kept bracket geometry intentionally LTR while surrounding presentation remains locale-aware.
- eNamad product policy resolved: visible in both `fa` and `en` for now.
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
- `Modal` made locale-neutral and theme-token aligned; still an unused candidate until a real consumer is proven.
- `GameShell` localized and corrected for RTL/LTR back direction and logical spacing.
- Added visible FA/EN Header switcher while preserving the current logical path.
- Validation: NOT RUN.

---

## 2026-08-24 — Lobby canonical UI migration

Lobby was rewritten around the shared visual primitives instead of keeping parallel page-local versions.

Implemented:
- game selection consumes `GameCard` for all `WEB_GAME_IDS`,
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
- Added an explicit centered `main` game-content region.
- Winner state is now a restrained semantic panel instead of a high-elevation full-primary block.
- Room code is explicitly LTR for stable readability.
- Mobile room-label presentation compacts without removing the copy/copy-code action.

Validation: NOT RUN.

---

## 2026-08-24 — Theme interaction cleanup

A design-system inconsistency was found in the global theme:
- `warning` was not defined, so MUI default orange could leak into BaziGB despite the rule against unrelated default MUI colors,
- every MUI Button received a bronze hover glow globally, conflicting with the Design System rule that glow should communicate meaningful interaction rather than appear everywhere.

Implemented:
- defined `palette.warning` from the existing Honey Bronze token family,
- removed the global Button hover box-shadow/glow while keeping subtle tactile movement and focus-visible treatment,
- meaningful game-specific glow remains available where interaction/state warrants it.

Tracked as `DEBT-019` and resolved in code pending executable validation.

---

## 2026-08-24 — Header 360px hardening

A targeted mobile-shell pass was applied before local review:
- reduced xs toolbar padding/gaps,
- reduced brand icon size on xs,
- primary navigation uses compact icon targets on mobile with Tooltip labels,
- language/sound/profile controls use compact mobile dimensions,
- desktop labels remain available at larger breakpoints,
- active nav/profile controls expose `aria-current`,
- physical brand spacing was replaced with logical `marginInlineStart`,
- touched border/color styling derives from theme tokens.

This is code-level hardening for the 360px minimum; it is not a browser-validation PASS.

---

## 2026-08-24 — Design System bilingual sync

`DESIGN_SYSTEM.md` upgraded to v2.1.0 so documentation no longer contradicts the implementation:
- Persian is RTL and English is LTR,
- direction and typography are locale-derived,
- LTR identifiers/codes are explicitly allowed,
- 360px Header usability is now a completion requirement,
- shared state primitives must earn reuse through real recurring patterns,
- default MUI colors must not leak around the token system,
- global hover glow is explicitly discouraged,
- frontend completion checklist now covers locale direction/typography.

### New responsive finding

Static Profile inspection identified `UI-001`: the stats grid remains two columns at `xs`, which may be too dense at the 360px minimum given icon + text + internal padding. This is queued for the next targeted responsive pass before local visual review.

### Visual review policy

User preference remains to delay local review until the broader UI cleanup and known visual issues are reduced further. Do not request a local run yet.

### Next

Continue automatically with:
1. fix Profile 360px density and explicit localized links,
2. audit Tournaments/game-entry narrow-screen hierarchy and RTL/LTR assumptions,
3. remaining high-traffic feedback consistency,
4. safe Admin cleanup preparation,
5. known-bug/UI pass,
6. only then declare the next local visual-review checkpoint.
