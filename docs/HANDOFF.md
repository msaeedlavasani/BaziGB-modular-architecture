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

Foundation/audit Tasks 0–3 are complete. Primary game-entry and Lobby consumers are now migrated to the bilingual/catalog foundations. Work continues autonomously into remaining page-copy migration unless a genuine human product/architecture decision is required.

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
- `apps/web/src/i18n/messages.ts`: typed shared messages for shell/game/multiplayer/lobby/tournament/footer foundations.
- `apps/web/src/i18n/routing.ts`: language-neutral routes plus locale prefix/strip/resolution helpers.
- `apps/web/src/hooks/useAppLocale.ts`: canonical client locale resolver.
- locale-aware MUI theme factory and Providers inputs.
- Header/Footer locale-aware shell copy and centralized route identities.
- bilingual Footer Web/Server contract with legacy Persian compatibility and `footer.fa` / `footer.en` storage.
- `apps/web/src/lib/game-catalog.ts`: canonical web presentation bridge for `GameId`; runtime capability remains GameAdapter/server-owned.

## Completed consumer stages

### `/game/[gameId]`
- Local title/chip maps removed.
- Uses catalog + typed game-shell messages + `useAppLocale()`.
- Guards game IDs through `isWebGameId()`.

### `/play/[roomId]`
- Local title/chip maps and page-local allowlist removed.
- Uses catalog + multiplayer messages + `useAppLocale()`.
- Waiting/spectator/turn/winner/chat/room-share copy localized.
- Presentation capacity uses catalog fallback; runtime capacity remains server-owned.
- Socket/gameplay behavior preserved.

### Lobby
- Removed `STATUS_LABEL`, `GAME_META`, `GAME_OPTIONS`, custom GameType metadata duplication.
- Game choices come from `WEB_GAME_IDS`; names from `getGameTitle()`.
- History/room game IDs use `isWebGameId()`.
- Game/play navigation uses `gameRoute()` / `playRoute()`.
- Lobby copy, errors, results, controls, room statuses and match-point labels moved to typed messages.
- Recent-match date formatting is locale-aware.
- Room player-capacity display uses catalog presentation fallback rather than `vegas ? 5 : 2` UI logic.
- Directional room-row hover movement changed to vertical movement for RTL/LTR neutrality.
- Existing inline loading/empty/game-card structures were intentionally preserved; component-graveyard cleanup is a later stage.

## Debt status

- `DEBT-001` global locale/direction: partially mitigated; active locale route layouts remain.
- `DEBT-002` Lobby mixed-language page copy: SUBSTANTIALLY RESOLVED.
- `DEBT-003` GameCard canonicality mismatch: OPEN; cleanup later.
- `DEBT-004` singleton RTL theme: foundation mitigated.
- `DEBT-005` Footer single-locale: Web/Server mitigated; Admin + active routing remain.
- `DEBT-006` duplicate game presentation metadata: RESOLVED for `/game`, `/play`, Lobby primary consumers.
- `DEBT-007` route literal dispersion / locale-neutral active routes: partially mitigated; atomic locale route migration remains.
- `DEBT-008` hard-coded game-entry copy: substantially resolved.
- `DEBT-009` shared feedback primitives bypass: OPEN; intentionally not mixed into localization migration.
- `DEBT-010` Tournament mixed-language copy: CURRENT NEXT MIGRATION.
- `DEBT-011` Footer Web/Admin/Server coupling: Admin remains.
- `DEBT-012` Admin monolith: non-blocking.
- `DEBT-013` catalog graveyard risk: RESOLVED; three primary consumers now use the catalog.

## Current next action

Continue automatically with bilingual page-content migration:

1. Tournaments.
2. Profile/common feedback.
3. Auth pages and remaining high-traffic shell copy.
4. Then prepare/execute atomic locale route migration.
5. Admin bilingual Footer editor.
6. Component Graveyard Cleanup.
7. Known-bug pass and executable validation in a suitable environment.

Pause only if a human decision is genuinely required.

## Known content boundary

Server-originated chat/system payload text is server-owned; client code localizes only client-owned labels. If server messages are Persian-only, handle that later as a protocol/content-boundary task.

## Documentation rule

- `docs/platform-foundation.md`: architectural baseline + canonical debt ledger.
- `docs/platform-foundation-progress.md`: stage execution log.
- `docs/HANDOFF.md`: current continuation state.

Update HANDOFF and progress documentation after each meaningful stage.

## Validation

Current connector environment cannot execute the application locally.

- Build: NOT RUN
- Typecheck: NOT RUN
- Tests: NOT RUN
- Browser visual verification: NOT RUN
- Deployment: NOT RUN

Never report PASS without actual execution.

## Safety

- `main` remains untouched.
- Governance branch remains untouched.
- No deploy.
- Do not expose English routes piecemeal.
- Do not create a second codebase for English.
- Do not make web presentation metadata authoritative for runtime game capability.
- Do not delete graveyard candidates before consumer migration + executable validation.
- Continue stage-to-stage autonomously until human input is genuinely required.
