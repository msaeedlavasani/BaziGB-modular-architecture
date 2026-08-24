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
- Admin remains locale-neutral; locale-specific managed Footer content is edited through a focused Admin route.

`apps/web/src/i18n/routing.ts` is the canonical route helper layer. Do not scatter `/fa` or `/en` literals through components except where a focused compatibility boundary still exists and is tracked for cleanup.

## 3. Foundation Implemented

- `apps/web/src/i18n/config.ts` — locale/direction/font/metadata configuration.
- `apps/web/src/i18n/messages.ts` — shared shell/game/multiplayer/Lobby/Tournament-list messages.
- `apps/web/src/i18n/profile.ts` — Profile messages.
- `apps/web/src/i18n/auth.ts` — OTP/Login messages.
- `apps/web/src/i18n/leaderboard.ts` — Leaderboard messages.
- `apps/web/src/i18n/tournament-detail.ts` — Tournament detail/bracket messages.
- `apps/web/src/i18n/routing.ts` — canonical route identities/builders.
- `apps/web/src/hooks/useAppLocale.ts` — canonical client locale resolver.
- `createBaziGBTheme({ direction, fontFamily })` + locale-aware Providers.
- Locale-aware root layout/Header/Footer.
- Locale-aware Footer/Site Settings Web+Server contract with legacy Persian compatibility.
- `apps/web/src/lib/game-catalog.ts` — canonical web presentation bridge for stable `GameId` values.
- `apps/web/src/app/admin/footer/page.tsx` — focused bilingual Footer-content editor.

A duplicate `apps/web/src/i18n/useAppLocale.ts` was discovered and removed after confirming no consumer. This is a concrete example of preventing the same graveyard problem during the refactor itself.

## 4. Managed Footer Contract

Storage/read migration is backward compatible:

```text
legacy: footer          # treated as Persian
new:    footer.fa
new:    footer.en
response: footer + footers.fa + footers.en
```

No Prisma/database migration is required because Site Settings are generic JSON-by-key.

Implemented:
- Web reads locale-specific Footer values with Persian legacy fallback only for `fa`.
- Server exposes `footers.fa` / `footers.en` while retaining legacy `footer` compatibility.
- Focused Admin editor at `/admin/footer` loads and saves Persian/English independently through the shared `FooterContent` schema.

Product policy resolved:
- **eNamad remains visible in both Persian and English shells for now.**
- Do not add locale-based hiding unless later market/product policy changes.

Remaining:
- Add discoverability/navigation to the focused Footer editor from the main Admin experience during Admin cleanup.
- Remove dead legacy Footer-editor state/functions still present inside `/admin` once executable validation is available.

## 5. Canonical Game Presentation Metadata

`apps/web/src/lib/game-catalog.ts` has real consumers in:
- `/game/[gameId]`
- `/play/[roomId]`
- Lobby
- Profile history where recognized game IDs are displayed
- Tournament detail where recognized game IDs are displayed

It owns web presentation identity such as localized-name mapping/chip symbol and presentation fallback capacity.

Important boundary: runtime/canonical max-player capability remains GameAdapter/server-owned. The catalog must never become the rules/capability source.

## 6. Component Inventory / Graveyard

### Canonical
- `GameShell`
- `Dice3D` reusable game primitive
- `Header`
- `Footer`
- focused `/admin/footer` managed-content editor
- game boards remain `GAME_SPECIFIC`

### Cleanup candidates
- `GameCard` — `UNUSED_CANDIDATE / INLINE_DUPLICATE`; strongest graveyard signal because Lobby owns an inline equivalent.
- `EmptyState` — `UNUSED_CANDIDATE` in inspected high-traffic consumers.
- `LoadingSkeleton` — `UNUSED_CANDIDATE / TOO_NARROW?`.
- `Modal` — `UNUSED_CANDIDATE` in targeted consumer search.
- legacy Footer editor state/functions inside `/admin` — dead page-local logic; canonical editor now lives at `/admin/footer`.

Policy:
1. inspect implementation,
2. verify all consumers,
3. compare duplicates,
4. choose canonical pattern,
5. migrate consumers,
6. run executable validation,
7. remove proven dead code.

Do not wrap every MUI primitive merely to create abstractions. Because build/typecheck cannot run in the current connector environment, destructive cleanup remains deferred until a safe validation environment is available.

## 7. Consumer Migration Status

Completed/substantially migrated client-owned presentation:
- local/bot `/game/[gameId]`
- multiplayer `/play/[roomId]`
- Lobby
- Tournaments list
- Tournament detail/bracket
- Profile
- OTP/Login
- Leaderboard

Tournament detail/bracket specifics:
- status/errors/not-found/join/player-count/champion/bracket/round labels are locale-aware,
- recognized game IDs display canonical localized game titles,
- dates follow `fa-IR` / `en-US`,
- physical left/right spacing touched by the migration was replaced with logical inline spacing,
- bracket connector geometry remains intentionally LTR in both languages so connector math/progression is deterministic while labels remain localized.

Data/server-owned text is not silently translated in the client. Known examples:
- server chat/system-message payload text,
- tournament record `name`, `description`, `prize`, join-result message,
- participant/champion names.

## 8. Bug / Debt Ledger

### DEBT-001 — Global locale/direction assumptions
**Status: SUBSTANTIALLY MITIGATED**
Middleware + request-aware root shell activate locale-specific language/direction/theme/metadata. Runtime validation remains required.

### DEBT-002 — Mixed-language Lobby copy
**Status: SUBSTANTIALLY RESOLVED** for page-owned copy.

### DEBT-003 — GameCard canonicality mismatch
**Status: OPEN** — resolve during Component Graveyard Cleanup after executable validation.

### DEBT-004 — Singleton RTL theme coupling
**Status: MITIGATED** at architecture/code level; validate at runtime.

### DEBT-005 — Footer single-locale
**Status: SUBSTANTIALLY MITIGATED** — bilingual Web/Server read path and focused Admin write path exist. Admin discoverability/legacy cleanup remains.

### DEBT-006 — Duplicate game presentation metadata
**Status: RESOLVED FOR PRIMARY CONSUMERS** — `/game`, `/play`, Lobby and supporting presentation consumers use the catalog.

### DEBT-007 — Locale-aware copy vs locale-neutral routes
**Status: SUBSTANTIALLY MITIGATED** — middleware/root shell/Header/Footer locale routing activated. Compatibility redirects protect remaining neutral links while page links are normalized.

### DEBT-008 — Hard-coded game-entry copy
**Status: SUBSTANTIALLY RESOLVED** for shared entry pages. Game-specific boards may still contain presentation copy requiring later targeted review.

### DEBT-009 — Shared feedback primitives bypassed
**Status: OPEN** — canonical feedback-pattern decision remains.

### DEBT-010 — Tournament mixed-language presentation
**Status: SUBSTANTIALLY RESOLVED** for list + detail/bracket client-owned copy.

### DEBT-011 — Footer localization spans Web/Admin/Server
**Status: SUBSTANTIALLY MITIGATED** — coherent bilingual read/write path now exists.

### DEBT-012 — Admin operational monolith
**Status: OPEN / NON-BLOCKING**.

### DEBT-013 — Canonical catalog without consumers
**Status: RESOLVED** — catalog has multiple real consumers.

### DEBT-014 — Duplicate locale hook created during refactor
**Status: RESOLVED** — duplicate `i18n/useAppLocale.ts` removed after confirming no consumers; `hooks/useAppLocale.ts` is canonical.

### DEBT-015 — Server/data-owned localized content boundary
**Status: TRACKED** — chat/system payloads and managed tournament fields may be language-specific. Treat as protocol/content modeling, not client search/replace.

### DEBT-016 — Dead Footer editor logic inside `/admin`
**Status: OPEN / CLEANUP PENDING**
The main Admin page still has Footer state/load/save logic but no rendered Footer editor in its current body. Canonical editing now lives at `/admin/footer`. Remove the dead logic and add discoverability during Admin/Component cleanup after executable validation.

### BUG-001 — Runtime/compile state not yet verified
**Status: VALIDATION PENDING** — no runtime bug is claimed resolved or absent until executable validation runs.

## 9. Visual Review Checkpoint

A local run is now materially useful and should show major product-level differences:
- actual `/fa/*` and `/en/*` URLs,
- RTL Persian versus LTR English shell,
- locale-specific typography and metadata,
- localized Header/Footer/Lobby/Profile/Login/Leaderboard/Tournaments/GameShells,
- localized Tournament detail/bracket,
- locale-specific managed Footer values once saved through `/admin/footer`.

This is a visual-review milestone, **not** validation PASS.

## 10. Remaining Execution Order

1. Targeted normalization of remaining high-traffic locale-neutral links; middleware redirects remain compatibility safety only.
2. Component Graveyard Cleanup preparation and consumer proof.
3. Shared feedback-pattern decision + Lobby/GameShell standardization.
4. Admin cleanup: expose `/admin/footer` discoverably and remove dead legacy Footer logic when executable validation is available.
5. Known-bug pass.
6. Executable build/typecheck/tests and one justified targeted visual check in a suitable environment.
7. Only after review: merge/release decision. No automatic production deployment.

## 11. Safety / Validation

- `main`: untouched.
- Governance branch: untouched.
- Merge: not performed.
- Deployment: not performed.
- GitHub Actions check on a branch checkpoint returned no workflow runs; this does not count as validation.
- Build/typecheck/tests/browser QA remain `NOT RUN` until actually executed.
- Never report PASS from static inspection alone.
