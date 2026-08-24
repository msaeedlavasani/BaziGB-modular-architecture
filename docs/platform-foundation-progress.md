# Platform Foundation — Implementation Progress

This is the stage-by-stage execution log for the foundation work. Architectural baseline and debt definitions remain in `docs/platform-foundation.md`; continuation state remains in `docs/HANDOFF.md`.

## 2026-08-24 — Consumer migration preparation

### Scope

Move from Tasks 0–3 audit/foundation into real bilingual consumer migration without activating `/fa/*` and `/en/*` routes prematurely.

### Implemented

- Added `apps/web/src/i18n/useAppLocale.ts`.
- Client components/pages now have one canonical way to resolve the active locale from the pathname.
- Locale-neutral routes intentionally resolve to `DEFAULT_LOCALE` (`fa`) during the migration period.
- The hook reuses `resolveLocaleFromPathname` rather than duplicating locale parsing.

### Verified consumer debt

Lobby currently still owns:

- local `STATUS_LABEL` English labels,
- local `GAME_META`,
- local `GAME_OPTIONS`,
- local recent-game result copy,
- local errors and action copy,
- direct `/game/*` and `/play/*` route construction.

`/game/[gameId]` currently still owns:

- local `GAME_TITLES`,
- local `GAME_CHIPS`,
- Persian bot/player labels,
- Persian invalid-move/bot-error copy,
- winner/rematch/settings copy.

These are confirmed migration targets for the existing `game-catalog`, `messages`, and routing helpers.

### Architecture decision

Do not make each page parse pathname or infer locale independently. Client consumers use `useAppLocale`; routing remains language-neutral until the atomic locale-route migration.

### Debt status

- DEBT-006 duplicate game presentation metadata: OPEN / ACTIVE MIGRATION.
- DEBT-008 hard-coded game-page copy: OPEN / ACTIVE MIGRATION.
- DEBT-013 catalog without consumers: OPEN until the large page consumers are migrated.

No new runtime bug is confirmed in this stage.

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

Migrate `/game/[gameId]` first, then `/play/[roomId]`, then Lobby. After each meaningful consumer migration, update this progress log and `docs/HANDOFF.md`.
