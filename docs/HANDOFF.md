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

Foundation/audit Tasks 0–3 are complete for their agreed scope. Work is in targeted bilingual consumer migration and now proceeds autonomously from one implementation stage to the next unless a genuine human product/architecture decision is required.

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
- `apps/web/src/hooks/useAppLocale.ts`: canonical client locale resolver. Locale-neutral routes resolve to Persian during migration; future `/fa/*` and `/en/*` routes use the same hook.
- locale-aware MUI theme factory and Providers inputs.
- Header/Footer locale-aware shell copy and centralized route identities.
- bilingual Footer Web/Server contract with legacy Persian compatibility and `footer.fa` / `footer.en` storage.
- `apps/web/src/lib/game-catalog.ts`: canonical web presentation bridge for `GameId`; runtime capability remains owned by GameAdapter/server.

## Completed consumer stages

### `/game/[gameId]`

- Local `GAME_TITLES` / `GAME_CHIPS` removed.
- Consumes canonical catalog and shared game-shell messages.
- Uses `useAppLocale()`.
- Guards route input with `isWebGameId()`.
- Back navigation uses `APP_ROUTES.lobby`.

### `/play/[roomId]`

- Local game title/chip maps removed.
- Room game-type allowlist duplication removed; normalization uses `isWebGameId()`.
- Uses `useAppLocale()` and typed multiplayer messages.
- Waiting/spectator/turn/winner/chat/room-share copy is locale-aware.
- Waiting-room player capacity **display** uses `game-catalog` fallback instead of `vegas ? 5 : 2` UI logic; runtime capacity remains server/GameAdapter-owned.
- Chat alignment uses logical `start`, compatible with both RTL/LTR.
- Socket protocol, gameplay actions, room lifecycle and board dispatch were intentionally not changed.

## Debt status

- `DEBT-001` global locale/direction: partially mitigated; active locale route layouts remain.
- `DEBT-002` Lobby mixed-language copy: ACTIVE NEXT MIGRATION.
- `DEBT-003` GameCard canonicality mismatch: open.
- `DEBT-004` singleton RTL theme: foundation mitigated.
- `DEBT-005` Footer single-locale: Web/Server mitigated; Admin + active routing remain.
- `DEBT-006` duplicate game metadata: substantially mitigated; `/game` + `/play` migrated, Lobby remains.
- `DEBT-007` locale-aware copy vs locale-neutral links: contained until atomic route migration.
- `DEBT-008` hard-coded game-page copy: substantially resolved for entry pages; game-specific components/server-originated copy are separate boundaries.
- `DEBT-009` shared feedback primitives bypass: open.
- `DEBT-010` Tournament mixed language: migration pending.
- `DEBT-011` Footer Web/Admin/Server coupling: Admin remains.
- `DEBT-012` Admin monolith: non-blocking.
- `DEBT-013` catalog-without-consumers graveyard risk: RESOLVED; catalog now has two high-traffic consumers. Lobby migration still needed for platform-wide metadata cleanup.

## Current next action — Lobby

Proceed without waiting for approval unless a real human decision appears.

Lobby migration goals:

- remove local `STATUS_LABEL` / `GAME_META` metadata duplication where canonical catalog/messages already cover the need,
- use `useAppLocale()` + `messages.lobby`,
- centralize game/play route construction,
- preserve current room/create/history behavior,
- record any product copy that requires new dictionary keys only when a real consumer needs them,
- do not solve Component Graveyard cleanup in the same pass unless migration requires choosing a canonical component.

After Lobby:

1. Tournaments/Profile/auth copy migration.
2. Atomic `/fa/...` + `/en/...` route migration.
3. Admin bilingual Footer editor.
4. Component Graveyard Cleanup.
5. Lobby/GameShell standardization and known-bug pass.

## Important boundary discovered in multiplayer

Server-originated chat/system message payloads are not translated by the web client; only client-owned labels are localized. If those payloads are Persian-only, solve them as a server/protocol content-boundary task later rather than client string replacement.

## Documentation rule

- `docs/platform-foundation.md`: architectural baseline + canonical debt ledger.
- `docs/platform-foundation-progress.md`: stage-by-stage execution log.
- `docs/HANDOFF.md`: current continuation state.

Keep them aligned with real code state after every meaningful stage.

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
- Continue autonomously stage-to-stage unless a genuine human decision is required.
