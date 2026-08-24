# BaziGB Platform Foundation

**Status:** Foundation audit baseline complete; implementation cleanup next
**Working branch:** `refactor/platform-foundation-i18n-v3`
**Base:** `main` at branch creation; branch currently remains ahead only
**Governance source:** `ai/autonomous-development-system-v1` (latest verified rules)

This document is the working record for the platform-foundation refactor. It records the bilingual architecture, component inventory, cross-layer debt, and execution boundary without duplicating governance documents.

## 0. Task 0–3 Progress

| Task | Status | Notes |
|---|---|---|
| 0. Baseline & Governance Check | COMPLETE FOR THIS BRANCH | Work is isolated from `main`; no deployment is authorized; runtime validation is NOT RUN in the current connector-only environment. |
| 1. Persian / English Architecture | COMPLETE AS FOUNDATION / MIGRATION PENDING | Shared-code + locale-content architecture is established; typed locale/theme/messages/routing primitives and bilingual Footer contract exist. Locale route-tree/page migration is the next implementation phase, not an unresolved architecture question. |
| 2. Platform Architecture Audit | COMPLETE FOR FOUNDATION SCOPE | Cross-layer localization, metadata duplication, mixed-language pages, shared-component bypass, and Admin coupling are recorded in the debt ledger. |
| 3. Component Inventory | COMPLETE FOR INITIAL HIGH-TRAFFIC SCOPE | Canonical vs graveyard candidates are classified for shared/layout/game primitives. Deletion/consolidation intentionally waits for consumer migration + executable validation. |

## 1. Baseline

### Verified platform facts

- Frontend: Next.js 14 / React 18 / MUI 5 / Emotion 11.
- `main` is Persian-first and public routes are currently locale-neutral (`/lobby`, `/profile`, `/play/...`, `/game/...`, etc.).
- Shared business logic and modular game packages are separate from the web application and remain shared across locales.
- Existing UI contains Persian and English strings in the same pages.
- Local/bot and multiplayer game flows both reuse `GameShell`.
- Site settings persistence is generic JSON-by-key, so bilingual Footer storage does not require a Prisma/database schema migration.
- The refactor branch is ahead of `main` and has not been merged or deployed.

### Foundation code introduced on this branch

- `apps/web/src/i18n/config.ts`
  - typed `fa` / `en` configuration
  - `rtl` / `ltr`
  - locale font stacks
  - locale metadata
- `apps/web/src/i18n/messages.ts`
  - typed shared messages for navigation, common feedback, game shell, Lobby, Tournaments, games and Footer
- `apps/web/src/i18n/routing.ts`
  - language-neutral route identities
  - locale prefix/strip helpers
  - path-locale resolution
  - dynamic game/play route builders
- `createBaziGBTheme({ direction, fontFamily })`
  - locale-aware theme construction with Persian default compatibility
- `Providers`
  - direction/font inputs instead of permanent RTL assumptions
- Root layout
  - derives default language/direction/metadata/theme inputs from locale configuration
- Header/Footer
  - consume typed locale messages
  - route identities are centralized through `APP_ROUTES`
  - Header active-state logic tolerates both current locale-neutral and future locale-prefixed paths via `stripLocale`
- Footer/Site Settings
  - locale-specific defaults and read contract
  - backward-compatible legacy Persian footer
  - server returns `footer` plus `footers.fa` / `footers.en`
  - locale-specific storage keys `footer.fa` / `footer.en`
- `apps/web/src/lib/game-catalog.ts`
  - canonical web presentation bridge for stable `GameId`
  - localized names remain in i18n messages
  - chip symbols and presentation fallback capacity have one source
  - safe `isWebGameId` / catalog lookup helpers

## 2. Bilingual Target Architecture

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

### Supported locales

- `fa` — Persian / RTL / Vazirmatn-first.
- `en` — English / LTR / Latin system stack until Design System specifies otherwise.

### Target routing

```text
/fa/lobby
/en/lobby
/fa/profile
/en/profile
/fa/play/[roomId]
/en/play/[roomId]
/fa/game/[gameId]
/en/game/[gameId]
```

Root may redirect to the default locale (`fa`). Route migration must be atomic rather than partially exposing English routes.

### Routing rule

`APP_ROUTES` stores language-neutral route identities. `localePath` / `localizedAppRoute` add locale scope only when the locale route tree is actually introduced.

Do not scatter hard-coded `/fa` and `/en` strings through components.

### Translation boundary

Localized:
- UI copy and labels
- metadata
- validation/user-facing messages
- navigation text
- accessibility labels
- managed presentation content such as footer copy

Language-neutral:
- game rules and state keys
- IDs / API payload fields / database fields
- engine enums and business contracts

### Managed Footer contract

Migration-compatible contract:

```text
legacy response/storage: footer
new response:             footers.fa / footers.en
new storage keys:         footer.fa / footer.en
```

Rules:
- Legacy `footer` is treated as Persian only.
- English never silently inherits Persian managed content.
- Server retains `footer` so old clients/Admin behavior remains compatible during migration.
- New web reads request locale-specific footer content.
- Admin bilingual editing remains pending; current editor still writes the legacy Persian footer.
- eNamad visibility in a future English shell is a presentation/product policy question and has not been silently changed.

## 3. Component Inventory

### Shared UI

| Component | Assessment | Evidence / action |
|---|---|---|
| `EmptyState` | `UNUSED_CANDIDATE` | No consumer found in inspected primary pages/targeted search; Lobby implements its own empty-state presentation. Keep until cleanup validation confirms consumer status. |
| `GameCard` | `UNUSED_CANDIDATE / INLINE_DUPLICATE` | Explicitly represents Lobby game selection while Lobby currently owns a separate inline implementation. Strongest component-graveyard signal. |
| `LoadingSkeleton` | `UNUSED_CANDIDATE / TOO_NARROW?` | Lobby/Profile/Tournaments use local MUI Skeleton structures. Either earn a canonical product pattern or remove after migration/validation. |
| `Modal` | `UNUSED_CANDIDATE` | Primary inspected pages use direct MUI Dialog patterns; no indexed consumer found in the targeted pass. Do not delete before executable cleanup validation. |

### Application layout

| Component | Assessment | Evidence / action |
|---|---|---|
| `Header` | `CANONICAL` | Global shell; locale-aware labels; language-neutral route identities centralized; active detection prepared for locale-prefixed paths. |
| `Footer` | `CANONICAL` | Global shell; locale-aware managed copy and labels; bilingual Admin editing + locale route generation still pending. |

### Game UI

| Component | Assessment | Evidence / action |
|---|---|---|
| `GameShell` | `CANONICAL` | Shared by local/bot and multiplayer entry pages. New games should extend it rather than introduce a parallel shell. |
| `Dice3D` | `CANONICAL REUSABLE GAME PRIMITIVE` | Confirmed consumer in `BackgammonBoard`; supports normal die and doubling-cube display. |
| `BackgammonBoard` | `GAME_SPECIFIC` | Uses shared Dice3D and game-specific interaction logic. |
| `ChessBoard` | `GAME_SPECIFIC` | Game-specific board. |
| `ChessInfo` | `GAME_SPECIFIC` | Supporting game UI. |
| `TicTacToeBoard` | `GAME_SPECIFIC` | Game-specific board. |
| `VegasBoard` | `GAME_SPECIFIC` | Game-specific board. |

### Page-level findings

- Lobby owns inline game-selection and Recently Played presentation rather than composing shared candidates.
- Profile and Tournaments use local loading/state patterns.
- Tournaments contains English-only product copy inside Persian-first UI.
- Game entry pages contain hard-coded Persian game-shell copy and duplicate game title/chip maps.
- Admin combines stats, users, rooms, destructive actions and Footer editing in one large page.
- Raw MUI usage is not itself debt; only repeated product patterns should become shared abstractions.

## 4. Component Graveyard Rules

Before deletion or new abstraction:

1. verify component exists,
2. inspect implementation,
3. find current consumers,
4. compare inline/duplicate implementations,
5. choose one canonical implementation,
6. migrate consumers,
7. run justified validation,
8. remove dead duplicates only after evidence is sufficient.

Classification:
`CANONICAL`, `DUPLICATE`, `INLINE_DUPLICATE`, `UNUSED_CANDIDATE`, `GAME_SPECIFIC`, `NEEDS_SPLIT`, `NEEDS_MERGE`.

The goal is not to wrap every MUI primitive. The goal is to prevent product-level patterns and registries from multiplying without real consumers.

## 5. Canonical Game Presentation Metadata

Source: `apps/web/src/lib/game-catalog.ts`.

Purpose:
- Stable game identity remains `GameId` from the engine.
- Localized game names remain in i18n messages.
- Presentation-only symbols and fallback capacity metadata have one web source.
- `isWebGameId` provides one validation boundary for route/UI inputs.

Current catalog:
- Tic-Tac-Toe
- Backgammon
- Chess
- Vegas

Important boundary:
`maxPlayers` in this web catalog is presentation fallback only. Runtime/canonical player capability belongs to `GameAdapter`, not the web registry.

Migration remains mandatory: `/game/[gameId]`, `/play/[roomId]`, and Lobby still own local presentation maps. The catalog must gain real consumers before DEBT-006/013 can be resolved.

## 6. Bug / Debt Ledger

### DEBT-001 — Global locale/direction assumptions
- Severity: High for bilingual rollout
- Status: PARTIALLY MITIGATED
- Remaining: locale-scoped layouts/routes must activate the correct locale rather than default Persian only.

### DEBT-002 — Mixed-language Lobby copy
- Severity: Medium
- Status: PREPARED / CONSUMER MIGRATION PENDING
- Shared Lobby message keys now exist; page migration remains.

### DEBT-003 — GameCard canonicality mismatch
- Severity: Medium
- Status: OPEN
- Action: choose canonical Lobby card during component cleanup.

### DEBT-004 — Singleton RTL theme coupling
- Severity: High
- Status: MITIGATED AT FOUNDATION LEVEL
- Remaining: locale-scoped layouts must provide the active locale values.

### DEBT-005 — Footer was single-locale
- Severity: Medium
- Status: PARTIALLY MITIGATED
- Implemented: locale-aware read/storage contract, English defaults, localized shell labels.
- Remaining: bilingual Admin editor + active locale routing.

### DEBT-006 — Duplicate game presentation metadata
- Severity: Medium
- Status: PARTIALLY MITIGATED
- Implemented: canonical game catalog + safe helpers.
- Remaining: migrate Lobby/local game/multiplayer consumers and remove page-local maps.

### DEBT-007 — Locale-aware copy before locale-aware links
- Severity: High if English exposed early
- Status: PARTIALLY MITIGATED / CONTAINED
- Implemented: central `APP_ROUTES`, prefix/strip helpers, shell links no longer repeat route literals.
- Remaining: atomic locale route-tree migration; do not expose English early.

### DEBT-008 — Hard-coded Persian game-page copy
- Severity: Medium
- Status: PREPARED / CONSUMER MIGRATION PENDING
- Shared game-shell message keys now exist; game pages still need migration.

### DEBT-009 — Shared feedback primitives bypassed
- Severity: Medium
- Status: OPEN
- Action: canonicalize real product-level loading/empty/error patterns or delete abstractions that do not earn their existence.

### DEBT-010 — English-only Tournament copy inside Persian-first UI
- Severity: Medium
- Status: PREPARED / CONSUMER MIGRATION PENDING
- Localized tournament status/fallback message keys now exist; page migration remains.

### DEBT-011 — Footer localization spans Web + Admin + Server
- Severity: Medium
- Status: PARTIALLY MITIGATED
- Server/Web contract is coherent; Admin bilingual editing remains.

### DEBT-012 — Admin page operational monolith
- Severity: Low/Medium
- Status: OPEN / NON-BLOCKING
- Action: later decomposition; do not expand scope solely for aesthetics.

### DEBT-013 — Canonical game catalog exists before consumer migration
- Severity: Low while branch-only; Medium if left unfinished
- Status: TRACKED
- Required resolution: migrate all game presentation consumers before calling DEBT-006 resolved.

### BUG-001 — No new runtime bug confirmed during this stage
- Status: NONE CONFIRMED
- Note: executable validation is unavailable here, so compile/runtime regressions cannot be ruled out until local validation runs.

## 7. Next Execution Phase

Task 0–3 audit/foundation baseline is closed. Next work moves into implementation cleanup:

1. **Component/metadata consumer migration**
   - `/game/[gameId]` → game catalog + shared game-shell messages
   - `/play/[roomId]` → game catalog + shared messages
   - Lobby → game catalog + Lobby dictionary
2. **Bilingual content migration**
   - Tournaments
   - Profile/common feedback
   - auth and remaining shell copy
3. **Atomic locale route-tree migration**
   - `/fa/...` and `/en/...`
   - active locale layout/theme/metadata
   - localized link helper adoption
4. **Admin bilingual Footer editor**
   - edit `footer.fa` and `footer.en`
   - preserve legacy read compatibility during rollout
5. **Component Graveyard Cleanup**
   - canonicalize GameCard/feedback patterns
   - delete only proven dead abstractions after executable validation
6. **Lobby + GameShell standardization**

## 8. Safety / Validation

- `main` remains untouched.
- Governance branch remains untouched.
- No deployment is authorized in this phase.
- Runtime build/typecheck/tests/browser verification are **NOT RUN** in the current connector-only environment and must not be reported as PASS.
- No repeated visual verification loop is justified for this foundation stage.
- `docs/HANDOFF.md` must be synchronized after each meaningful stage.
