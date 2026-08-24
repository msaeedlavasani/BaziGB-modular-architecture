# Platform Foundation — Implementation Progress

This is the stage-by-stage execution log for the foundation work. Architectural baseline and debt definitions remain in `docs/platform-foundation.md`; continuation state remains in `docs/HANDOFF.md`.

## 2026-08-24 — Consumer migration preparation

### Scope

Move from Tasks 0–3 audit/foundation into real bilingual consumer migration without activating `/fa/*` and `/en/*` routes prematurely.

### Implemented

- Added `apps/web/src/hooks/useAppLocale.ts`.
- Client components/pages now have one canonical way to resolve the active locale from the pathname.
- Locale-neutral routes intentionally resolve to `DEFAULT_LOCALE` (`fa`) during the migration period.
- The hook reuses `resolveLocaleFromPathname` rather than duplicating locale parsing.

### Validation

Build/typecheck/tests/browser/deploy: NOT RUN in the connector environment.

---

## 2026-08-24 — `/game/[gameId]` consumer migration

### Implemented

- `/game/[gameId]` resolves locale through `useAppLocale()`.
- Removed page-local game title/chip maps.
- Uses `getGameTitle()` / `getGameChip()` from the canonical game catalog.
- Route input is guarded by `isWebGameId()`.
- Game-shell copy moved to typed locale messages.
- Back navigation uses `APP_ROUTES.lobby`.

### Debt movement

- DEBT-006: partially resolved.
- DEBT-008: partially resolved.
- DEBT-013: graveyard risk mitigated by real consumer usage.

### Validation

Build/typecheck/tests/browser/deploy: NOT RUN.

---

## 2026-08-24 — `/play/[roomId]` consumer migration

### Implemented

- Removed page-local game title/chip maps and page-local game-type allowlist duplication.
- Uses canonical game catalog + `isWebGameId()` + `useAppLocale()`.
- Multiplayer waiting/spectator/turn/winner/chat/room-share copy moved to typed messages.
- Waiting-room player-capacity display uses catalog presentation fallback; runtime capacity remains server/GameAdapter-owned.
- Chat alignment moved from physical `right` to logical `start` for RTL/LTR compatibility.
- Socket protocol and gameplay behavior were preserved.

### Debt movement

- DEBT-006: both game entry pages migrated; Lobby remained at this point.
- DEBT-008: substantially resolved for game entry pages.
- DEBT-013: resolved as a graveyard risk because the catalog has real high-traffic consumers.

### Boundary note

Server-originated system-message payload text remains server-owned and is not translated by the client.

### Validation

Build/typecheck/tests/browser/deploy: NOT RUN.

---

## 2026-08-24 — Lobby consumer migration

### Scope

Remove the largest remaining page-local game/status/copy duplication while preserving room creation, room listing, bot navigation, history loading and current visual structure.

### Implemented

- Lobby now resolves locale through `useAppLocale()`.
- Removed local `STATUS_LABEL`, `GAME_META`, `GAME_OPTIONS`, custom `GameType`, and metadata-based history normalization.
- Game choices now come from `WEB_GAME_IDS`; displayed names come from `getGameTitle()`.
- History game-name normalization uses the shared `isWebGameId()` boundary.
- Room game identity is normalized through the same catalog guard.
- Bot/game/play navigation uses `gameRoute()` / `playRoute()` instead of page-local string construction.
- Active-room player capacity display uses catalog presentation fallback rather than `vegas ? 5 : 2` UI branching.
- Lobby product copy moved into typed locale messages, including:
  - title/subtitle
  - room status
  - recent-game states/results/actions
  - match-point labels
  - online/bot mode labels
  - create/join room copy/errors
  - active-room labels/actions
- Recent-match date formatting now switches between `fa-IR` and `en-US` based on locale.
- A directional hover transform on room rows was replaced with vertical movement so the same interaction is correct in RTL and LTR.

### Debt movement

- `DEBT-002` mixed-language Lobby copy: **SUBSTANTIALLY RESOLVED** at page-owned-copy level.
- `DEBT-006` duplicate game presentation metadata: **RESOLVED FOR PRIMARY GAME ENTRY/Lobby CONSUMERS**. Catalog is now consumed by `/game`, `/play`, and Lobby.
- `DEBT-007` route literal dispersion: **PARTIALLY MITIGATED**; dynamic game/play route construction is centralized, but locale-scoped routes are still pending.
- `DEBT-013` catalog graveyard risk: **RESOLVED**.
- `DEBT-003` GameCard canonicality mismatch remains intentionally open; this migration did not mix in component-graveyard cleanup.
- `DEBT-009` feedback-pattern duplication remains open; existing Skeleton/Alert/Paper states were preserved rather than refactored during localization.

### Bug / risk notes

- No runtime bug is claimed resolved because executable validation has not run.
- Unknown room/history game IDs now fall back through the shared web-game boundary rather than indexing arbitrary local metadata.
- `GAME_CATALOG.maxPlayers` remains presentation fallback only.

### Validation

- Build: NOT RUN
- Typecheck: NOT RUN
- Tests: NOT RUN
- Browser QA: NOT RUN
- Deploy: NOT RUN

### Safety

- `main` untouched.
- governance branch untouched.
- no merge.
- no deployment.

### Next

Continue automatically with Tournaments/Profile/auth copy migration, then prepare the atomic locale route-tree stage. Pause only for a genuine human product/architecture decision.
