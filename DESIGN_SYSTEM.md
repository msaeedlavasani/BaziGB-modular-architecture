# BaziGB — Design System & UI Architecture

**Version:** 2.4.1

This document defines the visual and interaction language of BaziGB. It does not define backend architecture, game rules, deployment, database strategy, or business strategy.

## 1. DESIGN PRINCIPLE

BaziGB should feel like a proprietary gaming platform rather than a generic web dashboard.

The visual language should be:
- immersive
- dark
- tactile
- premium
- minimal
- game-oriented
- readable
- responsive
- consistent

Avoid generic dashboard aesthetics, excessive card usage, flat administrative layouts, unrelated visual styles, arbitrary color systems, and unnecessary decorative elements.

## 2. VISUAL SOURCE OF TRUTH

The existing BaziGB MUI theme is the implementation source of truth for design tokens.

Use semantic theme tokens. Do not introduce arbitrary colors when an existing token expresses the same semantic meaning.

If a new recurring visual pattern is required, implement it consistently and propose adding the reusable rule here. Do not create design-system rules for one-off components unless they are expected to recur.

## 3. COLOR SYSTEM

Current BaziGB implementation uses the Honey Bronze palette.

| Token | Value | Use |
|---|---|---|
| `primary.main` | `#EEAC2F` | CTA, active states, brand |
| `primary.light` | `#FFD27A` | highlights |
| `primary.dark` | `#B97F12` | pressed/strong states |
| `secondary.main` | `#061A2D` | deep surfaces |
| `secondary.light` | `#1B3550` | elevated surfaces |
| `background.default` | `#0B1622` | page background |
| `background.paper` | `#132236` | cards/panels |
| `divider` | `#2A3F57` | borders/dividers |
| `text.primary` | `#F5EFE4` | primary text |
| `text.secondary` | `#A9B7C6` | secondary text |
| `success.main` | `#4CAF7D` | success |
| `error.main` | `#E26D5A` | errors/danger |

Rules:
- Do not introduce arbitrary brand colors.
- Do not use default MUI Indigo/Blue/Purple/Orange styles merely because they are defaults.
- Prefer theme tokens over hard-coded values.
- Use alpha/transparency derived from theme tokens where needed.
- Do not introduce a new color for a single component.
- Warning states should remain within the approved Honey Bronze token family until a dedicated warning token is deliberately introduced.

## 4. TYPOGRAPHY

Typography is locale-aware while visual hierarchy remains shared.

Persian (`fa`):
- primary: `Vazirmatn`
- fallback: `Segoe UI, Tahoma, sans-serif`

English (`en`):
- Latin system/Segoe-style stack until a dedicated Latin family is explicitly approved.

Guidelines:
- headings: bold/heavy
- interactive elements: medium/bold
- body: regular
- maintain readable line height
- maintain clear hierarchy
- do not force the Persian font stack onto English when the active locale provides a Latin stack

Avoid decorative fonts that reduce readability.

## 4A. SPACING SCALE

The canonical MUI spacing base is **8px**. Numeric layout values in `sx` must
be interpreted against this scale:

```text
1   -> 8px
1.5 -> 12px
2   -> 16px
3   -> 24px
4   -> 32px
6   -> 48px
8   -> 64px
```

Do not override the theme spacing base locally. Do not describe or review an
`sx` spacing value without converting it through this scale. Component-internal
spacing and page-level spacing use the same scale; the canonical page geometry
below determines which values belong at the page boundary.

## 5. DIRECTIONALITY — RTL / LTR

BaziGB supports both directions through one shared component tree:

- Persian (`fa`) is RTL.
- English (`en`) is LTR.

Requirements:
- direction is derived from active locale, not hard-coded at page level
- use logical spacing/layout properties where possible
- preserve intuitive navigation direction in both locales
- do not duplicate component trees for RTL/LTR
- avoid manual left/right hacks when logical CSS can solve the problem
- direction-independent values such as invite codes, phone numbers, verification codes and identifiers may explicitly remain LTR
- specialized visual geometry may use a fixed direction only when the geometry itself requires it; document the reason (for example deterministic tournament bracket connector math)

For text-containing flex children, use `minWidth: 0` where necessary to prevent overflow.

## 6. APPLICATION LAYOUT

Use the shared application shell when one exists.

Prefer:

```text
AppShell
 ├── Header
 ├── Main content
 └── Footer
```

over implementing global layout structures independently in every page.

Use MUI layout primitives. Avoid unnecessary absolute positioning.

### Canonical page geometry

Public application pages MUST use the shared `PageContainer` for their outer
content geometry. A page must not re-declare its own combination of horizontal
gutters, vertical page padding and centered max-width unless its geometry is
functionally specialized (for example a game board or tournament bracket).

Canonical page spacing:

| Viewport | Inline gutter | Block padding |
|---|---:|---:|
| `xs` / 360px+ | `16px` | `24px` |
| `sm` | `24px` | `40px` |
| `md`+ | `32px` | `48px` |

Width variants are semantic:
- `narrow` → focused forms/read-heavy content (`sm`),
- `content` → ordinary lists/profile/content (`md`),
- `wide` → discovery, hubs and broad data layouts (`lg`).

Page sections should normally use `24px` gaps on mobile and `32px` on larger
screens. Components own their internal padding; pages own only section rhythm.
Do not stack page padding, MUI Container gutters and feature-local outer padding.
New pages must select a `PageContainer` width variant before feature layout work.

## 6A. SHAPE / CORNER-RADIUS HIERARCHY

BaziGB uses a restrained radius hierarchy. The goal is consistency, not making every element identical.

The MUI base shape radius is **4px**. Numeric `sx` radius values multiply this base, so common values map predictably:

| Usage | Typical value | Effective radius |
|---|---:|---:|
| compact chips/small controls | `2` | `8px` |
| buttons/inputs/filter controls | `2.5` | `10px` |
| icon containers/small surfaces | `3` | `12px` |
| cards/panels/major surfaces | `4` | `16px` |

Rules:
- Do not use very large rounded corners on ordinary cards/panels unless the component has a deliberate pill/capsule role.
- Do not scatter arbitrary pixel radii when the shared hierarchy expresses the intended level.
- Game pieces, circular indicators, avatars and specialized board geometry may use shapes dictated by their function.
- Radius should communicate hierarchy: controls tighter, major surfaces slightly softer.
- Border treatment and radius should work together; avoid stacking heavy borders, excessive elevation and exaggerated rounding on the same surface.

The theme exports `shapeScale` for cases that require explicit pixel values outside numeric `sx` multiplication.

## 7. COMPONENT DECISION RULES

Before creating a new component:
1. Search existing shared components.
2. Determine whether an existing component can be composed.
3. Determine whether an existing component can be extended.
4. Create a new component only if it has a distinct responsibility.

### Card
Use a Card for a discrete information/object unit.

### Panel
Use a Panel for a persistent functional area inside a larger screen.

### Dialog
Use a Dialog for a focused interaction or confirmation that should remain in the current context.

### Drawer
Use a Drawer for secondary navigation or contextual functionality.

### Page Section
Use a page section when content belongs naturally to the page hierarchy and does not need container-like visual separation.

Do not turn every section into a Card.

Shared primitives must earn canonical status through real consumers. Do not keep parallel inline implementations after a shared pattern becomes canonical.

### Responsive composition contract

Responsive behavior is a property of a component's available space, not a list
of named devices. New page sections must follow these rules before adding a
viewport breakpoint:

- Use fluid `clamp()` spacing between documented minimum and comfort maximum values.
- Use `PageContainer` for page gutters and block rhythm.
- Use `ResponsiveGrid` for repeated equal-priority items. It chooses columns from the container's actual inline size with `auto-fit/minmax`; feature pages must not guess phone/tablet/desktop column counts.
- Use container queries only when composition or priority changes, not to nudge pixels.
- Preserve CTA hierarchy across every layout mode. Primary actions may span a row at intermediate widths; DOM order must match visual priority.
- Use intrinsic geometry (`aspect-ratio`) and available dynamic viewport block size for boards/media. Do not store per-breakpoint pixel widths in feature metadata.
- Short landscape viewports are a first-class mode: primary content must enter the initial viewport and supporting controls move beside it when space permits.
- Height constraints for live lists use viewport-relative logical units and a comfort cap (for example `min(..., dvb)`), never a standalone magic pixel value.
- Validate a viewport matrix covering narrow portrait, narrow landscape, medium portrait, medium landscape, and wide desktop. Zero horizontal overflow alone is not sufficient; primary content visibility and CTA order are required assertions.

Responsive acceptance never targets one observed pixel width across devices. A
measurement such as `328px` may be evidence for one `360px` viewport, but the
contract is consumption of available container space within fluid minimum and
comfort boundaries. Evaluation must cover composition, hierarchy, reachability,
content density and task usability in addition to overflow and geometry.

The server render and the first client render must also be deterministic at
every viewport. Do not derive initial UI from wall-clock time, mutable socket
singletons, browser storage or device-only APIs. Activate those values after
mount/connection and prevent mobile browser auto-formatting from rewriting the
server HTML before hydration.

Equal-width or equal-height cards are correct only for equal-priority objects.
Product actions use `ActionDeck`: the primary outcome remains visually dominant,
while secondary and tertiary actions adapt without artificial empty space.
Dominance comes from width, position, content and emphasis; never from stretching
a sparse card across extra rows merely to make it larger.

### Page-title hierarchy

Ordinary application pages use `PageHeader`. Feature pages must not choose
arbitrary `h1` sizes. Title scale is fluid and bounded, the page has one semantic
`h1`, identity stays visually attached to the title, and descriptions use a
bounded readable line length.

## 8. GAME UI

Game interfaces are not administrative interfaces.

Visual hierarchy should prioritize:
1. Game state
2. Board/game area
3. Player/turn status
4. Legal actions
5. Action feedback
6. Secondary information

The game board should remain the visual center of the screen. Avoid surrounding the board with excessive generic cards.

### GameShell composition contract

Every game screen keeps this semantic hierarchy; its physical composition may
become two-region in short landscape viewports:

```text
utility navigation
game title
status row
settings toolbar (when present)
primary board/game surface
secondary game information
```

- Game identity appears once as the title; do not repeat its name/icon in the adjacent status row.
- Turn/connection/match status appears once in the shell; a board must not repeat the same status below itself.
- Settings belong inside the canonical restrained GameShell toolbar, not in a free-floating full-width row.
- The catalog may declare only intrinsic `surfaceRatio` geometry. GameShell derives the rendered track from available inline/block space and a shared comfort cap; it must not contain game-specific pixel widths.
- Settings and the primary surface share the derived track in vertical mode. In short landscape mode, settings become the supporting region beside the visually primary board.
- The toolbar fills the selected game track, wraps responsively, and keeps one surface/border/radius treatment across games.
- Presence, connection notices, waiting state, result actions and chat share one
  support-track inline size. A feature page must not assign competing local
  widths to these stacked surfaces; their vertical edges remain aligned as the
  viewport changes.
- Board geometry and game-art styling stay game-specific and visually primary.
- Game settings use `GameSettingsToolbar`. Options and actions are separate
  semantic regions with consistent control height and an intentional reflow;
  wrapping a free-form flex row inside a shared border is not conformance.
- On narrow viewports, settings are supporting content and collapse behind a
  clearly labelled native disclosure. The game surface is the primary user
  intent and must appear before expanded configuration controls.
- Responsive acceptance measures task access inside the initial viewport, not
  merely absence of horizontal overflow. Discovery must expose all game choices
  at 320px without vertical discovery scrolling; Game Hub must expose all three
  play modes at 320x700 before the fold.
- A board piece may be sized from its containing cell but must never impose a
  pixel minimum wider than that cell. Container ownership wins over decorative
  fidelity at every supported width.
- Board-local labels use locale-aware numerals and the product type system.
  Raw implementation labels and harsh structural lines are prohibited.

### Status indicator anatomy

`StatusCluster` owns grouping and wrapping. `StatusPill` owns the anatomy of one
indicator: icon, label, logical gap, tone, border and containment. Pages and game
boards may not repair MUI Chip icon margins locally. Status, connection, turn and
match results must have one semantic owner and must not be repeated below a board.

### Game identity system

Game identity uses `GameIdentityMark`, not unrelated emoji selected per page.
Every glyph belongs to one family with a shared frame, stroke weight, optical
size, color role and small/medium/large scale. A new game must select or create a
semantic glyph inside this family and validate it beside existing games before
registration. Game art may be richer inside gameplay; discovery identity remains
minimal, recognizable and brand-coherent.

### Navigation composition

#### Pre-implementation composition gate

A material shared-UI change does not move directly from approved prose to code.
Before implementation, its pilot must record one compact composition map that
shows: semantic regions, exact primary CTA, initial-viewport priority, grouping
rationale, responsive reflow, and the invariant visual anchor. Approval of
individual requirements is not approval of an unreviewed composition assembled
from them. Typecheck, build and overflow checks cannot substitute for this gate.

Header navigation uses `NavigationItem`. Icon and label form one proximity group
with a single direction owner. Do not combine MUI `startIcon` spacing, manual
logical margins and direction overrides in the same navigation item.

One prominent destination should have one primary affordance in the same header.
The centered BaziGB brand is the Lobby/Home entry point, so a second Lobby icon is
not rendered beside Leaderboard and Tournaments. Visual symmetry is not a reason
to duplicate information architecture.

Header anatomy is contextual:

- Lobby and ordinary internal pages may expose discovery destinations plus Profile and language.
- Active game pages remove discovery and Profile destinations. Language and game sound occupy opposite utility edges; the centered brand remains the sole Lobby affordance.
- Moving from an active multiplayer session through the brand, contextual Back action or another app route must enter the shared safe-exit confirmation. Browser unload keeps a native warning as a last resort.
- Profile remains on the same physical side at all supported widths. Responsive layout must not swap its side merely to fill space.

The Header uses exactly three independent top-row slots: left utility, centered
brand and right utility. The brand occupies the mathematical center of the
available header width regardless of utility content width. Utility controls sit
at opposite container edges and never share the brand link, brand safety area or
a common outlined surface with unrelated controls. Proximity is evaluated from
the rendered result, not merely from DOM ownership.

A tab-like navigation row represents peer destinations and therefore renders at
least two meaningful choices with one clear current state. A single destination
must remain a standalone navigation action; it must not occupy a full strip or
use selected-tab styling. For the Alpha public shell, `Games` and `Leaderboard`
are the peer destinations. The brand remains the universal Home escape while
`Games` communicates the current information-architecture section.
The two public peers split the full navigation row into equal target areas. A
single subtle divider separates them and the active indicator belongs to the
full selected segment, preventing the row from collapsing into a dense cluster
under the centered brand.

Context navigation describes meaningful product levels (`Lobby → game hub → room`), not every URL segment. Its Back destination must be predictable. A transition that ends or abandons shared state explains the consequence before navigation and announces the resulting state to people who remain.

Global and local navigation have separate jobs. A global destination stays
visually active while the user is inside one of its descendants; it must not be
disabled, because disabled means unavailable rather than “current section”. A
descendant page exposes one subdued parent link in its canonical page header
(for example `Back to all games`). At one level of depth, do not add a second
navigation bar or a full breadcrumb trail. Semantically, an exact global match
uses `aria-current="page"`; an active ancestor uses
`aria-current="location"`. New hierarchical pages must declare this parent
relationship before implementation.

### Participant presence

Multiplayer surfaces must feel inhabited without surrounding the board with social chrome:

- identify creator, seated players and spectators;
- identify self and current turn without color alone;
- attribute chat and reactions to a participant;
- show reconnecting state beside the affected identity with subdued text/icon treatment;
- never present a connection delay as a broken control or deliberate stalling;
- retain no presence history by default.

The participant strip is subordinate to the board. Connection trouble may use warning tone but must not take the result or primary-action visual level.

### Game sound contract

Sound is gameplay feedback, not Lobby decoration. Before entering a game for the first time, offer an explicit choice between sound and silent play. Only a choice made through that game-entry prompt counts as consent; a legacy mute value or interaction with a mute control must not silently bypass the prompt. Direct game URLs must preserve the same gate. Mute is available only on game surfaces and the explicit choice persists locally.

The canonical cue vocabulary is: game start, own turn, time warning, move, capture, dice/random action, reconnect, win, loss and draw. Declaring a cue is incomplete until the pilot game proves that its real state transition triggers it. Every cue has a visible/text equivalent. Music, lobby autoplay and sound before consent are prohibited. New audio assets require a human listening pass for loudness, repetition fatigue and brand fit.

One atomic state transition emits one dominant cue. Do not stack `move` with
`your-turn` when the opponent's move immediately returns control, and do not
stack a terminal `move` with `win`, `loss` or `draw`. Priority is result over
action over turn notification; a delayed independent event may still announce
itself when it is not part of the same transition.

### Footer contract

The footer belongs to Lobby and trust/legal pages only and is absent from gameplay and other task-focused routes. On every viewport it remains in normal document flow below primary content, so legal/support links remain reachable without competing with the first-view CTA. Mobile uses the same restrained stacked composition rather than hiding access. Brand, links, trust seal and copyright use caption/body scale rather than promotional headline scale.

### Cross-game visual language

Shared game art is governed as a family, not generated per feature. Every board
must share palette roles, edge treatment, elevation, interaction feedback,
typographic treatment and piece material while preserving game-specific geometry
and recognizability. Concept art is evidence for a human art-direction gate; it
must not be shipped directly as a board implementation or identity asset.

### Remote trust assets

External trust or compliance images must define loading, success and error
states. A blocked image must never expose a broken-image glyph. The fallback must
remain an honest verification link and must not impersonate a successfully loaded
official seal.

## 9. TACTILE GAME LANGUAGE

Game elements should feel physical without becoming excessive skeuomorphism.

Use layered surfaces, restrained shadows, subtle inset shadows, controlled gradients, bronze highlights, and meaningful interaction glow.

Avoid glow effects everywhere. Glow should communicate meaningful interaction.

## 10. INTERACTION STATES

Interactive components should clearly communicate:
- default
- hover
- focus
- active
- selected
- disabled
- loading
- error
- success
- reconnecting where relevant

Do not rely on color alone.

## 11. LOADING STATES

Prefer structural skeletons when the layout is known. Avoid generic full-page spinners when only one component/section is loading. Loading states should preserve the expected layout where practical.

A shared structural skeleton may be reused for repeated content grids/lists. Page-specific skeletons remain preferable when the final geometry is materially different.

## 12. EMPTY STATES

An empty state should contain:
- clear explanation
- relevant BaziGB visual language
- meaningful CTA when an action is available

Avoid empty states that only say "No data".

Use a shared product-level empty-state pattern when the hierarchy genuinely repeats. Do not create separate visual treatments for the same product state in every page.

## 13. ERROR STATES

Errors should be understandable, localized, and actionable where possible.

Retryable data-loading failures should expose a retry action when the retry is safe and meaningful.

For real-time gameplay, connection failures should be visible rather than allowing the UI to appear frozen.

## 14. RESPONSIVE DESIGN

Minimum supported mobile viewport: `360px`.

Requirements:
- no accidental horizontal scrolling
- preserve board usability
- prevent text from breaking layout
- adapt hierarchy rather than merely shrinking desktop layouts
- respect safe areas where relevant
- shared Header controls must remain usable at 360px without relying on hidden overflow
- dense desktop rows should become stacked or otherwise reorganized on mobile when needed

## 15. ACCESSIBILITY

Interactive UI should support:
- keyboard navigation where applicable
- visible focus states
- semantic labels
- `aria-label` for icon-only controls
- `aria-current` for active navigation where appropriate
- `aria-pressed` or equivalent state semantics for selectable toggle/tile interactions
- sufficient contrast
- reduced motion preferences

Important game states should not be communicated through color alone.

## 16. ICON SYSTEM

MUI Icons are the default generic icon system.

Use MUI Icons when an appropriate icon exists.

`lucide-react` may be used when:
- MUI Icons does not provide an appropriate equivalent, or
- an existing BaziGB component family already uses Lucide.

Do not mix MUI and Lucide icons randomly within the same component family.

If Lucide is repeatedly used, prefer a shared BaziGB icon wrapper only when it would actually normalize recurring size, stroke width, color, or alignment behavior. Do not introduce a wrapper speculatively.

The goal is not "all icons must come from one package". The goal is: all icons must look like they belong to BaziGB.

## 17. SPECIALIZED GAME LIBRARIES

Specialized libraries are allowed when they solve specialized problems.

For example, `react-chessboard` may be used for Chess board rendering.

It is not a replacement for the BaziGB design system.

Specialized components should be configured or wrapped so that BaziGB colors, interaction states, typography, surrounding UI, and visual language remain coherent.

Principle:

> Specialized libraries provide capability. BaziGB provides visual identity.

## 18. MUI DISCIPLINE

MUI is the primary UI foundation.

Prefer MUI components, MUI theme tokens, `sx`, shared styled components, and reusable BaziGB primitives.

Do not introduce another general-purpose UI framework for isolated components. Do not create a parallel design system.

Do not let unconfigured default MUI palette colors leak into the product when the design system has an existing semantic token family.

## 19. MOTION

Default interaction motion should be subtle and fast.

Preferred baseline:

```text
200ms
cubic-bezier(0.4, 0, 0.2, 1)
```

Motion should communicate interaction, hierarchy, state changes, and spatial relationships.

Avoid decorative animation that distracts from gameplay. Respect `prefers-reduced-motion`.

Global component styles should not add glow to every hover. Glow is reserved for meaningful state/interaction emphasis.

## 20. PERFORMANCE

Performance should be evidence-based.

Prefer localized state, efficient rendering, appropriate component boundaries, appropriate memoization, and cleanup of timers/subscriptions.

Do not mechanically add `React.memo`, `useMemo`, or `useCallback` without a reason. Do not claim a specific FPS target unless measured.

## 21. DESIGN SYSTEM EXTENSION

When a recurring new UI pattern appears:
1. search for an existing pattern
2. reuse if possible
3. compose/extend if possible
4. create a new reusable pattern only when justified
5. document it here if it becomes a recurring design rule

Avoid speculative design-system abstractions.

### Executable component registry

Reusable BaziGB components are registered in
`apps/web/src/design-system/registry.json`. The registry records responsibility,
contracts, consumers, evaluation and maturity. A component's folder location
does not make it canonical.

Maturity states:

- `Experimental` — a bounded exploration; product adoption is not assumed.
- `Candidate` — a reusable contract with a reference implementation, real consumer and evaluation plan; targeted adoption is allowed.
- `Stable` — at least two representative consumers plus automated regression and rendered evidence; preferred for new work.
- `Deprecated` — retained temporarily with a named replacement or removal path.

Contribution sequence:

`need → existing-system search → proposal → contract → reference implementation → consumer → evaluation → maturity decision → registration → adoption → learning or deprecation`

Feature code chooses semantic component roles. Raw page-level geometry such as
repeated-item minimum widths, column counts, global gutters or composite-card
padding is not a feature API. Those decisions live in the executable layout
contract and shared components.

Run `npm run check:design-system` and `npm run test:design-system` when changing
a registered component, its contract, maturity, or consumers. The check is a
structural gate; targeted rendered evidence remains required before a Candidate
is promoted to Stable.

## 22. FRONTEND COMPLETION CHECKLIST

- [ ] Existing BaziGB theme tokens used
- [ ] Active locale direction (`RTL`/`LTR`) preserved
- [ ] Locale-specific typography applied correctly
- [ ] Shape/radius hierarchy follows the canonical scale
- [ ] 360px+ responsive behavior checked
- [ ] No accidental horizontal overflow
- [ ] Existing components reused where appropriate
- [ ] Loading state handled where relevant
- [ ] Empty state handled where relevant
- [ ] Error state handled where relevant
- [ ] Real-time/disconnection state handled where relevant
- [ ] Focus/accessibility behavior handled
- [ ] Reduced motion considered
- [ ] No unnecessary UI dependency added
- [ ] No duplicated component pattern introduced
- [ ] No unrelated visual redesign introduced
- [ ] Brand identity remains coherent
