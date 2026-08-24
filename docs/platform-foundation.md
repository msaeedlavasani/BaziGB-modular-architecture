# BaziGB Platform Foundation

**Status:** Foundation audit complete; bilingual implementation migration active
**Working branch:** `refactor/platform-foundation-i18n-v3`
**Production baseline:** `main` (untouched)
**Governance source:** latest verified governance on `ai/autonomous-development-system-v1`

This document is the canonical architecture/debt record for the platform-foundation refactor. Stage history lives in `docs/platform-foundation-progress.md`; continuation state lives in `docs/HANDOFF.md`.

## 1. Bilingual Architecture

The approved model is one shared product/codebase:

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

Supported locales:
- `fa` — Persian / RTL / Vazirmatn-first
- `en` — English / LTR / Latin system stack

Language-neutral boundaries remain:
- game rules/state/IDs
- API/database/internal enum fields
- realtime/game-engine contracts

Localized boundaries include:
- user-facing copy
- navigation/accessibility labels
- metadata
- date/number presentation
- managed presentation content such as Footer copy

## 2. Locale Routing Architecture

Locale routing is implemented without duplicating pages.

Public URLs:

```text
/fa/lobby           /en/lobby
/fa/profile         /en/profile
/fa/leaderboard     /en/leaderboard
/fa/tournaments     /en/tournaments
/fa/game/[gameId]   /en/game/[gameId]
/fa/play/[roomId]   /en/play/[roomId]
/fa/login           /en/login
```

Implementation:
- `apps/web/src/middleware.ts` keeps locale-prefixed URLs visible and rewrites internally to the existing single App Router page tree.
- Middleware sets `x-bazigb-locale` for the server shell and persists `bazigb-locale` as a compatibility preference cookie.
- Locale-neutral public URLs redirect to the preferred locale, defaulting to `fa`.
- `/` redirects to the preferred locale Lobby.
- Root layout reads the request locale and activates localized `lang`, `dir`, metadata, theme direction and font.
- Header/Footer emit locale-prefixed public navigation links.
- Admin intentionally remains locale-neutral until the bilingual Footer editor/admin-content stage.

`apps/web/src/i18n/routing.ts` is the canonical route helper layer. Do not scatter `/fa` or `/en` literals across components.

## 3. Foundation Implemented

- `apps/web/src/i18n/config.ts` — locale/direction/font/metadata configuration.
- `apps/web/src/i18n/messages.ts` — shared shell/game/multiplayer/Lobby/Tournament messages.
- `apps/web/src/i18n/profile.ts` — Profile messages.
- `apps/web/src/i18n/auth.ts` — OTP/Login messages.
- `apps/web/src/i18n/leaderboard.ts` — Leaderboard messages.
- `apps/web/src/i18n/routing.ts` — canonical route identities/builders.
- `apps/web/src/hooks/useAppLocale.ts` — canonical client locale resolver.
- `createBaziGBTheme({ direction, fontFamily })` + locale-aware Providers.
- Locale-aware root layout/Header/Footer.
- Locale-aware Footer/Site Settings Web+Server contract with legacy Persian compatibility.
- `apps/web/src/lib/game-catalog.ts` — canonical web presentation bridge for stable `GameId` values.

A duplicate `apps/web/src/i18n/useAppLocale.ts` was discovered and removed after confirming no consumer. This is recorded as a concrete example of preventing the same graveyard problem during the refactor itself.

## 4. Managed Footer Contract

Storage/read migration remains backward compatible:

```text
legacy: footer          # treated as Persian
new:    footer.fa
new:    footer.en
response: footer + footers.fa + footers.en
```

No Prisma/database migration is required because Site Settings are generic JSON-by-key.

Remaining:
- Admin editor must support Persian and English managed Footer content.
- eNamad visibility in the English shell remains an explicit product-policy question; current behavior is preserved until that decision is needed.

## 5. Canonical Game Presentation Metadata

`apps/web/src/lib/game-catalog.ts` now has real consumers in:
- `/game/[gameId]`
- `/play/[roomId]`
- Lobby
- Profile history where recognized game IDs are displayed

It owns web presentation identity such as localized-name mapping/chip symbol and presentation fallback capacity.

Important boundary: runtime/canonical max-player capability remains GameAdapter/server-owned. The catalog must never become the rules/capability source.

## 6. Component Inventory / Graveyard

### Canonical
- `GameShell`
- `Dice3D` reusable game primitive
- `Header`
- `Footer`
- game boards remain `GAME_SPECIFIC`

### Cleanup candidates
- `GameCard` — `UNUSED_CANDIDATE / INLINE_DUPLICATE`; strongest graveyard signal because Lobby owns an inline equivalent.
- `EmptyState` — `UNUSED_CANDIDATE` in inspected high-traffic consumers.
- `LoadingSkeleton` — `UNUSED_CANDIDATE / TOO_NARROW?`.
- `Modal` — `UNUSED_CANDIDATE` in targeted consumer search.

Policy:
1. inspect implementation,
2. verify all consumers,
3. compare duplicates,
4. choose canonical pattern,
5. migrate consumers,
6. run executable validation,
7. remove proven dead code.

Do not wrap every MUI primitive merely to create abstractions.

## 7. Consumer Migration Status

Completed/substantially migrated client-owned presentation:
- local/bot `/game/[gameId]`
- multiplayer `/play/[roomId]`
- Lobby
- Tournaments list
- Profile
- OTP/Login
- Leaderboard

Data/server-owned text is not silently translated in the client. Known examples:
- server chat/system-message payload text
- tournament record `name`, `description`, `prize`, join-result message

Tournament detail/bracket page remains a known high-traffic bilingual migration target.

## 8. Bug / Debt Ledger

### DEBT-001 — Global locale/direction assumptions
**Status: SUBSTANTIALLY MITIGATED**
Middleware + request-aware root shell now activate locale-specific language/direction/theme/metadata. Runtime validation remains required.

### DEBT-002 — Mixed-language Lobby copy
**Status: SUBSTANTIALLY RESOLVED** for page-owned copy.

### DEBT-003 — GameCard canonicality mismatch
**Status: OPEN** — resolve during Component Graveyard Cleanup.

### DEBT-004 — Singleton RTL theme coupling
**Status: MITIGATED** at architecture/code level; validate at runtime.

### DEBT-005 — Footer single-locale
**Status: PARTIALLY MITIGATED** — Web/Server done; Admin editor + eNamad product policy remain.

### DEBT-006 — Duplicate game presentation metadata
**Status: RESOLVED FOR PRIMARY CONSUMERS** — `/game`, `/play`, Lobby use the catalog.

### DEBT-007 — Locale-aware copy vs locale-neutral routes
**Status: SUBSTANTIALLY MITIGATED** — middleware/root shell/Header/Footer locale routing activated. Compatibility redirects protect remaining neutral links while page links are progressively normalized.

### DEBT-008 — Hard-coded game-entry copy
**Status: SUBSTANTIALLY RESOLVED** for shared entry pages. Game-specific boards may still contain presentation copy requiring later targeted review.

### DEBT-009 — Shared feedback primitives bypassed
**Status: OPEN** — do not mix into localization migration.

### DEBT-010 — Tournament mixed-language list copy
**Status: SUBSTANTIALLY RESOLVED** for the list page. Tournament detail/bracket remains.

### DEBT-011 — Footer localization spans Web/Admin/Server
**Status: PARTIALLY MITIGATED** — Admin remains.

### DEBT-012 — Admin operational monolith
**Status: OPEN / NON-BLOCKING**.

### DEBT-013 — Canonical catalog without consumers
**Status: RESOLVED** — catalog has multiple real consumers.

### DEBT-014 — Duplicate locale hook created during refactor
**Status: RESOLVED** — duplicate `i18n/useAppLocale.ts` removed after confirming no consumers; `hooks/useAppLocale.ts` is canonical.

### DEBT-015 — Server/data-owned localized content boundary
**Status: TRACKED** — chat/system payloads and managed tournament fields may be language-specific. Treat as protocol/content modeling, not client search/replace.

### BUG-001 — Runtime/compile state not yet verified
**Status: VALIDATION PENDING** — no runtime bug is claimed resolved or absent until executable validation runs.

## 9. Remaining Execution Order

1. Tournament detail/bracket bilingual migration and remaining high-traffic copy scan.
2. Normalize remaining internal links to explicit localized route helpers; middleware compatibility redirects remain temporary safety.
3. Admin bilingual Footer editor (`footer.fa` / `footer.en`).
4. Component Graveyard Cleanup and shared feedback-pattern decision.
5. Lobby/GameShell standardization.
6. Known-bug pass.
7. Executable build/typecheck/tests and one justified targeted visual check in a suitable environment.
8. Only after review: merge/release decision. No automatic production deployment.

## 10. Safety / Validation

- `main`: untouched.
- Governance branch: untouched.
- Merge: not performed.
- Deployment: not performed.
- GitHub Actions check on the latest branch commit returned no workflow runs; this does not count as validation.
- Build/typecheck/tests/browser QA remain `NOT RUN` until actually executed.
- Never report PASS from static inspection alone.
