# BaziGB — Design System & UI Architecture

**Version:** 2.2.0

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
