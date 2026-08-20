# BaziGB — Asset System

**Version:** 1.0.0

## 1. Purpose

Visual assets are product resources, not implementation details.

The AI must distinguish between:

1. existing assets that can be reused,
2. assets that can be generated from existing primitives,
3. assets that genuinely require human-provided source material.

## 2. Asset Categories

Examples:

- game-board
- tile
- game-piece
- token
- card
- icon
- avatar
- illustration
- background
- texture
- animation
- logo
- decorative element

Use the narrowest accurate category.

## 3. Asset Discovery

Before requesting an asset:

1. search the repository asset directories,
2. search existing asset references,
3. inspect the closest analogue,
4. determine whether an existing asset can be reused,
5. determine whether CSS/SVG/programmatic rendering is sufficient.

Do not request an asset that already exists or can reasonably be generated from the established system.

## 4. Asset Status

Every required asset must be classified as:

- EXISTING
- GENERATABLE
- HUMAN_REQUIRED
- OPTIONAL

## 5. Asset Specification

When an asset is HUMAN_REQUIRED, provide:

- Asset ID
- Name
- Category
- Purpose
- Expected usage
- Preferred format
- Dimensions
- Aspect ratio
- Transparency requirement
- Color requirements
- Variants
- Interaction states
- Safe area where relevant
- Naming convention

Do not ask vague questions such as "Can you send the images?"

## 6. Preferred Formats

Use the simplest appropriate format.

- vector/icon/flat game art → SVG preferred
- transparent raster → PNG preferred
- photographic/complex raster → WebP/AVIF where appropriate
- animation → choose the simplest supported format that preserves required quality

Do not convert or degrade provided source assets without a reason.

## 7. Game Asset Contract

A game may require:

- board
- tiles
- pieces
- tokens
- player markers
- cards
- resource icons
- backgrounds
- state indicators
- effects

The AI must identify the complete asset set during planning rather than discovering missing assets one by one during implementation.

## 8. Consolidated Human Request

When human assets are required, provide one consolidated list.

For each item include its full specification.

Continue implementing all functionality that does not depend on the missing assets.

Do not repeatedly interrupt implementation for individually discoverable assets.

## 9. Asset Naming

Use stable semantic names.

Prefer:

`<game>-<category>-<semantic-name>-<variant>`

Examples:

`catan-resource-wood`
`catan-piece-road`
`catan-card-development`

Avoid names based only on visual appearance such as:

`gold-image-2`
`new-final-final`
`thing-red`

## 10. Registration

When a durable game or platform asset is introduced, register enough metadata for future discovery.

At minimum:

- ID
- category
- source/path
- game/domain
- intended usage
- variants/states when relevant

## 11. Accuracy Rule

For branded, licensed, rules-critical, or visually specific game assets, do not invent approximations when the requested product experience depends on accurate source material.

If accurate source material is required, classify it as HUMAN_REQUIRED and request it explicitly.
