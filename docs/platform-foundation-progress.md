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

### Architecture

Activated bilingual public URLs without duplicating the App Router page tree.

- Added `apps/web/src/middleware.ts`.
- `/fa/*` and `/en/*` remain visible public URLs while middleware rewrites internally to the existing shared pages.
- Public locale roots include Lobby, Leaderboard, Tournaments, Profile, Login, Game, Play, Rules and Contact.
- `/` redirects to the preferred locale Lobby.
- Locale-neutral public URLs redirect to the preferred locale, defaulting to Persian.
- Middleware persists `bazigb-locale` as a compatibility cookie so remaining neutral links do not unexpectedly switch an English user back to Persian during migration.
- Admin remains locale-neutral until its bilingual content-editor stage.

### Root shell

- Root layout now reads the middleware request locale from `x-bazigb-locale`.
- Active request locale drives HTML `lang`, `dir`, localized metadata, MUI direction and locale font stack.
- Header/Footer receive the active locale.
- Header primary navigation now emits locale-prefixed links.
- Footer brand/rules/contact and internal managed links emit locale-prefixed links while external URLs remain unchanged.

### Route helpers

`i18n/routing.ts` now includes localized builders for app/game/play/tournament routes. Route literals remain language-neutral at the source.

### Graveyard prevention discovered during this stage

Two copies of `useAppLocale` existed after the foundation work:
- `hooks/useAppLocale.ts`
- `i18n/useAppLocale.ts`

Targeted consumer search confirmed the latter had no consumers. It was deleted immediately; `hooks/useAppLocale.ts` is canonical. Logged as `DEBT-014` and resolved.

### Validation attempt

A GitHub Actions lookup was performed for the branch commit available at that checkpoint. No workflow runs were associated with it. Therefore:
- CI: NOT RUN / unavailable for this branch checkpoint
- Build: NOT RUN
- Typecheck: NOT RUN
- Tests: NOT RUN
- Browser QA: NOT RUN
- Deploy: NOT RUN

No static inspection is promoted to PASS.

### Remaining risks/boundaries

- Some page-local neutral links still rely on middleware compatibility redirects and should be normalized to explicit localized helpers.
- Tournament detail/bracket remained a high-traffic page with English client-owned copy at this checkpoint.

---

## 2026-08-24 — Tournament detail / bracket

### Implemented

- Added `apps/web/src/i18n/tournament-detail.ts` for detail/bracket-specific presentation copy.
- Tournament detail now resolves locale through the canonical `useAppLocale()` hook.
- Back/login links are explicitly locale-scoped rather than depending on compatibility redirects.
- Status, errors, not-found state, join actions, player count, champion labels, bracket legend, empty states and round labels are localized.
- Tournament game title uses the canonical game catalog when the API game id is recognized.
- Date formatting is locale-aware (`fa-IR` / `en-US`).
- API/data-owned `name`, `description`, `prize`, champion/player names and server join-result text remain verbatim by design.
- Physical `marginLeft` placement in bracket player rows was replaced by logical `marginInlineStart`.
- Bracket geometry itself is explicitly kept LTR so connector math and tournament progression remain deterministic across locales; labels surrounding the bracket remain localized.

### Product decision resolved

- eNamad must remain visible in **both Persian and English** shells for the current product stage. This is now the explicit policy; no locale-based hiding should be introduced unless the product policy changes later.

### Debt movement

- `DEBT-010` Tournament mixed-language presentation: **SUBSTANTIALLY RESOLVED** for list + detail client-owned copy.
- `DEBT-007` locale-neutral internal links: reduced further in Tournament detail; remaining high-traffic neutral links still need targeted normalization.
- `DEBT-015` server/data-owned localization boundary remains TRACKED and intentionally separate from client i18n.

### Visual-change checkpoint

This branch now contains **material visible changes suitable for local review**:
- real `/fa/...` and `/en/...` public URLs,
- LTR English shell vs RTL Persian shell,
- localized Header/Footer/Lobby/Profile/Login/Leaderboard/Tournaments/game shells,
- locale-specific typography/metadata,
- Tournament detail/bracket localization.

A local run would now produce a meaningful visual comparison. Executable validation still has not run in the current connector environment.

### Validation

- Build: NOT RUN
- Typecheck: NOT RUN
- Tests: NOT RUN
- Browser QA: NOT RUN
- Deploy: NOT RUN

### Next

Continue automatically with remaining high-traffic locale-neutral link normalization, then Admin bilingual Footer editor, Component Graveyard Cleanup, shared feedback/UI foundation and known-bug pass. Pause only for a genuine human decision.
