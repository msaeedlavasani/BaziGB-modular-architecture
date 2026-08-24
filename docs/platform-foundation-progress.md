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

### Design-system alignment

A targeted shared-UI pass was performed against `DESIGN_SYSTEM.md` before asking for local visual review.

Implemented:
- `GameCard` was redesigned from an unused generic Card into the canonical selectable game tile shape: selected state, visible state border, tactile surface, focus-visible state, reduced-motion support and semantic `aria-pressed`.
- `EmptyState` became a reusable product-level empty-state panel with optional icon/CTA and responsive theme-token styling.
- `LoadingSkeleton` became a configurable structural grid instead of one arbitrary page-shaped skeleton.
- `Modal` was made locale-neutral: user-facing close/confirm copy is supplied by the consumer, and the dialog surface now follows BaziGB tokens instead of owning Persian copy.

### GameShell bilingual defect

A hidden bilingual/UI debt was found inside canonical `GameShell`: despite localized `/game` and `/play` pages, the shared shell still hard-coded Persian labels.

Implemented:
- Added `i18n/game-shell.ts`.
- `GameShell` resolves locale through the canonical locale hook.
- Connection/room/copy/match/rematch/back/waiting labels are bilingual.
- Back arrow direction follows locale.
- Physical spacing touched in the shell was replaced by logical spacing.
- Winner surface uses semantic theme colors.

### Language discoverability

Bilingual routes existed but had no visible language control.

Implemented:
- Added `i18n/language-switcher.ts`.
- Header exposes a compact FA/EN switcher preserving the current logical pathname.
- The switcher is responsive and hidden on locale-neutral Admin routes.

Validation: NOT RUN.

---

## 2026-08-24 — Lobby canonical UI migration

### Implemented

Lobby was rewritten around the shared visual primitives instead of keeping parallel page-local versions.

- Game selection now consumes canonical `GameCard` for all `WEB_GAME_IDS`.
- Recent-games loading uses canonical `LoadingSkeleton`.
- Active-room loading uses structural `LoadingSkeleton` rows rather than a generic spinner.
- Recent-games and active-rooms empty states use canonical `EmptyState`.
- Error states now expose an immediate retry action where a retry is meaningful.
- Game/room navigation now uses explicit locale-aware `localizedGameRoute()` / `localizedPlayRoute()` rather than relying on compatibility redirects.
- Room-code input is explicitly LTR while the surrounding page remains locale-directed.
- Join-arrow direction follows locale.
- Game mode controls expose `aria-pressed` and keyboard focus state.
- Recent-game cards and active-room rows use semantic theme surfaces/borders and reduced-motion-safe hover behavior.
- Mobile layout adapts selection tiles, mode choices and room rows rather than only shrinking desktop spacing.

### Debt movement

- `DEBT-003` GameCard mismatch: **RESOLVED IN CODE** — Lobby now has a real canonical consumer.
- `DEBT-009` shared feedback primitive bypass: **SUBSTANTIALLY MITIGATED** in the highest-traffic Lobby states.
- `DEBT-007` neutral-link dispersion: reduced further by explicit localized Lobby navigation.

### GameShell hierarchy pass

The canonical GameShell received a second visual-hierarchy pass:
- shell width expanded to `lg` so larger boards are not unnecessarily constrained,
- utility controls live in a compact header row,
- game title becomes the primary centered hierarchy,
- status/match chips form a secondary state row,
- game content is placed in an explicit centered `main` region,
- winner state is now a restrained BaziGB panel rather than a large high-elevation primary-color block,
- room code is forced LTR for stable readability in both locales,
- mobile utility labels compact without removing the underlying action.

### Visual review policy

User preference remains to delay local review until the broader UI cleanup and known visual issues are reduced further. Do not request a local run yet.

Validation: build/typecheck/tests/browser/deploy NOT RUN.

### Next

Continue automatically with:
1. high-traffic feedback/state consistency outside Lobby,
2. targeted 360px + RTL/LTR audit of Profile/Tournaments/Game entry shells,
3. neutral-link cleanup where explicit locale routing is still missing,
4. safe Admin cleanup preparation,
5. known-bug/UI pass,
6. only then declare the next local visual-review checkpoint.
