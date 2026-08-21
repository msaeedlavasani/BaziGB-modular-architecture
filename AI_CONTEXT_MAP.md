# BaziGB — AI Context Map

**Version:** 1.1.0
**Role:** Repository navigation and context-routing source of truth for AI agents.

## 1. Purpose

This file tells an AI agent where to start, what to read next, and what not to read for a task.

The repository is not a flat knowledge base. Files have different roles, authority, and relevance. The AI must use task-directed discovery rather than reading the repository indiscriminately.

## 2. Mandatory Entry Point

For every new AI task:

1. Read `AI_CONTEXT_MAP.md`.
2. Read `AGENTS.md`.
3. Route the task.
4. Discover only the context required by that route.
5. Classify the task and impact.
6. Identify the closest existing implementation.
7. Read only additional files justified by evidence.

The canonical lifecycle is:

`REQUEST → ROUTE → DISCOVER → CLASSIFY → IMPACT ANALYSIS → PLAN → IMPLEMENT → VALIDATE → REPORT`

Do not start implementation before discovery is sufficient.

## 3. Source-of-Truth Priority

When sources disagree, use this order:

1. Actual working repository code and configuration
2. Package/workspace manifests
3. `AGENTS.md`
4. `DESIGN_SYSTEM.md`
5. Current architecture documentation
6. `ai/*` operational documentation
7. Task-specific documentation
8. Historical documentation
9. AI assumptions or general knowledge

If a conflict is found, report it. Do not silently choose an assumption.

## 4. Task Routing

| Task type | Read next | Then inspect |
|---|---|---|
| General feature | `ai/AI_WORKFLOW.md` | closest existing feature |
| Frontend/UI | `DESIGN_SYSTEM.md`, `ai/COMPONENT_REGISTRY.md` | affected page/component |
| New component | `DESIGN_SYSTEM.md`, `ai/COMPONENT_REGISTRY.md` | closest component + consumers |
| New page | `DESIGN_SYSTEM.md`, `ai/COMPONENT_REGISTRY.md` | closest existing page |
| New game | `DESIGN_SYSTEM.md`, `ai/COMPONENT_REGISTRY.md`, `ai/ASSET_SYSTEM.md` | closest existing game + shared game infrastructure |
| Game asset work | `ai/ASSET_SYSTEM.md` | asset registry + closest asset usage |
| Backend/API | `AGENTS.md` | relevant package/module/API |
| Real-time feature | `AGENTS.md`, `ai/AI_WORKFLOW.md` | closest real-time implementation |
| Bug fix | `ai/AI_WORKFLOW.md` | failing implementation + tests |
| Responsive/UI issue | `DESIGN_SYSTEM.md`, `ai/VALIDATION_GATE.md` | affected component/page + rendered UI |
| Dependency change | `AGENTS.md` | relevant package manifest + relevant usages |
| Architecture change | `AGENTS.md` | affected package boundaries + current architecture docs |
| Validation-only task | `ai/VALIDATION_GATE.md` | affected package/tests/build config |

## 5. Discovery Levels

### Level 0 — Governance

Always:

- `AI_CONTEXT_MAP.md`
- `AGENTS.md`

### Level 1 — Domain Rules

Read only when relevant:

- `DESIGN_SYSTEM.md`
- `ai/AI_WORKFLOW.md`
- `ai/COMPONENT_REGISTRY.md`
- `ai/ASSET_SYSTEM.md`

### Level 2 — Architecture

Inspect only the relevant:

- package/workspace manifest
- package boundaries
- module structure
- API/state architecture
- current architecture documentation

### Level 3 — Reusable Systems

Search for:

- shared components
- existing patterns
- hooks
- utilities
- game infrastructure
- existing assets

Verify registry entries against actual code and current consumers.

### Level 4 — Closest Analogue

Find the most structurally similar working implementation and study it before creating a new one.

### Level 5 — Validation

Use `ai/VALIDATION_GATE.md` and relevant tests/build/browser validation.

## 6. Closest-Analogue Rule

Before implementing a new feature, identify at least one existing implementation that is structurally similar.

Examples:

- new game → closest existing game
- new page → closest existing page
- new component → closest existing component
- new interaction → closest existing interaction
- new asset type → closest existing asset type

Existing code is evidence. Do not redesign from scratch when an established pattern already solves the problem.

## 7. Relevance Rule

Do not read a file merely because it exists.

Read a file when:

- the task route requires it,
- a relevant file references it,
- imports/dependencies/consumers indicate relevance, or
- validation requires it.

## 8. Ignore Zones by Default

Do not inspect these merely because they are present:

- deployment archives/bundles
- screenshots or ad-hoc visual captures unrelated to the task
- generated artifacts
- historical handoffs/audits
- unrelated game packages
- unrelated backend modules
- unrelated test suites
- temporary local files

These are not globally forbidden. Read them only when the current task or validation evidence makes them relevant.

## 9. Unknown Files

For an unfamiliar file, first determine:

- package/module ownership,
- imports,
- consumers,
- relevance to the task.

Do not recursively inspect unrelated files just because they have unfamiliar names.

## 10. Context Budget

The objective is **minimum sufficient context**, not maximum repository context.

Use targeted search and expand only when evidence requires it.

Never use:

`repository → read everything → decide later`

Prefer:

`task → route → relevant rules → analogue → dependencies/consumers → implementation`

## 11. Before Implementation

The agent must be able to answer:

- What user outcome is requested?
- What existing system am I extending?
- What rules govern this task?
- What can be reused?
- What is genuinely new?
- What assets are required?
- What modules are affected?
- What validation applies?
- What human input is genuinely missing?

If these cannot be answered, discovery is incomplete.

## 12. Updating This Map

If a new canonical source of truth is introduced, update this map.

Do not create competing navigation documents.
