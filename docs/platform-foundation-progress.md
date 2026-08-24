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
- Preserved inline card/loading/empty UI for later graveyard cleanup.
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
- `GameCard` was redesigned from an unused generic Card into the canonical **selectable game tile** shape that matches BaziGB's actual Lobby interaction language: selected state, visible border/state, tactile surface, focus-visible state, reduced-motion support and semantic `aria-pressed`.
- `EmptyState` was upgraded into a reusable product-level empty-state panel with explanatory hierarchy, optional icon/CTA, responsive spacing and Honey Bronze/theme-token surfaces.
- `LoadingSkeleton` was generalized into a configurable structural grid instead of a single arbitrary page-shaped skeleton.
- These primitives are now architecture-ready for consumer migration; they are **not yet considered canonical-by-use until Lobby/other consumers adopt them**.

### GameShell audit and fix

A hidden bilingual/UI debt was found inside canonical `GameShell`: despite localized `/game` and `/play` pages, the shared shell still hard-coded Persian labels for connection status, room, Lobby/back actions, match score, rematch and waiting state.

Implemented:
- Added `i18n/game-shell.ts`.
- `GameShell` now resolves locale itself through the canonical locale hook.
- Connection/room/copy/match/rematch/back/waiting labels are bilingual.
- Back arrow direction now follows locale (`→`-direction intent for RTL, left-arrow for LTR).
- Physical spacing touched in the shell was replaced by logical spacing.
- Winner surface now uses theme semantic colors rather than white-on-Honey-Bronze hard-coding.
- Focus/accessibility and responsive behavior were preserved.

This closes a real gap where the English game routes could still show Persian shared-shell text.

### Language discoverability

A missing product interaction was identified: bilingual routes existed, but there was no visible way for a user to switch languages.

Implemented:
- Added `i18n/language-switcher.ts`.
- Header now includes a compact FA/EN switcher that preserves the current logical pathname while changing locale.
- The switcher is responsive and hidden on locale-neutral Admin routes.
- Header spacing was tightened on mobile and active/navigation styles now use theme tokens instead of repeated raw color literals where touched.

### Visual review policy

The user explicitly prefers to delay local review until more UI/component cleanup is complete. Therefore the previous visual-review checkpoint is intentionally deferred.

Do **not** request a local run yet. Continue with:
1. migrate Lobby selection/empty/loading consumers onto the revised shared primitives,
2. normalize remaining shared feedback patterns,
3. clean Admin dead Footer logic when executable validation becomes available or when a safe isolated rewrite is possible,
4. inspect major GameShell/Lobby responsive hierarchy and remaining physical RTL/LTR assumptions,
5. then declare a new local visual-review checkpoint.

Validation: build/typecheck/tests/browser/deploy NOT RUN.
