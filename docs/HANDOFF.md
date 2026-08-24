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

## Operating mode

Continue autonomously through the approved foundation/UI cleanup path. Do **not** wait for another user instruction unless a genuine human product/architecture decision is required.

After every meaningful stage:
1. update code,
2. update `docs/platform-foundation-progress.md`,
3. sync this HANDOFF,
4. update `docs/platform-foundation.md` when architecture/debt materially changes,
5. report bugs/debt honestly,
6. never claim unexecuted validation as PASS,
7. explicitly tell the user when UI cleanup has reached a useful local-run checkpoint.

User preference for the current stage: **delay local visual review until known visual/UI/component issues are reduced further.**

## Architecture

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

Locales: `fa` (RTL) and `en` (LTR).

## Public locale routing

Active on this branch through one shared page tree:

```text
/fa/lobby          /en/lobby
/fa/profile        /en/profile
/fa/leaderboard    /en/leaderboard
/fa/tournaments    /en/tournaments
/fa/game/...       /en/game/...
/fa/play/...       /en/play/...
/fa/login          /en/login
```

- Middleware rewrites localized URLs internally to shared pages.
- Root shell activates locale language/direction/theme/font/metadata.
- Header/Footer emit localized routes.
- Header now exposes an explicit FA/EN language switcher while preserving the current logical path.
- Admin remains locale-neutral.

## Completed/substantially migrated consumers

- `/game/[gameId]`
- `/play/[roomId]`
- Lobby copy/metadata
- Tournaments list
- Tournament detail/bracket
- Profile
- OTP/Login
- Leaderboard
- Header/Footer
- GameShell

Data/server-owned strings remain verbatim unless their protocol/content model is explicitly localized.

## eNamad policy — RESOLVED

Show eNamad in **both Persian and English** shells for now.

## Admin Footer

Canonical bilingual editor: `/admin/footer`.

- independent `footer.fa` / `footer.en` managed content,
- shared `FooterContent` schema,
- eNamad visibility is not editable because current product policy keeps it in both languages.

`DEBT-016`: `/admin` still contains dead legacy Footer editor state/load/save logic without rendered Footer-editor UI. Remove only when safe executable validation is available or a validated isolated rewrite is performed.

## Shared UI / Component Graveyard

Canonical by real use:
- GameShell
- Dice3D
- Header/Footer
- game-specific boards

Prepared for canonical consumer migration:
- `GameCard` — redesigned as selectable game tile with selected/focus/reduced-motion states.
- `EmptyState` — upgraded to product-level empty-state panel.
- `LoadingSkeleton` — generalized structural grid.

Still candidate:
- `Modal` — unused candidate; do not delete before executable verification.

Do not create additional wrappers unless a recurring product pattern justifies them.

## GameShell fix

A hidden bilingual defect was found and fixed: `GameShell` still contained Persian labels after the entry pages had been localized.

Now localized:
- connection state,
- room/copy controls,
- match score tooltip/text,
- rematch/back labels,
- waiting-for-opponent state.

Also:
- back arrow follows RTL/LTR,
- touched spacing uses logical properties,
- winner surface uses semantic theme colors.

Tracked as `DEBT-017` and resolved in code pending executable validation.

## Language-switcher fix

Bilingual routes previously had no visible user control to switch language. Header now exposes responsive FA/EN switching. Tracked as `DEBT-018`, resolved in code pending validation.

## Current debt focus

- `DEBT-003` GameCard mismatch — Lobby consumer migration pending.
- `DEBT-009` shared feedback primitives bypass — Lobby/common consumer migration pending.
- `DEBT-012` Admin monolith — non-blocking.
- `DEBT-015` server/data-owned localization boundary — tracked.
- `DEBT-016` dead Admin Footer logic — cleanup pending validation.
- remaining locale-neutral page links — targeted normalization pending.

## Current next action

Continue automatically:
1. migrate Lobby game selection to revised `GameCard`,
2. migrate appropriate Lobby loading/empty states to `LoadingSkeleton` / `EmptyState`,
3. normalize recurring feedback patterns,
4. inspect remaining Lobby/GameShell 360px + RTL/LTR physical assumptions,
5. known-bug pass,
6. then declare a new local visual-review checkpoint.

Do not request a local run yet unless this cleanup reaches that checkpoint or a runtime-only blocker requires it.

## Validation

Current connector environment still cannot execute the app locally.

- Build: NOT RUN
- Typecheck: NOT RUN
- Tests: NOT RUN
- Browser visual verification: NOT RUN
- Deployment: NOT RUN

Never report PASS without actual execution.

## Safety

- Keep `main` untouched.
- Keep governance branch untouched.
- No merge/deploy without explicit release authorization.
- Do not duplicate Persian/English app trees.
- Do not make presentation metadata authoritative for game rules/capability.
- Do not destructively delete graveyard candidates before consumer proof + executable validation.
