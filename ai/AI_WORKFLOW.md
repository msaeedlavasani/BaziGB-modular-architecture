# BaziGB — AI Development Workflow

**Version:** 1.1.0

## 1. Objective

AI should operate as an autonomous product engineering team, not as a code autocomplete system.

The target operating model is:

> Human defines product intent and provides genuinely missing inputs. AI determines implementation, reuses the established system, validates the result, and reports exceptions.

Primary goals:

- high product quality
- low human micromanagement
- low unnecessary token consumption
- consistent UI and architecture
- predictable feature delivery

## 2. Mandatory Lifecycle

Every non-trivial task follows:

`REQUEST → ROUTE → DISCOVER → CLASSIFY → IMPACT ANALYSIS → PLAN → IMPLEMENT → VALIDATE → REPORT`

The AI may perform the plan internally when autonomous execution is authorized, but it must not skip routing, discovery, planning, or validation.

## 3. Phase A — Discovery

### A1. Understand

Translate the request into:

- user outcome
- functional requirements
- visual requirements
- technical requirements
- explicit constraints

### A2. Route Context

Use `AI_CONTEXT_MAP.md` to determine the minimum relevant context.

Do not read the entire repository by default.

### A3. Inspect

Inspect only what evidence justifies, including when relevant:

- manifests
- existing pages/components
- existing game infrastructure
- relevant APIs/state
- tests
- assets
- closest analogue

### A4. Reuse Analysis

Classify implementation as:

- REUSE
- COMPOSE
- EXTEND
- CREATE

Use this order:

`reuse → compose → extend → create`

### A5. Architecture Impact

Determine:

- affected packages/modules
- API changes
- state changes
- real-time changes
- dependency changes
- boundary risks

### A6. Asset Analysis

Classify assets as:

- EXISTING
- GENERATABLE
- HUMAN_REQUIRED

### A7. Plan

The internal plan must contain:

- Feature
- User outcome
- Existing systems reused
- New implementation
- Assets
- Architecture impact
- Files/modules likely affected
- Validation
- Human input required

## 4. Autonomous Execution

When the user explicitly asks to implement/proceed autonomously, and the task fits established architecture, the AI may:

`PLAN INTERNALLY → IMPLEMENT → VALIDATE → REPORT`

Do not ask for approval for decisions already established by repository rules.

Autonomous mode does not grant release authority. Commit, push, merge, deployment, production migration, and destructive production operations remain separate actions requiring explicit authorization unless explicitly included in the task.

## 5. Human vs AI Decision Boundary

The goal is to minimize micromanagement without allowing AI to silently make high-impact product decisions.

### AI may decide autonomously

When consistent with repository rules, AI should determine reversible/low-risk implementation and presentation details such as:

- component choice
- file placement within established architecture
- spacing and typography values derived from the design system
- responsive composition
- loading/empty/error presentation
- accessibility implementation
- small reversible UI defaults
- localized technical implementation details

Do not ask the human to choose values already governed by the repository.

### Human input is required

Stop when a decision materially changes product policy, business behavior, architecture, data ownership, security, or irreversible user outcomes, including examples such as:

- pricing/monetization rules
- permissions/entitlements
- destructive data behavior
- core game rules
- major multiplayer behavior
- new package/system boundaries
- irreversible migrations
- unresolved product behavior with materially different user outcomes
- accurate external visual assets that cannot be generated or inferred safely

When uncertain, evaluate impact and reversibility. Do not escalate trivial implementation choices to the human.

## 6. Reuse Before Creation

Before creating a component, hook, utility, API, or pattern:

1. Search the component registry.
2. Verify the referenced implementation.
3. Search current consumers.
4. Search the closest analogue.
5. Determine whether reuse is sufficient.
6. Determine whether composition is sufficient.
7. Determine whether extension is sufficient.
8. Create only when responsibility is genuinely new.

Do not create feature-local copies of shared systems.

## 7. Implementation Discipline

During implementation:

- follow the approved/internal plan
- preserve existing architecture
- use existing design tokens
- preserve RTL
- preserve responsive behavior
- handle relevant states
- avoid unrelated refactors
- do not upgrade dependencies opportunistically
- do not introduce a general-purpose UI framework

If a major conflict appears, stop rather than silently redesigning the system.

## 8. Self-Correction

After implementation, validate first.

Classify failures as:

- TYPE_ERROR
- BUILD_ERROR
- TEST_FAILURE
- RUNTIME_ERROR
- ARCHITECTURE_VIOLATION
- DESIGN_SYSTEM_VIOLATION
- RESPONSIVE_ISSUE
- ACCESSIBILITY_ISSUE
- PRODUCT_GAP

Fix verified problems. Do not rewrite code based only on speculation.

For visual/UI work, rendered browser inspection is evidence. Build success alone is not evidence of visual correctness.

## 9. Asset Handoff

When human-provided assets are required, create one consolidated request.

For every asset specify:

- ID/name
- purpose
- category
- format
- dimensions
- aspect ratio
- transparency
- variants
- states
- naming convention
- expected usage

Continue all implementation that does not depend on the missing assets.

Never ask vague or repetitive asset questions.

## 10. Documentation Updates

Update a registry or canonical document only when the change creates durable reusable knowledge.

Do not create a new document for temporary task status.

## 11. Completion and Release States

A feature implementation is complete only when:

- functionality is implemented
- established architecture is preserved
- design system is respected
- relevant states are handled
- responsive behavior is addressed
- relevant validation is performed
- missing assets are identified
- no unnecessary dependency is introduced
- no duplicate abstraction is introduced

Release states are separate:

`IMPLEMENTED → VALIDATED → COMMITTED → PUSHED → MERGED → DEPLOYED → PRODUCTION VERIFIED`

Do not skip or conflate these states.

Only advance beyond VALIDATED when the user has explicitly authorized the corresponding repository/release action.

## 12. Final Report

Return:

### Implemented
...

### Reused
...

### Created
...

### Assets Required
...

### Validation
...

### Release State
...

### Risks / Limitations
...

### Human Input Required
...
