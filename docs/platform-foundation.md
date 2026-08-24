# BaziGB Platform Foundation

**Status:** Foundation audit complete; bilingual + shared-UI implementation active
**Working branch:** `refactor/platform-foundation-i18n-v3`
**Production baseline:** `main` (untouched)
**Governance source:** latest verified governance on `ai/autonomous-development-system-v1`

This is the canonical architecture/debt record for the platform-foundation refactor. Stage history lives in `docs/platform-foundation-progress.md`; continuation state lives in `docs/HANDOFF.md`.

## 1. Bilingual Architecture

Approved model:

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

Language-neutral:
- game rules/state/IDs
- API/database/internal enum fields
- realtime/game-engine contracts

Localized:
- user-facing copy
- navigation/accessibility labels
- metadata
- date/number presentation
- managed presentation content

## 2. Locale Routing Architecture

Public localized URLs are active on this branch without duplicating pages:

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
- `apps/web/src/middleware.ts` keeps locale-prefixed URLs visible and rewrites to the one shared App Router tree.
- `x-bazigb-locale` drives the root shell.
- `bazigb-locale` preserves compatibility redirects while neutral links are eliminated.
- Root layout activates locale-specific `lang`, `dir`, metadata, theme direction and font.
- `apps/web/src/i18n/routing.ts` is the canonical route helper layer.
- Header includes an explicit FA/EN switcher that keeps the current logical path while toggling locale.
- Admin remains locale-neutral.

## 3. Localization Foundation

Current domain message modules include:
- `i18n/messages.ts`
- `i18n/profile.ts`
- `i18n/auth.ts`
- `i18n/leaderboard.ts`
- `i18n/tournament-detail.ts`
- `i18n/game-shell.ts`
- `i18n/language-switcher.ts`

Canonical client locale resolver:
- `hooks/useAppLocale.ts`

A duplicate locale hook created during the refactor was removed after consumer verification (`DEBT-014`).

## 4. Managed Footer Contract

Backward-compatible content model:

```text
legacy: footer          # Persian compatibility
new:    footer.fa
new:    footer.en
response: footer + footers.fa + footers.en
```

- No Prisma/database migration is required because Site Settings are generic JSON-by-key.
- Focused bilingual editor exists at `/admin/footer`.
- eNamad product policy is **resolved**: show it in both Persian and English shells for now.
- eNamad stays outside locale-managed visibility settings until market policy changes.

## 5. Canonical Game Presentation Metadata

`apps/web/src/lib/game-catalog.ts` has real consumers in primary game/Lobby/Profile/Tournament presentation paths.

Boundary:
- Web catalog owns presentation identity/fallback display metadata.
- Runtime player capability/rules remain GameAdapter/server-owned.

## 6. Shared UI / Component Graveyard

### Canonical by real use
- `GameShell`
- `Dice3D`
- `Header`
- `Footer`
- focused `/admin/footer` managed-content editor
- game-specific boards remain game-specific

### Refactored candidates awaiting consumer migration

`GameCard`
- Previously an unused generic Lobby card while Lobby had its own inline selector.
- Now redesigned specifically as BaziGB's selectable game tile with selected/focus/reduced-motion states.
- **Status:** `READY_FOR_CANONICAL_MIGRATION`; not canonical-by-use until Lobby consumes it.

`EmptyState`
- Upgraded to a product-level empty state with explanatory hierarchy, optional icon/CTA and theme-token surface.
- **Status:** `READY_FOR_CANONICAL_MIGRATION`.

`LoadingSkeleton`
- Generalized to a configurable structural grid rather than one arbitrary page skeleton.
- **Status:** `READY_FOR_CANONICAL_MIGRATION`; page-specific skeletons remain valid when geometry differs.

`Modal`
- Still `UNUSED_CANDIDATE`; do not delete until executable consumer verification.

### Graveyard policy

1. inspect implementation,
2. verify consumers,
3. compare duplicates,
4. choose canonical pattern,
5. migrate consumers,
6. run executable validation,
7. remove proven dead code.

Do not wrap every MUI primitive merely to increase component count.

## 7. GameShell Standardization

A real shared-shell gap was found after page-level localization: `GameShell` still contained Persian hard-coded labels.

Now:
- connection status is localized,
- room/copy labels are localized,
- match/rematch/back/waiting labels are localized,
- back-arrow direction follows locale,
- touched spacing uses logical CSS,
- winner surface uses semantic theme colors,
- canonical shell continues to serve both local/bot and multiplayer routes.

This prevents English game routes from rendering a partially Persian shared shell.

## 8. Consumer Migration Status

Substantially migrated client-owned presentation:
- `/game/[gameId]`
- `/play/[roomId]`
- Lobby copy/metadata (shared visual primitives still pending)
- Tournaments list
- Tournament detail/bracket
- Profile
- OTP/Login
- Leaderboard
- Header/Footer
- GameShell

Data/server-owned text remains verbatim by design, including tournament managed fields and server chat/system payloads.

## 9. Bug / Debt Ledger

- **DEBT-001 — global locale/direction assumptions:** SUBSTANTIALLY MITIGATED; runtime validation pending.
- **DEBT-002 — mixed-language Lobby copy:** SUBSTANTIALLY RESOLVED.
- **DEBT-003 — GameCard canonicality mismatch:** IMPLEMENTATION PREPARED; Lobby consumer migration pending.
- **DEBT-004 — singleton RTL theme coupling:** MITIGATED; runtime validation pending.
- **DEBT-005 — Footer single-locale:** SUBSTANTIALLY MITIGATED; bilingual read/write/editor exists.
- **DEBT-006 — duplicate game presentation metadata:** RESOLVED for primary consumers.
- **DEBT-007 — locale routing/link dispersion:** SUBSTANTIALLY MITIGATED; remaining neutral links still need targeted normalization.
- **DEBT-008 — hard-coded game-entry copy:** SUBSTANTIALLY RESOLVED.
- **DEBT-009 — shared feedback primitives bypassed:** IMPLEMENTATION PREPARED; consumer migration pending.
- **DEBT-010 — Tournament mixed-language presentation:** SUBSTANTIALLY RESOLVED for list + detail client-owned copy.
- **DEBT-011 — Footer Web/Admin/Server coupling:** SUBSTANTIALLY MITIGATED.
- **DEBT-012 — Admin operational monolith:** OPEN / NON-BLOCKING.
- **DEBT-013 — game catalog graveyard risk:** RESOLVED.
- **DEBT-014 — duplicate locale hook:** RESOLVED.
- **DEBT-015 — server/data-owned localization boundary:** TRACKED.
- **DEBT-016 — dead Footer editor state/functions in `/admin`:** OPEN; focused `/admin/footer` is canonical; dead logic removal pending safe executable validation.
- **DEBT-017 — shared GameShell retained Persian hard-coded shell labels after page localization:** RESOLVED IN CODE; executable validation pending.
- **DEBT-018 — bilingual routes had no visible language switcher:** RESOLVED IN CODE; Header now exposes FA/EN switching.
- **BUG-001 — runtime/compile state:** VALIDATION PENDING; no PASS claimed.

## 10. Current UI Cleanup Order

User preference: **do not request local visual review yet**. First reduce known visual/UI debt.

Continue in this order:
1. migrate Lobby game selection to revised `GameCard`,
2. migrate appropriate Lobby empty/loading states to `EmptyState` / `LoadingSkeleton`,
3. normalize recurring shared feedback patterns without wrapping arbitrary MUI primitives,
4. audit remaining GameShell/Lobby mobile + RTL/LTR physical assumptions,
5. clean Admin legacy Footer logic when safe,
6. known-bug pass,
7. then declare a new local visual-review checkpoint.

## 11. Safety / Validation

- `main`: untouched.
- Governance branch: untouched.
- Merge: not performed.
- Deployment: not performed.
- Build/typecheck/tests/browser QA: `NOT RUN` in current connector environment.
- Never report PASS from static inspection alone.
- Do not delete graveyard candidates until evidence + executable validation justify deletion.
