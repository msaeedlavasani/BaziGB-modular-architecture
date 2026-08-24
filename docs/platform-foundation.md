# BaziGB Platform Foundation

**Status:** Foundation audit complete; bilingual + shared-UI implementation active
**Working branch:** `refactor/platform-foundation-i18n-v3`
**Production baseline:** `main` (untouched)
**Governance source:** latest verified governance on `ai/autonomous-development-system-v1`

This is the canonical architecture/debt record for the platform-foundation refactor. Stage history lives in `docs/platform-foundation-progress.md`; continuation state lives in `docs/HANDOFF.md`.

## 1. Bilingual Architecture

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

Game rules/state/IDs/API/database/realtime contracts remain language-neutral. User-facing copy, navigation, metadata, presentation formatting and managed presentation content are localized.

## 2. Locale Routing

Public localized URLs are active without duplicating the page tree:

```text
/fa/lobby           /en/lobby
/fa/profile         /en/profile
/fa/leaderboard     /en/leaderboard
/fa/tournaments     /en/tournaments
/fa/game/[gameId]   /en/game/[gameId]
/fa/play/[roomId]   /en/play/[roomId]
/fa/login           /en/login
```

- middleware keeps localized URLs visible while rewriting internally to shared pages,
- root shell activates locale `lang`, `dir`, metadata, typography and theme direction,
- Header/Footer emit localized routes,
- Header provides explicit FA/EN switching while preserving the logical path,
- Admin remains locale-neutral.

## 3. Localization Foundation

Message domains currently include:
- `i18n/messages.ts`
- `i18n/profile.ts`
- `i18n/auth.ts`
- `i18n/leaderboard.ts`
- `i18n/tournament-detail.ts`
- `i18n/game-shell.ts`
- `i18n/language-switcher.ts`

Canonical client locale resolver: `hooks/useAppLocale.ts`.

The duplicate `i18n/useAppLocale.ts` was removed after consumer verification (`DEBT-014`).

## 4. Design System Alignment

`DESIGN_SYSTEM.md` is now **v2.2.0** and reflects both bilingual behavior and a canonical visual-shape hierarchy.

Current system rules include:
- Persian RTL / English LTR,
- locale-derived direction/typography,
- logical CSS instead of page-level left/right hacks,
- direction-independent identifiers/codes may remain LTR,
- 360px minimum mobile target,
- theme tokens over arbitrary/default MUI colors,
- global glow is not a default hover language,
- structural loading/empty/error patterns are shared only when they genuinely recur,
- canonical corner-radius hierarchy: compact controls `8px`, controls/inputs `10px`, small surfaces `12px`, cards/panels `16px`.

### Shape baseline

MUI numeric `sx` border-radius values multiply `theme.shape.borderRadius`. The previous `12px` base made common values such as `borderRadius: 3/4` render at 36/48px and produced over-rounded inconsistent surfaces.

The theme base is now **4px**:

```text
2   -> 8px
2.5 -> 10px
3   -> 12px
4   -> 16px
```

The theme exports `shapeScale` for explicit-pixel cases. Functional exceptions remain valid for circles, avatars, game pieces and specialized board geometry.

Theme cleanup also ensures:
- `warning` stays in Honey Bronze instead of MUI default orange,
- global Paper styling does not force visual elevation onto `elevation={0}` surfaces,
- non-interactive Cards do not globally lift/glow,
- Buttons/IconButtons expose consistent focus-visible behavior,
- reduced-motion preference is respected globally.

## 5. Managed Footer

Backward-compatible contract:

```text
legacy: footer          # Persian compatibility
new:    footer.fa
new:    footer.en
response: footer + footers.fa + footers.en
```

- no DB migration required,
- focused bilingual editor: `/admin/footer`,
- eNamad is visible in both Persian and English for now.

## 6. Game Presentation Metadata

`apps/web/src/lib/game-catalog.ts` is the canonical web presentation bridge with real consumers across Lobby/game/Profile/Tournament presentation.

Runtime rules/capabilities remain GameAdapter/server-owned.

## 7. Shared UI / Component Graveyard

Canonical by real use:
- `GameShell`
- `Dice3D`
- `Header`
- `Footer`
- `GameCard`
- `EmptyState`
- `LoadingSkeleton`
- focused `/admin/footer` editor
- game-specific boards remain game-specific

Remaining candidate:
- `Modal` — locale-neutral/token-aligned but no verified consumer; do not force adoption and do not delete before executable verification.

Graveyard rule remains: inspect → verify consumers → compare duplicate → migrate → validate → delete only proven dead code.

## 8. Shared GameShell

The canonical shell now:
- serves local/bot and multiplayer routes,
- localizes connection/room/match/rematch/back/waiting labels,
- uses locale-aware back direction,
- keeps room codes LTR,
- uses logical spacing,
- provides `lg` width for board-heavy games,
- separates utility header, primary title, secondary state and main board content,
- keeps winner treatment restrained and semantic.

## 9. Lobby

Lobby now consumes the shared UI system:
- game selection → `GameCard`,
- repeated loading → `LoadingSkeleton`,
- empty states → `EmptyState`,
- retryable failures expose retry,
- game/room navigation is explicitly localized,
- code input stays LTR,
- selected mode state is semantic,
- room/recent sections adapt for narrow viewports.

`DEBT-003` is resolved in code. `DEBT-009` is substantially mitigated.

## 10. Responsive/UI Hardening

### Header
- compact mobile navigation/control layout for 360px,
- accessible mobile icon navigation,
- localized language switcher,
- logical spacing and `aria-current`.

### Root layout
- global max-width/padding removed so each page/GameShell owns its proper content geometry,
- avoids double-padding and narrow board constraints,
- Persian webfont loads only for Persian locale.

### Tournaments list
- shared structural loading/empty states,
- theme-token CTA/progress/status treatment,
- localized login/detail links,
- restrained card hover treatment.

### Profile
`UI-001` is resolved in code:
- 1-column stats at xs, 2 at sm, 4 at md,
- mobile header stacks cleanly,
- profile hero compacts on narrow viewports,
- username/email wrap safely,
- locale-aware Lobby/login routes and back arrow,
- table overflow is contained inside history region,
- empty history uses canonical `EmptyState`.

### Multiplayer room
A stale deleted-module import was discovered and fixed (`BUG-002`). `/play/[roomId]` now:
- imports the canonical locale hook,
- uses explicit localized Lobby back route,
- uses semantic spectator/waiting/chat colors,
- removes unrelated raw blue chat color and heavy waiting-panel shadow,
- stacks chat composer on narrow screens,
- preserves actual realtime/game logic.

## 11. RTL Infrastructure Risk

### DEBT-020 — MUI/Emotion RTL style-cache verification

The app derives `html dir`, `theme.direction`, and touched product layouts use logical CSS. However MUI 5 + Emotion may require an RTL cache/plugin for components that emit physical CSS. `stylis-plugin-rtl` is not currently declared in the web package.

Current rule:
- do not claim full MUI RTL correctness from static code alone,
- do not change dependency/lockfile state without an executable install step,
- verify actual MUI mirroring at the later local run,
- add the Emotion RTL cache/plugin only if runtime validation confirms it is required or when lockfile-safe dependency installation is available.

This is an implementation/validation issue, not a product decision.

## 12. Bug / Debt Ledger

- `DEBT-001` global locale/direction — SUBSTANTIALLY MITIGATED; runtime validation pending.
- `DEBT-002` mixed-language Lobby — SUBSTANTIALLY RESOLVED.
- `DEBT-003` GameCard mismatch — RESOLVED IN CODE.
- `DEBT-004` singleton RTL theme coupling — MITIGATED; see `DEBT-020` for runtime MUI RTL verification.
- `DEBT-005` Footer single-locale — SUBSTANTIALLY MITIGATED.
- `DEBT-006` duplicate game presentation metadata — RESOLVED for primary consumers.
- `DEBT-007` locale routing/link dispersion — SUBSTANTIALLY MITIGATED; targeted remaining-link review continues.
- `DEBT-008` hard-coded game-entry copy — SUBSTANTIALLY RESOLVED.
- `DEBT-009` shared feedback primitive bypass — SUBSTANTIALLY MITIGATED in Lobby/Tournaments; targeted review continues.
- `DEBT-010` Tournament mixed-language presentation — SUBSTANTIALLY RESOLVED.
- `DEBT-011` Footer Web/Admin/Server coupling — SUBSTANTIALLY MITIGATED.
- `DEBT-012` Admin operational monolith — OPEN / NON-BLOCKING.
- `DEBT-013` game-catalog graveyard risk — RESOLVED.
- `DEBT-014` duplicate locale hook — RESOLVED.
- `DEBT-015` server/data-owned localization boundary — TRACKED.
- `DEBT-016` dead Footer logic in `/admin` — OPEN; focused editor is canonical, deletion pending safe validation.
- `DEBT-017` Persian hard-coded GameShell labels — RESOLVED IN CODE.
- `DEBT-018` missing visible language switcher — RESOLVED IN CODE.
- `DEBT-019` MUI warning/default hover-glow divergence — RESOLVED IN CODE.
- `DEBT-020` MUI/Emotion RTL cache/plugin verification — OPEN / RUNTIME-VALIDATION DEPENDENT.
- `DEBT-021` oversized/inconsistent MUI radius baseline — RESOLVED IN CODE; visual validation pending.
- `UI-001` Profile 360px density — RESOLVED IN CODE.
- `BUG-001` runtime/compile state — VALIDATION PENDING.
- `BUG-002` `/play` imported deleted `i18n/useAppLocale` — RESOLVED IN CODE; executable validation pending.

## 13. Validation Infrastructure

A targeted branch-only workflow exists at `.github/workflows/foundation-web-check.yml` with:
- `npm ci`,
- shared package build,
- boundary check,
- web typecheck,
- web build.

The connector has not surfaced a completed status for the latest branch commit yet. No validation PASS is claimed.

## 14. Current UI Cleanup Order

User preference: **do not request local visual review yet**.

Continue:
1. Tournament detail + game-entry remaining 360px/logical-direction audit,
2. game-specific surrounding UI overflow scan without redesigning game art,
3. remaining proven recurring loading/empty/error normalization,
4. safe Admin dead-logic cleanup preparation,
5. static known-bug/compile-risk pass,
6. then declare a local visual-review checkpoint.

## 15. Safety

- `main`: untouched.
- Governance branch: untouched.
- Merge: not performed.
- Deployment: not performed.
- Build/typecheck/tests/browser QA: NOT CONFIRMED / NOT RUN in current connector context.
- Never report PASS from static inspection alone.
