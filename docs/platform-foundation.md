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

## 4. Design System Alignment

`DESIGN_SYSTEM.md` is now version `2.1.0` and reflects the actual bilingual product architecture instead of the previous global RTL assumption.

Important rules now explicit:
- Persian is RTL; English is LTR.
- Direction and typography come from locale, not page hard-coding.
- Direction-independent codes/identifiers may remain LTR.
- 360px is the minimum mobile target.
- Global hover glow is not a default interaction rule; glow is reserved for meaningful game/state emphasis.
- default MUI palette colors must not leak into BaziGB when approved tokens exist.
- repeated loading/empty/error patterns should be shared only when they genuinely recur.

The MUI theme now defines `warning` from the Honey Bronze token family instead of inheriting MUI default orange, and global Button hover no longer adds a bronze glow to every button.

## 5. Managed Footer Contract

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

## 6. Canonical Game Presentation Metadata

`apps/web/src/lib/game-catalog.ts` has real consumers in primary game/Lobby/Profile/Tournament presentation paths.

Boundary:
- Web catalog owns presentation identity/fallback display metadata.
- Runtime player capability/rules remain GameAdapter/server-owned.

## 7. Shared UI / Component Graveyard

### Canonical by real use
- `GameShell`
- `Dice3D`
- `Header`
- `Footer`
- `GameCard` — canonical Lobby selectable game tile
- `EmptyState` — canonical product-level section/panel empty state for current Lobby use
- `LoadingSkeleton` — canonical repeated-section structural skeleton for current Lobby use
- focused `/admin/footer` managed-content editor
- game-specific boards remain game-specific

### Remaining candidate

`Modal`
- Now locale-neutral and design-token aligned.
- Still has no verified product consumer in the targeted pass.
- **Status:** `UNUSED_CANDIDATE`; do not force adoption merely to justify its existence and do not delete before executable verification.

### Graveyard policy

1. inspect implementation,
2. verify consumers,
3. compare duplicates,
4. choose canonical pattern,
5. migrate consumers,
6. run executable validation,
7. remove proven dead code.

Do not wrap every MUI primitive merely to increase component count.

## 8. GameShell Standardization

The shared shell now serves as the visual hierarchy for both local/bot and multiplayer game routes.

Current behavior:
- connection/room/copy/match/rematch/back/waiting labels are localized,
- back arrow follows locale,
- room code is always LTR,
- touched spacing uses logical CSS,
- shell max width is `lg` so board-heavy games are not constrained by an arbitrary narrow container,
- utility controls are separated from the primary game title,
- state/match chips form a secondary hierarchy,
- board/content lives inside an explicit centered `main` region,
- winner state uses a restrained semantic panel instead of a high-elevation full-primary block.

The game board remains the intended visual center, consistent with `DESIGN_SYSTEM.md`.

## 9. Lobby UI Standardization

Lobby is now a real consumer of the shared primitives rather than a parallel inline UI system.

Implemented:
- game selection uses `GameCard`,
- recent/room loading uses `LoadingSkeleton`,
- recent/room empty states use `EmptyState`,
- retryable errors expose retry actions,
- room/game navigation is explicitly locale-aware,
- code input is direction-independent LTR,
- mode controls expose selected state semantically,
- mobile layout adapts hierarchy for 360px+ rather than merely reducing desktop spacing,
- hover motion respects reduced-motion preference where introduced.

## 10. Header / 360px Shell Hardening

The bilingual Header was tightened for the 360px minimum target:
- mobile toolbar gaps and padding reduced,
- brand icon scales down on xs,
- primary nav actions become compact icon targets with Tooltip labels,
- language, sound and profile controls use compact mobile hit areas without hidden overflow,
- desktop labels remain available at larger breakpoints,
- active navigation exposes `aria-current`,
- touched spacing uses logical properties and theme-derived colors.

Executable 360px validation remains pending; this is code-level hardening, not a visual PASS.

## 11. Consumer Migration Status

Substantially migrated client-owned presentation:
- `/game/[gameId]`
- `/play/[roomId]`
- Lobby copy/metadata + shared visual primitives
- Tournaments list
- Tournament detail/bracket
- Profile
- OTP/Login
- Leaderboard
- Header/Footer
- GameShell

Data/server-owned text remains verbatim by design, including tournament managed fields and server chat/system payloads.

## 12. Bug / Debt Ledger

- **DEBT-001 — global locale/direction assumptions:** SUBSTANTIALLY MITIGATED; runtime validation pending.
- **DEBT-002 — mixed-language Lobby copy:** SUBSTANTIALLY RESOLVED.
- **DEBT-003 — GameCard canonicality mismatch:** RESOLVED IN CODE; Lobby is now the canonical consumer.
- **DEBT-004 — singleton RTL theme coupling:** MITIGATED; runtime validation pending.
- **DEBT-005 — Footer single-locale:** SUBSTANTIALLY MITIGATED; bilingual read/write/editor exists.
- **DEBT-006 — duplicate game presentation metadata:** RESOLVED for primary consumers.
- **DEBT-007 — locale routing/link dispersion:** SUBSTANTIALLY MITIGATED; remaining neutral links still need targeted normalization.
- **DEBT-008 — hard-coded game-entry copy:** SUBSTANTIALLY RESOLVED.
- **DEBT-009 — shared feedback primitives bypassed:** SUBSTANTIALLY MITIGATED in Lobby; review other repeated product-level states before declaring fully resolved.
- **DEBT-010 — Tournament mixed-language presentation:** SUBSTANTIALLY RESOLVED for list + detail client-owned copy.
- **DEBT-011 — Footer Web/Admin/Server coupling:** SUBSTANTIALLY MITIGATED.
- **DEBT-012 — Admin operational monolith:** OPEN / NON-BLOCKING.
- **DEBT-013 — game catalog graveyard risk:** RESOLVED.
- **DEBT-014 — duplicate locale hook:** RESOLVED.
- **DEBT-015 — server/data-owned localization boundary:** TRACKED.
- **DEBT-016 — dead Footer editor state/functions in `/admin`:** OPEN; focused `/admin/footer` is canonical; dead logic removal pending safe executable validation.
- **DEBT-017 — shared GameShell retained Persian hard-coded shell labels after page localization:** RESOLVED IN CODE; executable validation pending.
- **DEBT-018 — bilingual routes had no visible language switcher:** RESOLVED IN CODE; Header exposes FA/EN switching.
- **DEBT-019 — default MUI warning color + global Button hover glow diverged from Design System:** RESOLVED IN CODE; theme now stays inside Honey Bronze and global glow is removed.
- **UI-001 — Profile xs stats grid is still two columns and may be overly dense at the 360px minimum:** OPEN / next targeted responsive pass; requires code adjustment before visual-review checkpoint.
- **BUG-001 — runtime/compile state:** VALIDATION PENDING; no PASS claimed.

## 13. Current UI Cleanup Order

User preference: **do not request local visual review yet**. First reduce known visual/UI debt.

Continue in this order:
1. fix Profile 360px density and remaining neutral Profile links,
2. audit Tournaments/game-entry pages for narrow-screen hierarchy and physical RTL/LTR assumptions,
3. review repeated feedback/state patterns outside Lobby,
4. prepare safe Admin dead-logic cleanup without expanding the monolith,
5. known-bug/UI pass,
6. then declare a new local visual-review checkpoint.

## 14. Safety / Validation

- `main`: untouched.
- Governance branch: untouched.
- Merge: not performed.
- Deployment: not performed.
- Build/typecheck/tests/browser QA: `NOT RUN` in current connector environment.
- Never report PASS from static inspection alone.
- Do not delete graveyard candidates until evidence + executable validation justify deletion.
