# BaziGB — HANDOFF

## Current state

- Production baseline: `main`
- Working branch: `refactor/platform-foundation-i18n-v3`
- Governance source: latest verified governance on `ai/autonomous-development-system-v1`
- `main`: NOT MODIFIED
- Governance branch: NOT MODIFIED
- Merged: NO
- Deployed: NO
- Production verified: NO

## Current phase

Foundation/audit Tasks 0–3 are complete for their agreed scope. Work is now in targeted bilingual consumer migration.

Target architecture:

```text
shared components
shared business logic
shared game engine
shared realtime/server contracts
        +
locale content
RTL / LTR
localized typography
localized metadata
localized routes
```

## Foundation already present

- `apps/web/src/i18n/config.ts`: typed `fa/en`, direction, typography and metadata.
- `apps/web/src/i18n/messages.ts`: typed shared messages for shell/game/lobby/tournament/footer foundations.
- `apps/web/src/i18n/routing.ts`: language-neutral routes plus locale prefix/strip/resolution helpers.
- `apps/web/src/hooks/useAppLocale.ts`: canonical client locale resolver. Locale-neutral routes resolve to Persian during migration; future `/fa/*` and `/en/*` routes use the same hook.
- locale-aware MUI theme factory and Providers inputs.
- Header/Footer locale-aware shell copy and centralized route identities.
- bilingual Footer Web/Server contract with legacy Persian compatibility and `footer.fa` / `footer.en` storage.
- `apps/web/src/lib/game-catalog.ts`: canonical web presentation bridge for `GameId`; runtime capability remains owned by GameAdapter.

## Latest completed stage — `/game/[gameId]`

The local/bot game page has now been migrated to the shared foundations.

### Changes

- Removed local `GAME_TITLES` / `GAME_CHIPS` maps.
- Page now consumes `getGameTitle` / `getGameChip` from `game-catalog.ts`.
- Locale comes from `useAppLocale()`.
- Route input is guarded by `isWebGameId()` before adapter lookup.
- User-facing shell copy now comes from `messages.gameShell` / `messages.common`:
  - player/bot names
  - move/bot error fallbacks
  - turn labels
  - difficulty
  - match settings
  - undo/new-game controls
  - preparation/loading state
  - winner/draw/final score
- Back navigation uses `APP_ROUTES.lobby`.
- `messages.gameShell` gained only the new keys required by the real consumer: `you`, `bot`, and `finalScore`.

### Debt status after this stage

- `DEBT-006` duplicate game metadata: PARTIALLY RESOLVED — `/game` migrated; `/play` + Lobby remain.
- `DEBT-008` hard-coded game-page copy: PARTIALLY RESOLVED — local/bot page migrated; multiplayer remains.
- `DEBT-013` catalog without consumers: MITIGATED — catalog now has a real high-traffic consumer, but platform-wide cleanup is not complete.

No new runtime bug is confirmed. Executable validation is still unavailable in the connector environment.

## Remaining consumer migration order

1. `/play/[roomId]`
   - remove duplicate game presentation maps
   - consume canonical catalog/messages
   - do not alter multiplayer/game-engine behavior
2. Lobby
   - remove local `STATUS_LABEL` / `GAME_META` duplication
   - use Lobby dictionary + canonical game catalog
   - centralize game/play route construction
3. Tournaments/Profile/auth
   - migrate remaining user-facing copy
4. Atomic locale route migration
   - activate `/fa/...` and `/en/...` only when page consumers are ready
5. Admin bilingual Footer editor
6. Component Graveyard Cleanup

## Component graveyard state

- `GameShell`: CANONICAL.
- `Dice3D`: CANONICAL reusable game primitive.
- Header/Footer: CANONICAL.
- Game boards: GAME_SPECIFIC.
- `GameCard`: UNUSED_CANDIDATE / INLINE_DUPLICATE.
- `EmptyState`: UNUSED_CANDIDATE.
- `LoadingSkeleton`: UNUSED_CANDIDATE / possibly too narrow.
- `Modal`: UNUSED_CANDIDATE.

Do not delete candidates until consumer migration is complete enough and executable validation is available.

## Documentation rule

- `docs/platform-foundation.md`: architectural baseline + canonical debt ledger.
- `docs/platform-foundation-progress.md`: stage-by-stage execution log.
- `docs/HANDOFF.md`: current continuation state.

All three should stay aligned with real code state; do not rely on chat history.

## Validation

Current connector environment cannot execute the application locally.

- Build: NOT RUN
- Typecheck: NOT RUN
- Tests: NOT RUN
- Browser visual verification: NOT RUN
- Deployment: NOT RUN

Never convert these to PASS without real execution.

## Safety

- Do not modify `main` during this refactor.
- Do not modify governance branch.
- Do not deploy.
- Do not expose English routes piecemeal.
- Do not create a second app/codebase for English.
- Do not make web presentation metadata authoritative for game runtime capability.
- Do not create shared components/registries without real consumers.
