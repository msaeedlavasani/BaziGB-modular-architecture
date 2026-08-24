# BaziGB Platform Foundation

**Status:** Active refactor baseline
**Working branch:** `refactor/platform-foundation-i18n-v3`
**Base:** latest `main`
**Governance source:** `ai/autonomous-development-system-v1` (latest verified rules)

This document is the working record for the platform-foundation refactor. It covers baseline, bilingual architecture, component inventory, and discovered blockers/bugs without duplicating governance documents.

## 0. Task 0–3 Progress

| Task | Status | Notes |
|---|---|---|
| 0. Baseline & Governance Check | COMPLETE FOR THIS BRANCH | Work is isolated from `main`; no deployment is authorized; runtime validation is still NOT RUN in the current tool environment. |
| 1. Persian / English Architecture | IN PROGRESS | Locale config/theme/shell messages are present. Footer read contract and shell copy are now locale-aware with backward-compatible Persian legacy data. Locale-scoped routes are still pending. |
| 2. Platform Architecture Audit | IN PROGRESS | Cross-layer localization, duplicated game presentation metadata, mixed-language copy, and admin coupling are recorded below. |
| 3. Component Inventory | IN PROGRESS | Primary shared/layout/game components have been inspected and consumer evidence recorded. Deletion/consolidation has not started. |

## 1. Baseline

### Current verified platform facts

- Frontend: Next.js 14 / React 18 / MUI 5 / Emotion 11.
- `main` is Persian-first and public routes are currently locale-neutral (`/lobby`, `/profile`, `/play/...`, `/game/...`, etc.).
- Shared business logic and modular game packages are separate from the web application and remain shared across locales.
- Existing UI contains Persian and English strings in the same pages.
- Local/bot and multiplayer game flows both reuse `GameShell`.
- Site settings persistence is generic JSON-by-key, so bilingual footer storage does not require a Prisma/database schema migration.

### Foundation changes already made on this branch

- `apps/web/src/i18n/config.ts`: typed `fa` / `en` locale configuration.
- `createBaziGBTheme({ direction, fontFamily })`: locale-aware theme construction while preserving Persian defaults.
- `Providers`: direction/font inputs instead of permanent RTL assumptions.
- Root layout derives default language/direction/metadata/theme inputs from locale config.
- Typed shell messages are used by Header and Footer.
- Footer client contract now supports locale-specific content and preserves legacy Persian `footer` data.
- Server `/site-settings` now returns backward-compatible `footer` plus locale-aware `footers.fa` / `footers.en`.
- Locale-specific settings can be stored under `footer.fa` / `footer.en`; existing Admin legacy writes remain compatible.
- Added `apps/web/src/lib/game-catalog.ts` as a language-neutral presentation catalog linking stable `GameId` values to locale message keys, chip symbols, and player-capacity presentation metadata.

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

Current migration-compatible contract:

```text
legacy: footer
new:    footers.fa / footers.en
storage keys: footer, footer.fa, footer.en
```

Rules:
- Legacy `footer` is treated as Persian only.
- English never silently inherits Persian managed content.
- Server returns the old `footer` field so old clients/admin behavior remains valid.
- New web reads may request locale-specific footer content.
- Admin bilingual editing is still pending; the existing editor continues to write the legacy Persian footer until that UI is migrated.
- Locale-aware links remain a web routing concern; locale-neutral game/business data must not absorb routing copy.

## 3. Component Inventory

### Shared UI

| Component | Assessment | Evidence / action |
|---|---|---|
| `EmptyState` | `UNUSED_CANDIDATE` | No consumer was found in the inspected primary pages/code-search pass; Lobby implements its own empty-state presentation. Keep until cleanup validation confirms full-repo consumer status. |
| `GameCard` | `UNUSED_CANDIDATE / INLINE_DUPLICATE` | Component explicitly represents Lobby game selection, while Lobby currently owns its own inline game-card implementation. Strong component-graveyard signal. |
| `LoadingSkeleton` | `UNUSED_CANDIDATE / TOO_NARROW?` | Inspected Lobby/Profile/Tournaments use local MUI Skeleton structures. Decide whether to generalize into a real product pattern or delete after consumer verification. |
| `Modal` | `UNUSED_CANDIDATE` | Primary inspected pages use direct MUI Dialog patterns; no indexed consumer found in the targeted search pass. Do not delete before cleanup validation. |

### Application layout

| Component | Assessment | Evidence / action |
|---|---|---|
| `Header` | `CANONICAL` | Global shell component; locale-aware labels already introduced. Route localization pending. |
| `Footer` | `CANONICAL` | Global shell component; managed copy + rules/contact labels are now locale-aware at contract/component level. Route localization and bilingual Admin editing pending. |

### Game UI

| Component | Assessment | Evidence / action |
|---|---|---|
| `GameShell` | `CANONICAL` | Confirmed shared by both local/bot and multiplayer entry pages. Future games should extend it rather than create a parallel shell. |
| `Dice3D` | `CANONICAL REUSABLE GAME PRIMITIVE` | Confirmed consumer in `BackgammonBoard`; supports normal die and doubling-cube display. |
| `BackgammonBoard` | `GAME_SPECIFIC` | Uses shared Dice3D and game-specific interaction logic. |
| `ChessBoard` | `GAME_SPECIFIC` | Game-specific board. |
| `ChessInfo` | `GAME_SPECIFIC` | Supporting game UI. |
| `TicTacToeBoard` | `GAME_SPECIFIC` | Game-specific board. |
| `VegasBoard` | `GAME_SPECIFIC` | Game-specific board. |

### Page-level findings

- Lobby owns inline game-selection and Recently Played presentation rather than composing shared candidates.
- Profile and Tournaments use local loading/state patterns.
- Admin combines stats, users, rooms, destructive actions, and Footer editor in one large page.
- Raw MUI usage is not itself debt; only repeated product patterns should become shared abstractions.

## 4. Component Graveyard Rules

Before deletion or new abstraction:

1. verify component exists,
2. inspect implementation,
3. find current consumers,
4. compare inline/duplicate implementations,
5. choose one canonical implementation,
6. migrate consumers,
7. remove dead duplicates only after validation.

Classification:
`CANONICAL`, `DUPLICATE`, `INLINE_DUPLICATE`, `UNUSED_CANDIDATE`, `GAME_SPECIFIC`, `NEEDS_SPLIT`, `NEEDS_MERGE`.

## 5. Canonical Game Presentation Metadata

New source: `apps/web/src/lib/game-catalog.ts`.

Purpose:
- Stable game identity remains `GameId` from the engine.
- Localized game names remain in i18n messages.
- Presentation-only symbols/capacity metadata have one web source rather than duplicate page maps.

Current catalog includes:
- Tic-Tac-Toe
- Backgammon
- Chess
- Vegas

Migration is **not yet complete**: `/game/[gameId]`, `/play/[roomId]`, and Lobby still contain local maps/metadata and must be switched to the catalog in the cleanup/refactor phase. The new catalog must not become another dead registry; consumer migration is mandatory before this debt is marked resolved.

## 6. Bug / Debt Ledger

### DEBT-001 — Global locale/direction assumptions
- Severity: High for bilingual rollout
- Status: PARTIALLY MITIGATED
- Remaining: locale-scoped layouts/routes.

### DEBT-002 — Mixed-language Lobby copy
- Severity: Medium
- Status: OPEN
- Action: dictionary migration.

### DEBT-003 — GameCard canonicality mismatch
- Severity: Medium
- Status: OPEN
- Action: choose canonical Lobby card during component cleanup.

### DEBT-004 — Singleton RTL theme coupling
- Severity: High
- Status: MITIGATED at foundation level
- Remaining: active locale layouts must provide inputs.

### DEBT-005 — Footer was single-locale
- Severity: Medium
- Status: PARTIALLY MITIGATED
- Implemented: locale-aware read/storage contract, English defaults, shell labels.
- Remaining: bilingual Admin editor + localized routing.

### DEBT-006 — Duplicate game presentation metadata
- Severity: Medium
- Status: PARTIALLY MITIGATED
- Implemented: canonical web game catalog.
- Remaining: migrate Lobby/local game/multiplayer consumers and remove page-local maps.

### DEBT-007 — Locale-aware copy before locale-aware links
- Severity: High if English exposed early
- Status: OPEN / intentionally contained
- Action: atomic locale route migration.

### DEBT-008 — Hard-coded Persian game-page copy
- Severity: Medium
- Status: OPEN
- Action: move presentation copy to dictionaries without touching engine state.

### DEBT-009 — Shared feedback primitives bypassed
- Severity: Medium
- Status: OPEN
- Action: canonicalize product-level loading/empty/error patterns or delete abstractions that do not earn their existence.

### DEBT-010 — English-only Tournament copy inside Persian-first UI
- Severity: Medium
- Status: OPEN
- Action: dictionary migration.

### DEBT-011 — Footer localization spans Web + Admin + Server
- Severity: Medium
- Status: PARTIALLY MITIGATED
- Server/Web contract is coherent; Admin bilingual editing remains.

### DEBT-012 — Admin page operational monolith
- Severity: Low/Medium
- Status: OPEN / non-blocking
- Action: later decomposition; do not expand current scope solely for cleanup aesthetics.

### DEBT-013 — Canonical game catalog exists before consumer migration
- Severity: Low while branch-only; Medium if left unfinished
- Status: TRACKED
- Risk: creating a second registry would reproduce the component-graveyard problem at metadata level.
- Required resolution: migrate all game presentation consumers before calling DEBT-006 resolved.

## 7. Next Execution Order

1. Migrate duplicated game presentation consumers to `game-catalog.ts`.
2. Introduce broader locale dictionaries for Lobby, game shell/pages, Profile/Tournaments and common feedback copy.
3. Implement locale-scoped route/layout structure atomically, including Header/Footer link generation.
4. Add bilingual Admin footer editing using `footer.fa` / `footer.en` while retaining legacy read compatibility during rollout.
5. Canonicalize `GameCard`, empty/loading/error patterns and remove actual dead components after validation.
6. Standardize Lobby and GameShell only after the shared primitives are canonical.

## 8. Safety / Validation

- `main` remains untouched.
- No deployment is part of Tasks 0–3.
- Runtime build/typecheck/tests/browser verification are **NOT RUN** in the current connector-only environment and must not be reported as PASS.
- No repeated visual verification loop is justified for this foundation stage.
- `docs/HANDOFF.md` must be synchronized after each meaningful stage.
