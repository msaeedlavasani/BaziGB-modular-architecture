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
| 1. Persian / English Architecture | IN PROGRESS | Locale config, localized metadata/direction/font model, locale-aware theme factory, and typed shell messages introduced without changing current routes. Footer storage boundary is now inspected. |
| 2. Platform Architecture Audit | IN PROGRESS | Initial frontend/platform coupling and duplication findings are recorded in the debt ledger. Footer settings are confirmed to be one untyped JSON object under a single `footer` key. |
| 3. Component Inventory | IN PROGRESS | Shared/layout/game component inventory started; primary high-traffic pages inspected; no component deletion has been performed. |

## 1. Baseline

### Current verified platform facts

- Frontend: Next.js 14 / React 18 / MUI 5 / Emotion 11.
- `main` is Persian-first and the current public route tree is locale-neutral (`/lobby`, `/profile`, `/play/...`, `/game/...`, etc.).
- Shared business logic and modular game packages are already separate from the web application and must remain shared across locales.
- Existing UI contains both Persian and English strings in the same pages, so language separation is currently incomplete.
- Both local/bot game flow and multiplayer room flow reuse `GameShell`, but each page currently owns duplicate presentation metadata such as game titles/chips.
- Primary pages frequently use raw MUI `Skeleton`, `Alert`, `Paper`, and other local state layouts even though shared feedback primitives exist. This is not automatically wrong, but it is evidence that the shared-component layer is not yet canonicalized.
- Site settings persistence is generic JSON-by-key. The current footer is stored as one object under key `footer`; therefore bilingual footer content can be introduced without a database schema migration if the JSON contract is versioned/extended compatibly.

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

### Managed content boundary (Footer / Site Settings)

Verified current behavior:

- Web `FooterContent` is `{ tagline, links, copyright }` and defaults are Persian.
- `Footer` fetches one `footer` object and also hard-codes Persian Rules/Contact labels and locale-neutral links.
- Admin edits exactly that one object.
- Server persists arbitrary setting objects as JSON strings keyed by a max-50-character setting key.
- Public endpoint merges server-side Persian defaults with `getSetting('footer')`.

Target direction:

- Keep the generic `SiteSetting` persistence mechanism; no database migration is justified at this stage.
- Evolve the footer content contract to a locale-aware structure while preserving legacy `footer` compatibility during migration.
- Locale-specific labels/managed links belong in locale content; route generation remains locale-aware in the web layer.
- eNamad is a market-specific trust element and should not automatically be treated as universal English-shell content; its locale/market visibility should be handled as presentation policy, not duplicated into game/business logic.

## 3. Component Inventory — Initial Pass

This inventory is evidence-based and will be expanded before deletion/consolidation work.

### Shared UI

| Component | Path | Current assessment |
|---|---|---|
| `EmptyState` | `apps/web/src/components/shared/EmptyState.tsx` | `UNUSED_CANDIDATE` in inspected primary pages; concept is useful, but pages such as Lobby currently implement empty states inline. Verify all remaining consumers before canonicalizing/removing. |
| `GameCard` | `apps/web/src/components/shared/GameCard.tsx` | `UNUSED_CANDIDATE / INLINE_DUPLICATE`: explicitly designed for Lobby game selection while Lobby currently implements its own card interaction/layout inline. Strong graveyard signal; needs canonical choice. |
| `LoadingSkeleton` | `apps/web/src/components/shared/LoadingSkeleton.tsx` | `UNUSED_CANDIDATE` in inspected primary pages; Profile/Tournaments/Lobby use raw MUI `Skeleton` locally. Determine whether this abstraction is too narrow or should become canonical. |
| `Modal` | `apps/web/src/components/shared/Modal.tsx` | Reusable candidate; usage still needs full consumer verification before classification. |

### Application layout

| Component | Path | Current assessment |
|---|---|---|
| `Header` | `apps/web/src/components/layout/Header.tsx` | `CANONICAL` global shell candidate; copy is locale-aware on this branch, locale-scoped href migration still pending. |
| `Footer` | `apps/web/src/components/layout/Footer.tsx` | `CANONICAL` global shell candidate; implementation is currently coupled to a single managed content object and Persian fallback/navigation labels. |

### Game UI

| Component | Path | Current assessment |
|---|---|---|
| `GameShell` | `apps/web/src/components/game/GameShell.tsx` | `CANONICAL`: confirmed shared by both `/game/[gameId]` and `/play/[roomId]`; future game UI should extend it rather than introduce a parallel shell. |
| `BackgammonBoard` | `apps/web/src/components/game/BackgammonBoard.tsx` | `GAME_SPECIFIC` |
| `ChessBoard` | `apps/web/src/components/game/ChessBoard.tsx` | `GAME_SPECIFIC` |
| `ChessInfo` | `apps/web/src/components/game/ChessInfo.tsx` | `GAME_SPECIFIC` supporting UI |
| `Dice3D` | `apps/web/src/components/game/Dice3D.tsx` | Reusable game primitive candidate; full consumer verification still required. |
| `TicTacToeBoard` | `apps/web/src/components/game/TicTacToeBoard.tsx` | `GAME_SPECIFIC` |
| `VegasBoard` | `apps/web/src/components/game/VegasBoard.tsx` | `GAME_SPECIFIC` |

### Page-level findings

- Lobby owns large inline implementations for game selection and Recently Played instead of composing the shared `GameCard` / `EmptyState` primitives.
- Profile directly uses raw `Skeleton`, `Paper`, tables, and state layouts rather than a page-state abstraction.
- Tournaments directly uses raw `Skeleton`, `Alert`, `Paper`, `Chip`, and progress components and also contains English-only status/fallback copy.
- Admin is a large page with user management, room management, and Footer editor responsibilities in one file. This is a maintainability/decomposition candidate, but it is not part of Tasks 0–3 cleanup unless it blocks locale contract work.
- This does **not** mean every MUI usage should be wrapped. The cleanup goal is to canonicalize repeated product patterns, not create wrappers for all MUI components.

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
- Evidence: client, admin editor, and server public defaults all assume one `footer` object; Rules/Contact labels are separately hard-coded in Persian.
- Impact: English shell cannot use independently localized managed footer content with the current contract.
- Verified architecture finding: persistence is generic JSON-by-key, so this does **not** require a Prisma/database schema migration.
- Planned task: introduce a backward-compatible locale-aware footer contract and admin editing model during i18n implementation.

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

### DEBT-009 — Shared feedback primitives are bypassed by local page implementations

- Area: Shared UI / primary pages
- Severity: Medium
- Evidence: existing shared `EmptyState` / `LoadingSkeleton` coexist with repeated local empty/loading structures using raw MUI primitives in Lobby/Profile/Tournaments.
- Impact: styling and behavior drift, duplicated fixes, and component-graveyard growth.
- Planned task: decide canonical product-level loading/empty/error patterns; remove abstractions that are too narrow rather than wrapping every MUI primitive.

### DEBT-010 — Tournaments contains English-only product copy inside Persian-first UI

- Area: Tournaments
- Severity: Medium
- Evidence: fallback description and status labels such as `Registration Open`, `In Progress`, and `Completed` are embedded directly in the page.
- Impact: confirms mixed-language debt extends beyond Lobby and should be solved through dictionaries rather than page-by-page ad hoc edits.
- Planned task: locale dictionary migration.

### DEBT-011 — Footer localization spans Web + Admin + Server contract

- Area: Site settings / Admin / Footer
- Severity: Medium
- Evidence: `Footer.tsx`, `site-settings.ts`, Admin footer editor, and `SiteSettingsController` all share the single-locale assumption.
- Impact: changing only the visual Footer would create a false bilingual implementation while Admin writes and server defaults remain single-locale.
- Planned task: migrate the contract coherently, preserving legacy stored data until new localized content is saved.

### DEBT-012 — Admin page has multiple unrelated operational responsibilities

- Area: Admin frontend
- Severity: Low/Medium maintainability debt
- Evidence: one large page contains stats, users, rooms, destructive actions, and Footer content editing.
- Impact: future localized site-content management will increase coupling if added directly to the same monolith.
- Planned task: record for later admin decomposition; do not expand current scope unless required for the bilingual footer editor.

## 6. Execution Order from This Baseline

1. Finish consumer-level component inventory and verify `GameCard`, `EmptyState`, `LoadingSkeleton`, `Modal`, `Dice3D`, and `GameShell` usages.
2. Define the backward-compatible locale-aware Footer/Site Settings contract now that persistence constraints are known.
3. Establish a language-neutral shared game metadata source to remove duplicate title/chip maps.
4. Introduce locale dictionaries/content boundary for Lobby, game shell, auth/profile, tournaments, and common feedback copy.
5. Migrate root/application routing to locale-scoped routes in one coherent pass, including Header/Footer links and redirects.
6. Canonicalize shared components and only then standardize Lobby/GameShell.
7. Record newly discovered bugs/debt in this ledger; fix immediately only when they block the current foundation task or are critical.

## 7. Safety

- `main` remains untouched during this refactor.
- No deployment is part of Tasks 0–3.
- No repeated visual verification loop is required for the initial architecture/inventory phase.
- Route migration must not be left in a half-broken state; locale-scoped routes should be introduced as a coherent change.
- `docs/HANDOFF.md` must be synchronized after each meaningful stage so another agent can continue without relying on chat history.
