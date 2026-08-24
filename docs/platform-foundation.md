# BaziGB Platform Foundation

**Status:** Active refactor baseline
**Working branch:** `refactor/platform-foundation-i18n-v3`
**Base:** latest `main`
**Governance source:** `ai/autonomous-development-system-v1` (latest verified rules)

This document is the single working record for the platform-foundation refactor. It covers the initial baseline, bilingual architecture, component inventory, and discovered blockers/bugs. It should not duplicate `AGENTS.md`, `AI_CONTEXT_MAP.md`, or `DESIGN_SYSTEM.md`.

## 1. Baseline

### Current verified platform facts

- Frontend: Next.js 14 / React 18 / MUI 5 / Emotion 11.
- Current root document is Persian-first and hard-codes `lang="fa"` and `dir="rtl"`.
- The MUI theme is currently hard-coded to RTL and uses Vazirmatn as its primary font.
- Application routes are currently locale-neutral (`/lobby`, `/profile`, `/play/...`, `/game/...`, etc.).
- Shared business logic and modular game packages are already separate from the web application and must remain shared across locales.
- Existing UI contains both Persian and English strings in the same pages, so language separation is currently incomplete.

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
| `Header` | `apps/web/src/components/layout/Header.tsx` | Global shell; must become locale-aware without duplication |
| `Footer` | `apps/web/src/components/layout/Footer.tsx` | Global shell; must become locale-aware without duplication |

### Game UI

| Component | Path | Current assessment |
|---|---|---|
| `GameShell` | `apps/web/src/components/game/GameShell.tsx` | Candidate canonical cross-game shell; detailed consumer/composition audit required |
| `BackgammonBoard` | `apps/web/src/components/game/BackgammonBoard.tsx` | Game-specific |
| `ChessBoard` | `apps/web/src/components/game/ChessBoard.tsx` | Game-specific |
| `ChessInfo` | `apps/web/src/components/game/ChessInfo.tsx` | Game-specific/supporting UI |
| `Dice3D` | `apps/web/src/components/game/Dice3D.tsx` | Reusable game primitive candidate; verify consumers |
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

### DEBT-001 — Locale is hard-coded globally

- Area: Web root/theme
- Severity: High for bilingual rollout
- Evidence: root layout fixes `fa/rtl`; theme fixes `direction: rtl` and Vazirmatn globally.
- Impact: English cannot become a correct LTR/localized product without structural change.
- Planned task: Language architecture migration.

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

### DEBT-004 — Direction is coupled to the singleton theme

- Area: MUI theme
- Severity: High for bilingual rollout
- Evidence: `theme.ts` exports one RTL theme.
- Impact: LTR cannot be supported cleanly without either mutating global direction or creating locale-aware theme construction.
- Planned task: locale-aware theme factory.

## 6. Execution Order from This Baseline

1. Introduce locale configuration and locale-aware theme construction without breaking current Persian routes.
2. Introduce locale dictionaries/content boundary.
3. Migrate root/application routing to locale-scoped routes in a controlled pass.
4. Audit Header/Footer/Lobby first because they expose the largest amount of shared user-facing copy.
5. Complete component consumer inventory before deleting or merging shared components.
6. Canonicalize shared components and only then standardize Lobby/GameShell.
7. Record newly discovered bugs/debt in this ledger; fix immediately only when they block the current foundation task or are critical.

## 7. Safety

- `main` remains untouched during this refactor.
- No deployment is part of Tasks 0–3.
- No visual verification loop is required for the initial architecture/inventory phase.
- Route migration must not be left in a half-broken state; locale-scoped routes should be introduced as a coherent change.
