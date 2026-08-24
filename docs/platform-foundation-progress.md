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

### Verified consumer debt

Lobby still owns local status/game metadata, recent-result copy, errors/actions and direct game/play route construction.

`/game/[gameId]` owned duplicate game titles/chips plus Persian player/bot/settings/result copy before the next stage.

### Architecture decision

Do not make each page parse pathname or infer locale independently. Client consumers use `useAppLocale`; routing remains language-neutral until the atomic locale-route migration.

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

---

## 2026-08-24 — `/game/[gameId]` consumer migration

### Scope

Make the local/bot game entry point a real consumer of the canonical locale and game-presentation foundations before touching multiplayer or Lobby.

### Implemented

- `/game/[gameId]` now resolves locale through `useAppLocale()`.
- Removed page-local `GAME_TITLES` and `GAME_CHIPS` maps.
- Game title/chip now come from `getGameTitle()` / `getGameChip()` in `apps/web/src/lib/game-catalog.ts`.
- Route input now passes through `isWebGameId()` before selecting the adapter; unsupported IDs fall back to the established Tic-Tac-Toe default instead of indexing presentation maps unsafely.
- Game-shell copy moved from page-local Persian strings to typed locale messages:
  - player / bot names
  - invalid move / bot error fallback
  - turn state
  - difficulty labels
  - match / win-by-two / target / points
  - undo / new game
  - preparing/loading state
  - winner/draw copy
  - Backgammon final-score summary
- Back navigation now consumes centralized `APP_ROUTES.lobby` instead of a local route literal.
- `messages.gameShell` was extended only for fields required by this real consumer (`you`, `bot`, `finalScore`).

### Debt movement

- `DEBT-006` duplicate game presentation metadata: **PARTIALLY RESOLVED** — local/bot consumer migrated; multiplayer + Lobby remain.
- `DEBT-008` hard-coded game-page copy: **PARTIALLY RESOLVED** — local/bot page migrated; multiplayer game page still needs its own consumer pass.
- `DEBT-013` canonical game catalog without consumers: **MITIGATED** — catalog now has a real high-traffic consumer. It remains open until `/play` and Lobby migrate so duplicate maps are removed platform-wide.

### Bug / risk notes

No runtime bug was confirmed in this stage. The route guard removes one unsafe assumption (casting arbitrary route input directly to `GameId`), but executable validation is still required before calling the migration production-safe.

### Validation

- Build: NOT RUN
- Typecheck: NOT RUN
- Tests: NOT RUN
- Browser QA: NOT RUN
- Deploy: NOT RUN

The current GitHub connector environment cannot execute these checks; none are reported as PASS.

### Safety

- `main` untouched.
- governance branch untouched.
- no merge.
- no deployment.

### Next

1. Migrate `/play/[roomId]` to `game-catalog` + typed locale messages without changing multiplayer/game-engine behavior.
2. Migrate Lobby metadata/status/copy/routes.
3. Update this progress log + HANDOFF after each consumer stage.
