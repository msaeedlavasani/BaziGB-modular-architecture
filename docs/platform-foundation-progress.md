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

---

## 2026-08-24 — `/play/[roomId]` consumer migration

### Scope

Migrate the multiplayer entry page to canonical presentation/i18n foundations without changing socket protocol, game rules, room lifecycle, or engine behavior.

### Implemented

- Removed page-local `GAME_TITLES` and `GAME_CHIPS` maps.
- Multiplayer title/chip now consume `getGameTitle()` / `getGameChip()` from `game-catalog.ts`.
- Room `gameType` normalization now uses the shared `isWebGameId()` guard rather than a second page-local allowlist.
- Page locale now comes from `useAppLocale()`.
- Back navigation uses `APP_ROUTES.lobby`.
- Added only the multiplayer message keys required by this real consumer:
  - opponent turn/winner
  - spectating states
  - waiting-room copy
  - room sharing/copy/start labels
  - player-count formatting
  - turn-expired/undo copy
  - chat labels/placeholders/system/guest labels
  - match score formatting
- Replaced hard-coded `vegas ? 5 : 2` **display** capacity in the waiting-room chip with the canonical web catalog presentation fallback. Runtime capacity remains a server/GameAdapter concern and was not changed.
- Chat alignment changed from hard-coded `right` to logical `start`, so the same markup follows RTL/LTR direction naturally.
- Socket events, start conditions, gameplay actions, spectator behavior and board dispatch were preserved.

### Debt movement

- `DEBT-006` duplicate game presentation metadata: **PARTIALLY RESOLVED** — both `/game` and `/play` now consume the catalog; Lobby remains.
- `DEBT-008` hard-coded game-page copy: **SUBSTANTIALLY RESOLVED** for the two game entry pages. Remaining copy debt is now mainly game-specific board components and any server-originated messages that require separate treatment.
- `DEBT-013` catalog without consumers: **RESOLVED AS A GRAVEYARD RISK** — the catalog now has two high-traffic consumers. Platform-wide metadata cleanup still requires Lobby migration.

### Risk / bug notes

- No runtime bug was confirmed because executable validation is unavailable here.
- Server-originated `systemMessage.message` content is intentionally not translated in the client; the client only localizes its own surrounding labels. If server messages are language-specific, that is a separate protocol/content-boundary task.
- `gameCatalog.maxPlayers` is presentation fallback only. It must not become authoritative runtime capacity.

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

Proceed directly to Lobby consumer migration, then Tournaments/Profile/auth. Do not wait for human approval unless a real product/architecture decision is encountered.
