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

Tasks 0–3 (foundation/audit) are complete for their agreed scope. Work has moved into implementation cleanup and bilingual consumer migration.

Target architecture remains:

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
- `apps/web/src/i18n/useAppLocale.ts`: route-aware client locale resolver added in the current stage. Locale-neutral routes resolve to Persian during migration; future `/fa/*` and `/en/*` consumers use the same hook.
- locale-aware MUI theme factory and Providers inputs.
- Header/Footer locale-aware shell copy and centralized route identities.
- bilingual Footer Web/Server contract with legacy Persian compatibility and `footer.fa` / `footer.en` storage.
- `apps/web/src/lib/game-catalog.ts`: canonical web presentation bridge for `GameId`; runtime capability remains owned by GameAdapter.

## Current implementation stage

### Consumer migration

Goal:

1. `/game/[gameId]` consumes `game-catalog` + shared game-shell messages.
2. `/play/[roomId]` consumes `game-catalog` + shared messages.
3. Lobby consumes `game-catalog` + Lobby messages.
4. Then Tournaments/Profile/auth move to dictionaries.
5. Locale route tree is activated only after these consumers are ready.

A client-side locale hook now exists so each large client page does not invent pathname/locale parsing independently.

### Important evidence from current consumers

- Lobby still owns local `STATUS_LABEL`, `GAME_META`, `GAME_OPTIONS`, recent-result labels, errors and route literals.
- `/game/[gameId]` still owns duplicate `GAME_TITLES` and `GAME_CHIPS` plus Persian game-shell copy.
- These are the next consumers to migrate; the canonical catalog/dictionaries must not remain unused abstractions.

## Component graveyard state

- `GameShell`: CANONICAL.
- `Dice3D`: CANONICAL reusable game primitive.
- Header/Footer: CANONICAL.
- Game boards: GAME_SPECIFIC.
- `GameCard`: UNUSED_CANDIDATE / INLINE_DUPLICATE; strongest graveyard signal.
- `EmptyState`: UNUSED_CANDIDATE.
- `LoadingSkeleton`: UNUSED_CANDIDATE / possibly too narrow.
- `Modal`: UNUSED_CANDIDATE.

Do not delete candidates until consumers are migrated and executable validation is available.

## Active debt / bug summary

- DEBT-001 global locale/direction: partially mitigated; locale route layouts remain.
- DEBT-002 Lobby mixed-language copy: migration pending.
- DEBT-003 GameCard canonicality mismatch: open.
- DEBT-004 singleton RTL theme: foundation mitigated.
- DEBT-005 Footer single-locale: Web/Server mitigated; Admin + active routing remain.
- DEBT-006 duplicate game metadata: catalog exists; consumer migration pending.
- DEBT-007 locale-aware copy vs locale-neutral links: contained until atomic route migration.
- DEBT-008 hard-coded game-page copy: migration pending.
- DEBT-009 shared feedback primitives bypass: open.
- DEBT-010 Tournament mixed language: migration pending.
- DEBT-011 Footer Web/Admin/Server coupling: Admin remains.
- DEBT-012 Admin monolith: non-blocking.
- DEBT-013 catalog without consumers: active until migration completes.
- BUG-001: no runtime bug confirmed yet; runtime validation has not run.

## Next action

Continue targeted consumer migration without broad repo rediscovery:

- migrate `/game/[gameId]` first,
- then `/play/[roomId]`,
- then Lobby,
- update dictionaries/catalog only when a real consumer needs the key,
- record new debt/bugs as discovered,
- keep this HANDOFF and `docs/platform-foundation.md` synchronized after each meaningful stage.

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
