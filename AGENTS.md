# BaziGB — AI Engineering & Workflow Standard

**Version:** 6.0.0

This document defines how AI agents must inspect, reason about, plan, modify, validate, and document work in the BaziGB repository.

It is an engineering governance document. It is NOT a duplicate of the project's architecture, product strategy, or visual design documentation.

## 0. AI ENTRY PROTOCOL

`AI_CONTEXT_MAP.md` is the repository navigation map.

At the beginning of every task:

1. Read `AI_CONTEXT_MAP.md`.
2. Read `AGENTS.md`.
3. Classify the task.
4. Follow the relevant route in `AI_CONTEXT_MAP.md`.
5. Identify the closest existing implementation.
6. Inspect only the context required to make a correct decision.

Do not treat all repository files as equally relevant.

Do not read the entire repository by default.

The required operating sequence is:

`task → route → relevant rules → closest analogue → dependencies → plan → implementation → validation`

Never use:

`repository → read everything → decide later`

## 1. SOURCE OF TRUTH

When information conflicts, use this priority:

1. Actual repository code and configuration
2. `package.json` and workspace/package manifests
3. `AGENTS.md`
4. `DESIGN_SYSTEM.md`
5. Current architecture and operational documentation
6. `ai/*` operational documentation
7. Active task documentation
8. Historical reports, audits, handoffs, and migration documents
9. AI assumptions or general knowledge

Never invent project facts. If a required fact cannot be verified from the repository, explicitly state that it is unknown.

If documentation conflicts with code, detect and report the conflict rather than silently choosing an assumption.

## 2. CURRENT STATE VS TARGET STATE

Never confuse the desired architecture with the current implementation.

Use these classifications:

- **CURRENT** — verified in the repository
- **TARGET** — desired future behavior
- **CONSTRAINT** — must not be violated
- **DEBT** — known incomplete or temporary state
- **UNKNOWN** — not verified

A TARGET or DEBT item must not be implemented merely because it appears in documentation. Implement it only when the current task explicitly requires it.

## 3. TASK MODES

### DISCOVERY

Discovery is mandatory before implementation for every non-trivial task.

Use `AI_CONTEXT_MAP.md` to route context. Determine the minimum sufficient context rather than reading the entire repository.

### PLAN MODE

PLAN MODE is the default for new features, multi-file changes, refactors, architectural changes, dependency changes, security changes, database changes, real-time architecture changes, and large UI changes.

Before implementation:
1. Inspect the relevant repository context.
2. Identify existing components, APIs, abstractions, assets, and dependencies.
3. Identify the closest existing implementation.
4. Identify affected modules.
5. Identify architecture and design risks.
6. Identify human inputs that are genuinely missing.
7. Produce a concise implementation plan.
8. Wait for approval when the task has not explicitly authorized autonomous execution.

The plan should include User Intent, Repository Findings, Closest Analogue, Reuse/Creation Analysis, Files/Modules Affected, Assets, Implementation Steps, Risks, Human Input, and Validation.

### AUTONOMOUS FEATURE MODE

If the user explicitly asks to implement/proceed autonomously, the AI may perform the planning phase internally and proceed directly to implementation when the task fits established architecture.

The internal sequence remains:

`DISCOVER → CLASSIFY → ANALYZE → PLAN INTERNALLY → IMPLEMENT → VALIDATE → REPORT`

Do NOT ask for approval for decisions already established by repository rules, design rules, existing patterns, or current code.

Autonomous execution must stop and request human input when:

- a genuine product decision is missing,
- a major architectural decision is required,
- a new package boundary must be introduced,
- an essential dependency cannot be resolved safely,
- required accurate visual assets are genuinely unavailable,
- implementation would violate an explicit constraint.

Autonomous mode does NOT permit skipping discovery, planning, validation, or reporting.

### EXECUTE MODE

EXECUTE MODE is allowed when the user explicitly asks to implement, fix, apply, or proceed.

Even in EXECUTE MODE:
- Do not silently redesign architecture.
- Do not introduce unnecessary dependencies.
- Do not modify unrelated files.
- Do not perform broad rewrites for local problems.
- Do not change package boundaries without justification.
- Do not skip validation.

## 4. CONTEXT NAVIGATION

Use `AI_CONTEXT_MAP.md` for task routing.

Before reading source files, determine the task type.

Then inspect in this order:

1. governance/rules
2. relevant domain/design documentation
3. relevant package/module architecture
4. reusable systems
5. closest analogue
6. directly affected implementation
7. tests and validation configuration

Do not recursively inspect unrelated directories.

For an unfamiliar file, first determine its package/module, imports, consumers, and relevance. Read it only when evidence indicates it is required.

The objective is **minimum sufficient context**, not maximum available context.

## 5. MINIMAL CHANGE PRINCIPLE

Prefer the smallest correct change over the largest possible cleanup.

Before creating a component, hook, utility, service, type, abstraction, or API, search for an existing equivalent.

Prefer:

```text
reuse → compose → extend → create
```

Do not create duplicate abstractions merely because an existing implementation is inconvenient. Do not refactor unrelated code during a feature or bug fix.

## 6. COMPONENT AND DESIGN SYSTEM DISCIPLINE

For frontend work, follow `DESIGN_SYSTEM.md` and `ai/COMPONENT_REGISTRY.md`.

Before creating a reusable component:

1. search the component registry,
2. inspect the actual implementation,
3. find the closest analogue,
4. determine whether reuse is sufficient,
5. determine whether composition is sufficient,
6. determine whether extension is sufficient,
7. create only when responsibility is genuinely new.

If a new durable reusable component is created, update the registry.

Do not create feature-local copies of existing shared components.

## 7. ARCHITECTURAL BOUNDARIES

BaziGB is a modular monorepo. The intended dependency direction is:

```text
@bazigb/engine
       ↑
 game packages
       ↑
apps/server
apps/web
```

Game packages must remain independent from application frameworks.

Game packages MUST NOT depend on React, Next.js, NestJS, Prisma, browser APIs, or application-specific UI code unless the repository explicitly establishes a new intentional architecture and that change has been approved.

Games should expose public APIs rather than requiring consumers to import private implementation details. Avoid circular dependencies.

If a task appears to require breaking a package boundary: explain why, identify alternatives, and request approval before proceeding.

## 8. SERVER AUTHORITY

For multiplayer gameplay, the server is authoritative.

The client must never be trusted to determine authoritative legal moves, turn ownership, win/loss conditions, score, random outcomes, or game-state transitions.

Client-side prediction or optimistic UI may exist only as presentation behavior and must reconcile against authoritative server state.

Never move game rules into React merely to simplify UI implementation.

## 9. REAL-TIME AND CONCURRENCY

For real-time features:
- validate incoming client actions on the server
- treat client payloads as untrusted
- clean up socket listeners
- clean up timers
- prevent duplicate subscriptions
- handle reconnecting
- handle disconnected state
- handle rejected actions
- avoid duplicate state transitions
- avoid race conditions

Do not introduce Redis, queues, distributed locks, or similar infrastructure unless the current task requires it. A technology mentioned in a roadmap is NOT automatically a current dependency.

## 10. TYPE SAFETY

Prefer strict TypeScript. Avoid `any`.

If `any` is technically unavoidable, keep the scope narrow, document why, and avoid propagating it.

Do not assume a dependency exists. Always inspect the relevant `package.json` before importing a library.

Do not introduce a second validation framework if an established validation mechanism already exists and is appropriate.

## 11. DEPENDENCY DISCIPLINE

Before adding a dependency:
1. Search for an existing solution.
2. Check whether the dependency already exists.
3. Check whether another package already provides the capability.
4. Evaluate bundle/runtime impact.
5. Evaluate architecture-boundary impact.
6. Explain why the dependency is necessary.

Do not upgrade dependencies opportunistically. Do not remove dependencies without verifying actual usage.

Framework/library versions are constraints, not opportunities for opportunistic modernization.

## 12. FRONTEND RULES

For frontend work:
- follow `DESIGN_SYSTEM.md`
- use the existing MUI theme
- preserve RTL
- preserve responsive behavior
- reuse shared components
- preserve accessibility
- handle relevant loading, empty, error, and real-time/disconnection states
- use `ai/COMPONENT_REGISTRY.md` before creating durable reusable components

Do not introduce another generic UI framework. Do not create feature-local copies of existing shared components. Do not hard-code visual tokens when an existing theme token can be used.

## 13. UI LIBRARY POLICY

MUI is the primary BaziGB application UI system.

Use MUI for layout, typography, buttons, dialogs, cards, forms, navigation, and common controls. MUI Icons are the preferred generic icon system.

### Lucide

`lucide-react` may be used when MUI Icons has no appropriate equivalent, or an existing BaziGB component already uses it. Do not mix MUI and Lucide icons arbitrarily within the same component family. When Lucide is repeatedly used, prefer a shared BaziGB wrapper/adapter for size, stroke width, color, and alignment.

### Specialized UI Libraries

A specialized library may be used for a specialized problem. Example: `react-chessboard` may be used for Chess Board rendering. A specialized library does not become the general BaziGB visual system.

The rule is:

> Specialized libraries provide capability. BaziGB provides visual identity.

## 14. GAME UI

Game interfaces are different from CRUD/admin interfaces. Prioritize:
1. game state visibility
2. player/turn clarity
3. legal interaction visibility
4. board readability
5. action feedback
6. secondary information

Do not turn a game screen into a collection of generic administrative cards. Do not modify game rules while implementing UI unless explicitly requested.

For a new game, first inspect the closest existing game and shared game infrastructure. Isolate game-specific logic/UI/assets from reusable platform infrastructure.

## 15. ASSET DISCIPLINE

For visual features and especially new games, follow `ai/ASSET_SYSTEM.md`.

Before requesting an asset:

1. search existing assets,
2. inspect the closest analogue,
3. determine whether the asset can be generated from existing primitives,
4. request human input only when genuinely required.

When human assets are required, provide one consolidated specification instead of repeatedly asking for individual files.

## 16. PERFORMANCE

Optimize based on evidence. Prefer localized state, efficient event handling, stable component boundaries, appropriate memoization, and cleanup of subscriptions/timers.

Do not mechanically add `React.memo`, `useMemo`, or `useCallback` to every component. Do not claim an FPS guarantee unless it has actually been measured.

## 17. ERROR PREVENTION

Before completing work, inspect for missing cleanup, unhandled promises, broken loading/error/empty states, RTL regressions, mobile overflow, accessibility regressions, stale imports, dead code, accidental dependency changes, and architecture-boundary violations.

Do not leave placeholder implementations in production code. Do not use TODO comments as a substitute for required implementation.

## 18. VALIDATION

Follow `ai/VALIDATION_GATE.md`.

After implementation, run the narrowest relevant validation first:
1. typecheck affected package
2. relevant unit tests
3. affected build
4. broader tests/build when appropriate
5. architecture/design/scope review

Never claim validation succeeded unless it actually ran. If validation cannot be performed, state exactly what was not verified and why.

Every relevant validation result must be classified as:

- PASS
- FAIL
- NOT RUN
- BLOCKED

## 19. ARCHITECTURE CHANGES

Changes to package boundaries, public package APIs, database strategy, authentication, authorization, real-time transport, deployment model, or major dependencies require explicit architectural consideration.

Before implementation, identify current architecture, why it is insufficient, affected modules, migration risk, compatibility concerns, testing requirements, and rollback considerations.

Do not perform architectural changes as incidental cleanup.

## 20. DOCUMENTATION DISCIPLINE

Documentation must explain durable knowledge and decisions. It must not duplicate the codebase unnecessarily.

Use:

```text
AI_CONTEXT_MAP.md → AI repository navigation and context routing
AGENTS.md         → AI behavior and engineering governance
DESIGN_SYSTEM.md  → visual/UI rules
ai/               → AI operational contracts and registries
README.md         → human-facing project overview and onboarding
docs/             → durable architecture, operations, strategy, and history
GitHub Issues / task backlog → active implementation work
```

Historical documents must not override current implementation.

If documentation conflicts with code:
1. detect the conflict
2. identify the current source
3. update/deprecate the outdated document
4. record an ADR if the conflict represents an important architectural decision

## 21. DOCUMENTATION BLOAT CONTROL

Before creating a new documentation file ask:
1. Does this information already have a canonical home?
2. Can an existing document be updated?
3. Is this information durable?
4. Is it useful to future maintainers?
5. Is it historical and better preserved as history?
6. Is it actually an implementation task?

Do not create documentation simply because a topic exists. Prefer one canonical source over multiple partially overlapping documents.

The AI operational documents in `ai/` are intentional: they define executable workflow contracts, reusable registries, asset handoff rules, and validation gates. Do not create overlapping documents for those responsibilities.

## 22. ARCHITECTURAL DECISIONS

Create ADRs only when a decision meaningfully affects future development. Do not create ADRs for bug fixes, typo fixes, normal UI changes, routine refactors, or routine dependency updates.

Use `docs/decisions/NNN-short-title.md`.

An ADR explains Context, Decision, Alternatives, Consequences, Validation, and Related work.

ADR = WHY
Architecture documentation = WHAT
AGENTS = HOW AI behaves
AI operational docs = HOW AI navigates, executes, inventories, and validates

Do not mix these responsibilities.

## 23. HANDOFF PROTOCOL

At the beginning of a new AI session:
1. Read `AI_CONTEXT_MAP.md`.
2. Read `AGENTS.md`.
3. Read `DESIGN_SYSTEM.md` for frontend tasks.
4. Inspect root/package manifests only as relevant to the task.
5. Inspect relevant source files and the closest analogue.
6. Read only documentation routed by `AI_CONTEXT_MAP.md`.
7. Determine CURRENT / TARGET / DEBT / UNKNOWN.

At the end of a task report:
- **Implemented / Changed** — files and changes
- **Reused** — existing systems/components reused
- **Created** — genuinely new abstractions
- **Assets Required** — consolidated human inputs
- **Validation** — checks actually performed
- **Risks / Limitations** — anything not verified
- **Human Input Required** — only genuine decisions/blockers

Do not generate generic handoff documents after every task.

## 24. ABSOLUTE RULE

> Route context before reading broadly.
>
> Inspect before implementing.
>
> Reuse before creating.
>
> Plan before changing.
>
> Validate before claiming.
>
> Ask humans only when human judgment or missing input is genuinely required.
>
> Never invent project facts.
