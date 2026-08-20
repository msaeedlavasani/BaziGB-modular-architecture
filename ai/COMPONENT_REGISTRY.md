# BaziGB — Component Registry

**Version:** 1.0.0
**Role:** Canonical inventory of reusable UI and product components.

## 1. Purpose

This registry prevents AI from rediscovering or recreating existing abstractions during every feature.

The registry is an index, not a replacement for source code.

When implementing UI, AI must:

`SEARCH REGISTRY → INSPECT IMPLEMENTATION → REUSE / COMPOSE / EXTEND → CREATE ONLY IF NECESSARY`

## 2. Registry Entry Contract

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

Do not document every trivial component. Register reusable patterns that materially affect future development.

## 3. Current Registry

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

## 4. Registry Maintenance

When a new reusable component is created:

1. confirm it is genuinely reusable,
2. add a concise registry entry,
3. link it to the actual implementation path,
4. describe its responsibility and reuse boundaries.

Do not register one-off components merely because they have a component file.

## 5. No Duplicate Abstractions

The existence of a registry entry does not override code reality.

Before reuse, inspect the actual implementation.

If the registry points to a missing or obsolete implementation:

- report the stale entry,
- determine the current source,
- update the registry when appropriate.

Never create a duplicate abstraction just because registry metadata is incomplete.

## 6. Game Extension Rule

For a new game, identify:

- shared game shell/infrastructure
- shared player/turn patterns
- shared action/control patterns
- shared feedback states
- reusable board/container patterns
- existing asset patterns

Then isolate only game-specific UI and assets.

## 7. Future Machine-Readable Registry

This document is the human-readable registry contract for V1.

A future machine-readable representation may be introduced when the repository contains enough stable component metadata to justify it. Until then, do not invent a second registry format.
