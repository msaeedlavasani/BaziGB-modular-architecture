# Platform Foundation — Implementation Progress

This is the stage-by-stage execution log for the foundation work. Architectural baseline and debt definitions remain in `docs/platform-foundation.md`; continuation state remains in `docs/HANDOFF.md`.

## 2026-08-24 — Consumer migration preparation

- Added `apps/web/src/hooks/useAppLocale.ts`.
- Locale-neutral routes resolve to Persian during migration.
- Client consumers use one canonical locale resolver.

Validation: build/typecheck/tests/browser/deploy NOT RUN.

---

## 2026-08-24 — `/game/[gameId]` consumer migration

- Removed local game title/chip maps.
- Uses canonical catalog + typed game-shell messages.
- Guarded game route input with `isWebGameId()`.
- Back navigation uses centralized routes.

Debt: DEBT-006/008 partially resolved; DEBT-013 graveyard risk mitigated.

Validation: NOT RUN.

---

## 2026-08-24 — `/play/[roomId]` consumer migration

- Removed local title/chip maps and local game allowlist duplication.
- Uses canonical catalog + multiplayer messages + `useAppLocale()`.
- Localized waiting/spectator/turn/winner/chat/room-share copy.
- Presentation capacity uses catalog fallback; runtime capacity remains server/GameAdapter-owned.
- Chat alignment uses logical `start` for RTL/LTR.
- Socket/gameplay behavior preserved.

Debt: DEBT-006 further resolved; DEBT-008 substantially resolved for entry pages; DEBT-013 resolved as graveyard risk.

Boundary: server-originated system-message payload text remains server-owned.

Validation: NOT RUN.

---

## 2026-08-24 — Lobby consumer migration

- Lobby uses `useAppLocale()` + typed Lobby messages.
- Removed local `STATUS_LABEL`, `GAME_META`, `GAME_OPTIONS`, custom GameType duplication.
- Game choices use `WEB_GAME_IDS`; names use `getGameTitle()`.
- History/room game IDs use `isWebGameId()`.
- Game/play navigation uses `gameRoute()` / `playRoute()`.
- Room capacity display uses catalog presentation fallback.
- Recent dates are locale-aware.
- Directional hover movement changed to vertical movement for RTL/LTR neutrality.
- Existing inline loading/empty/card UI intentionally preserved for later graveyard cleanup.

Debt:
- DEBT-002 substantially resolved.
- DEBT-006 resolved for `/game`, `/play`, Lobby primary consumers.
- DEBT-007 partially mitigated; locale routes remain.
- DEBT-013 resolved.
- DEBT-003/009 remain open by design.

Validation: NOT RUN.

---

## 2026-08-24 — Tournaments consumer migration

### Scope

Remove the English-only tournament-page presentation layer without changing tournament API/data behavior.

### Implemented

- Tournaments now resolves locale via `useAppLocale()`.
- Removed page-local English fallback description/status-label/filter-label constants as presentation sources.
- Added typed tournament messages only for real page consumers:
  - title/header summary
  - status/filter labels
  - load/join errors
  - empty state
  - start date/player count formatting
  - joined/sign-in/full/join actions
  - bracket/results actions
- Tournament date formatting now uses `fa-IR` or `en-US` from the active locale.
- Existing API-provided `t.name`, `t.description`, `t.prize`, and `joinResult.message` remain data/server-owned and are not silently translated in the client.
- Existing tournament links remain locale-neutral until the atomic route migration.

### Debt movement

- `DEBT-010` English-only Tournament page copy: **SUBSTANTIALLY RESOLVED** for client-owned copy.
- A new content boundary is explicit: tournament records returned by the API may themselves contain language-specific managed/user content. That must be handled as a data/content localization problem, not by client string substitution.

### Risk / bug notes

- No runtime bug confirmed; executable validation has not run.
- Tournament dynamic/data fields are intentionally preserved verbatim.

### Validation

- Build: NOT RUN
- Typecheck: NOT RUN
- Tests: NOT RUN
- Browser QA: NOT RUN
- Deploy: NOT RUN

### Safety

- `main` untouched.
- governance branch untouched.
- no merge/deploy.

### Next

Continue automatically with Profile/common-feedback migration, then Auth pages. Pause only for a genuine human decision.
