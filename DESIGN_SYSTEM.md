# BaziGB — Design System & UI Architecture

**Version:** 2.0.0

This document defines the visual and interaction language of BaziGB. It is the visual source of truth for frontend work. It does not define backend architecture, game rules, deployment, database strategy, or business strategy.

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
- Do not use default MUI Indigo/Blue/Purple styles merely because they are defaults.
- Prefer theme tokens over hard-coded values.
- Use alpha/transparency derived from theme tokens where needed.
- Do not introduce a new color for a single component.

## 4. TYPOGRAPHY

Primary font: `Vazirmatn`

Fallback: `Segoe UI, Tahoma, sans-serif`

Guidelines:
- headings: bold/heavy
- interactive elements: medium/bold
- body: regular
- maintain readable line height
- maintain clear hierarchy

Avoid decorative fonts that reduce readability.

## 5. RTL

BaziGB is RTL-first.

Requirements:
- application direction is RTL
- use logical spacing/layout properties where possible
- preserve intuitive RTL navigation
- preserve correct alignment
- do not duplicate component trees to support RTL
- avoid manual left/right hacks when logical CSS can solve the problem

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

## 12. EMPTY STATES

An empty state should contain:
- clear explanation
- relevant BaziGB visual language
- meaningful CTA when an action is available

Avoid empty states that only say "No data".

## 13. ERROR STATES

Errors should be understandable, localized, and actionable where possible.

For real-time gameplay, connection failures should be visible rather than allowing the UI to appear frozen.

## 14. RESPONSIVE DESIGN

Minimum supported mobile viewport: `360px`.

Requirements:
- no accidental horizontal scrolling
- preserve board usability
- prevent text from breaking layout
- adapt hierarchy rather than merely shrinking desktop layouts
- respect safe areas where relevant

## 15. ACCESSIBILITY

Interactive UI should support:
- keyboard navigation where applicable
- visible focus states
- semantic labels
- `aria-label` for icon-only controls
- sufficient contrast
- reduced motion preferences

Important game states should not be communicated through color alone.

## 16. ICON SYSTEM

MUI Icons are the default generic icon system.

Use MUI Icons when an appropriate icon exists.

`lucide-react` may be used when:
- MUI Icons does not provide an appropriate equivalent, or
- an existing BaziGB component already uses Lucide.

Do not mix MUI and Lucide icons randomly within the same component family.

If Lucide is repeatedly used, prefer a shared BaziGB icon wrapper so size, stroke width, color, and alignment remain consistent.

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

## 19. MOTION

Default interaction motion should be subtle and fast.

Preferred baseline:

```text
200ms
cubic-bezier(0.4, 0, 0.2, 1)
```

Motion should communicate interaction, hierarchy, state changes, and spatial relationships.

Avoid decorative animation that distracts from gameplay. Respect `prefers-reduced-motion`.

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
- [ ] RTL preserved
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
