# BaziGB Platform Foundation

**Status:** Active refactor baseline
**Working branch:** `refactor/platform-foundation-i18n-v3`
**Base:** latest `main`
**Governance source:** `ai/autonomous-development-system-v1` (latest verified rules)

This document is the single working record for the platform-foundation refactor. It covers the initial baseline, bilingual architecture, component inventory, and discovered blockers/bugs. It should not duplicate `AGENTS.md`, `AI_CONTEXT_MAP.md`, or `DESIGN_SYSTEM.md`.

## 0. Task 0–3 Progress

| Task | Status | Notes |
|---|---|---|
| 0. Baseline & Governance Check | IN PROGRESS | Work is isolated from `main`; latest governance is being treated as the execution source. No deployment is authorized. |
| 1. Persian / English Architecture | IN PROGRESS | Locale config, localized metadata/direction/font model, locale-aware theme factory, and typed shell messages introduced without changing current routes. |
| 2. Platform Architecture Audit | IN PROGRESS | Initial frontend/platform coupling and duplication findings are recorded in the debt ledger. |
| 3. Component Inventory | IN PROGRESS | Shared/layout/game component inventory started; no component deletion has been performed. |

## 1. Baseline

### Current verified platform facts

- Frontend: Next.js 14 / React 18 / MUI 5 / Emotion 11.
- `main` is Persian-first and the current public route tree is locale-neutral (`/lobby`, `/profile`, `/play/...`, `/game/...`, etc.).
- Shared business logic and modular game packages are already separate from the web application and must remain shared across locales.
- Existing UI contains both Persian and English strings in the same pages, so language separation is currently incomplete.
- Both local/bot game flow and multiplayer room flow reuse `GameShell`, but each page currently owns duplicate presentation metadata such as game titles/chips.

### Foundation changes already made on this branch

- Added `apps/web/src/i18n/config.ts` with typed `fa` / `en` locale configuration.
- Replaced singleton-only theme construction with `createBaziGBTheme({ direction, fontFamily })` while preserving the current Persian default theme.
- Updated `Providers` so direction and font family are locale inputs rather than permanent global assumptions.
- Root layout now derives default language, direction, metadata, and theme inputs from locale configuration while preserving current Persian behavior.
- Added typed shell messages and made the Header copy locale-aware; route URLs are intentionally unchanged until the route migration is performed atomically.

## 2. Bilingual Target Architecture

BaziGB will use one shared product/codebase with locale-specific presentation rather than two duplicated applications.

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

- `fa` — Persian, RTL, Persian-localized content and metadata.
- `en` — English, LTR, English-localized content and metadata.

### Target routing

Public application routes should become locale-scoped:

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

A root/default route may redirect to the default locale (`fa`) until locale preference persistence is introduced.

### Non-goals

- Do not duplicate page implementations into separate Persian and English copies.
- Do not duplicate game engines or business logic per locale.
- Do not create locale-specific API endpoints unless a real backend requirement exists.
- Do not introduce a second UI framework.

### Direction and typography

Direction and typography must be derived from locale configuration, not hard-coded globally.

- Persian: RTL + Vazirmatn-first stack.
- English: LTR + system/Segoe-style Latin stack unless the Design System later specifies a dedicated Latin family.

### Translation boundary

UI copy, labels, metadata, validation/user-facing messages, navigation text, and accessibility labels should move behind locale dictionaries or equivalent typed locale content.

Game rules, state keys, IDs, API payload fields, database fields, and internal enum values must remain language-neutral.

## 3. Component Inventory — Initial Pass

This inventory is evidence-based and will be expanded before deletion/consolidation work.

### Shared UI

| Component | Path | Current assessment |
|---|---|---|
| `EmptyState` | `apps/web/src/components/shared/EmptyState.tsx` | Candidate canonical shared empty-state primitive |
| `GameCard` | `apps/web/src/components/shared/GameCard.tsx` | **Debt candidate:** shared component exists while Lobby currently renders game-selection cards inline; consumer verification required before deletion or canonicalization |
| `LoadingSkeleton` | `apps/web/src/components/shared/LoadingSkeleton.tsx` | Candidate canonical shared loading primitive |
| `Modal` | `apps/web/src/components/shared/Modal.tsx` | Candidate canonical shared modal primitive |

### Application layout

| Component | Path | Current assessment |
|---|---|---|
| `Header` | `apps/web/src/components/layout/Header.tsx` | Canonical global shell candidate; copy is now locale-aware on this branch, locale-scoped href migration still pending |
| `Footer` | `apps/web/src/components/layout/Footer.tsx` | Canonical global shell candidate; current remote footer content model is not locale-aware |

### Game UI

| Component | Path | Current assessment |
|---|---|---|
| `GameShell` | `apps/web/src/components/game/GameShell.tsx` | Confirmed shared by both `/game/[gameId]` and `/play/[roomId]`; strong canonical cross-game shell candidate |
| `BackgammonBoard` | `apps/web/src/components/game/BackgammonBoard.tsx` | Game-specific |
| `ChessBoard` | `apps/web/src/components/game/ChessBoard.tsx` | Game-specific |
| `ChessInfo` | `apps/web/src/components/game/ChessInfo.tsx` | Game-specific/supporting UI |
| `Dice3D` | `apps/web/src/components/game/Dice3D.tsx` | Reusable game primitive candidate; consumer verification still required |
| `TicTacToeBoard` | `apps/web/src/components/game/TicTacToeBoard.tsx` | Game-specific |
| `VegasBoard` | `apps/web/src/components/game/VegasBoard.tsx` | Game-specific |

## 4. Component Graveyard Rules

No component is deleted merely because it appears unused in one page.

For every reusable candidate:

1. verify file exists,
2. inspect implementation,
3. search all current consumers,
4. compare with inline/duplicate implementations,
5. choose one canonical implementation,
6. migrate consumers,
7. remove dead duplicates only after validation.

Classification used during cleanup:

- `CANONICAL`
- `DUPLICATE`
- `INLINE_DUPLICATE`
- `UNUSED_CANDIDATE`
- `GAME_SPECIFIC`
- `NEEDS_SPLIT`
- `NEEDS_MERGE`

## 5. Bug / Debt Ledger

This ledger records issues discovered during foundation work. Discovery does not automatically authorize an unrelated fix.

### DEBT-001 — Locale was hard-coded globally

- Area: Web root/theme
- Severity: High for bilingual rollout
- Original evidence: root layout fixed `fa/rtl`; theme fixed `direction: rtl` and Vazirmatn globally.
- Branch status: **PARTIALLY MITIGATED** by typed locale config and locale-aware theme construction.
- Remaining work: locale-scoped route/layout migration.

### DEBT-002 — Mixed-language Lobby copy

- Area: Lobby
- Severity: Medium
- Evidence: Persian and English labels are present in the same page (`Waiting`, `In progress`, English game metadata and match labels alongside Persian copy).
- Impact: Locale separation cannot be achieved by only changing `html lang/dir`.
- Planned task: move user-facing copy to locale content.

### DEBT-003 — GameCard canonicality mismatch

- Area: Shared components / Lobby
- Severity: Medium
- Evidence: `GameCard.tsx` exists as a shared primitive while Lobby currently renders game-selection cards inline.
- Impact: duplicate visual/interaction logic and higher risk of component graveyard growth.
- Planned task: consumer verification followed by canonicalization or removal.

### DEBT-004 — Direction coupled to singleton theme

- Area: MUI theme
- Severity: High for bilingual rollout
- Branch status: **MITIGATED** by `createBaziGBTheme` with direction/font inputs and backward-compatible default theme.
- Remaining work: locale-scoped layouts must supply the active locale values.

### DEBT-005 — Footer content model is not locale-aware

- Area: Footer / site settings
- Severity: Medium
- Evidence: `Footer` reads one `FooterContent` payload and uses Persian fallback tagline/rules/contact/copyright copy.
- Impact: English shell cannot use independently localized managed footer content without extending the site-settings content model or defining a locale fallback strategy.
- Planned task: inspect site-settings model before changing the backend contract.

### DEBT-006 — Duplicate game presentation metadata

- Area: `/game/[gameId]` and `/play/[roomId]`
- Severity: Medium
- Evidence: both pages define local `GAME_TITLES` / `GAME_CHIPS` maps with the same game identities and Persian presentation copy.
- Impact: localization and new-game onboarding require editing multiple pages and invite drift.
- Planned task: establish one language-neutral game metadata source plus locale presentation mapping during component/platform cleanup.

### DEBT-007 — Locale-aware copy exists before locale-aware route links

- Area: Header/navigation
- Severity: Low during foundation branch; High if English routes are exposed prematurely
- Evidence: Header can now accept locale-specific labels but still links to locale-neutral URLs.
- Impact: English must not be enabled until route migration updates path generation consistently.
- Planned task: atomically introduce locale-scoped routes and shared localized-link helper.

### DEBT-008 — Game pages contain hard-coded user-facing Persian copy

- Area: Local/bot and multiplayer game pages
- Severity: Medium
- Evidence: game title/chip maps and additional interface messages are page-local and Persian-oriented.
- Impact: bilingual rollout requires a clear localization boundary in game shell/presentation code without touching engine state keys.
- Planned task: inventory all user-facing game-shell copy before route rollout.

## 6. Execution Order from This Baseline

1. Finish consumer-level component inventory and verify `GameCard`, `EmptyState`, `LoadingSkeleton`, `Modal`, `Dice3D`, and `GameShell` usages.
2. Inspect site-settings/Footer localization boundary before deciding whether content storage requires a backend contract change.
3. Establish a language-neutral shared game metadata source to remove duplicate title/chip maps.
4. Introduce locale dictionaries/content boundary for Lobby, game shell, auth/profile, and common feedback copy.
5. Migrate root/application routing to locale-scoped routes in one coherent pass, including Header/Footer links and redirects.
6. Canonicalize shared components and only then standardize Lobby/GameShell.
7. Record newly discovered bugs/debt in this ledger; fix immediately only when they block the current foundation task or are critical.

## 7. Safety

- `main` remains untouched during this refactor.
- No deployment is part of Tasks 0–3.
- No repeated visual verification loop is required for the initial architecture/inventory phase.
- Route migration must not be left in a half-broken state; locale-scoped routes should be introduced as a coherent change.
