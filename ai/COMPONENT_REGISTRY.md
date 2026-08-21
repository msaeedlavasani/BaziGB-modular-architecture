# BaziGB — Component Registry

**Version:** 1.1.0
**Role:** Canonical inventory/index of reusable UI and product components.

## 1. Purpose

This registry prevents AI from rediscovering or recreating existing abstractions during every feature.

The registry is an index, not the ultimate source of truth. Actual repository code wins.

When implementing UI, AI must use:

`SEARCH REGISTRY → VERIFY FILE → INSPECT IMPLEMENTATION → SEARCH CONSUMERS → REUSE / COMPOSE / EXTEND → CREATE ONLY IF NECESSARY`

## 2. Registry Verification — Mandatory

Before using any registered component or pattern:

1. verify that the referenced implementation exists,
2. inspect the actual implementation,
3. search for current consumers/usages,
4. verify that the documented responsibility still matches reality,
5. verify that the component is actually reusable in the current architecture.

If registry metadata conflicts with actual code:

**ACTUAL CODE WINS.**

Then:

- report the discrepancy,
- use the current code as evidence,
- update the registry only when the current task creates or confirms durable reusable knowledge.

Do not silently trust stale registry metadata.
Do not create a duplicate abstraction because registry metadata is incomplete.

## 3. Registry Entry Contract

Every durable reusable component should eventually have:

- Name
- Path
- Domain
- Responsibility
- Reuse when
- Do not use when
- Variants
- Important states
- Dependencies
- Closest related components
- Current consumers (when useful)

Do not document every trivial component. Register reusable patterns that materially affect future development.

## 4. Current Registry

### Application Shell

**Domain:** application

**Role:** Shared global application structure.

**Discovery:** Search `apps/web/src` for the existing application shell/layout implementation before creating a page-level shell.

**Rule:** New pages must reuse the established application shell unless an explicit architectural exception exists.

### Shared UI Primitives

**Domain:** shared UI

**Role:** Common buttons, inputs, dialogs, cards, feedback states, navigation, and layout primitives.

**Discovery:** Search shared/component directories and existing page implementations before creating a primitive.

**Rule:** Prefer MUI and established BaziGB primitives over feature-local primitives.

### Game Infrastructure

**Domain:** games

**Role:** Shared game-screen structure, player/turn presentation, game controls, common game states, and reusable game UI.

**Discovery:** Inspect the existing game implementations and shared game-related components before starting a new game.

**Rule:** A new game must reuse established game infrastructure unless a capability is genuinely absent.

## 5. Registry Maintenance

When a new reusable component is created or an existing reusable component changes materially:

1. confirm it is genuinely reusable,
2. verify the actual path and consumers,
3. add/update a concise registry entry,
4. describe its responsibility and reuse boundaries.

Do not register one-off components merely because they have a component file.

## 6. No Duplicate Abstractions

Before creation:

`reuse → compose → extend → create`

Never create a feature-local duplicate of a shared abstraction because the existing implementation is inconvenient or imperfect.

## 7. Game Extension Rule

For a new game, identify and verify:

- shared game shell/infrastructure
- shared player/turn patterns
- shared action/control patterns
- shared feedback states
- reusable board/container patterns
- existing asset patterns

Then isolate only game-specific UI and assets.

## 8. Future Machine-Readable Registry

This document is the human-readable registry contract for V1.

A future machine-readable representation may be introduced when the repository contains enough stable component metadata to justify it. Until then, do not invent a second registry format.
