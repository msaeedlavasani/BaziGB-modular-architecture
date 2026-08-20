# BaziGB — AI Engineering & Workflow Standard

**Version:** 5.0.0

This document defines how AI agents must inspect, reason about, plan, modify, validate, and document work in the BaziGB repository.

It is an engineering governance document. It is NOT a duplicate of the project's architecture, product strategy, or visual design documentation.

## 1. SOURCE OF TRUTH

When information conflicts, use this priority:

1. Actual repository code and configuration
2. `package.json` and workspace/package manifests
3. `AGENTS.md`
4. `DESIGN_SYSTEM.md`
5. Current architecture and operational documentation
6. Active task documentation
7. Historical reports, audits, handoffs, and migration documents
8. AI assumptions or general knowledge

Never invent project facts. If a required fact cannot be verified from the repository, explicitly state that it is unknown.

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

### PLAN MODE

PLAN MODE is the default for new features, multi-file changes, refactors, architectural changes, dependency changes, security changes, database changes, real-time architecture changes, and large UI changes.

Before implementation:
1. Inspect the repository.
2. Identify existing components, APIs, abstractions, and dependencies.
3. Identify affected modules.
4. Identify architecture risks.
5. Produce a concise implementation plan.
6. Wait for approval.

The plan should include User Intent, Repository Findings, Files/Modules Affected, Implementation Steps, Risks, and Validation.

### EXECUTE MODE

EXECUTE MODE is allowed when the user explicitly asks to implement, fix, apply, or proceed.

Even in EXECUTE MODE:
- Do not silently redesign architecture.
- Do not introduce unnecessary dependencies.
- Do not modify unrelated files.
- Do not perform broad rewrites for local problems.
- Do not change package boundaries without justification.

Stop and request approval if the requested change requires a new architectural decision that has not been established.

## 4. MINIMAL CHANGE PRINCIPLE

Prefer the smallest correct change over the largest possible cleanup.

Before creating a component, hook, utility, service, type, abstraction, or API, search for an existing equivalent.

Prefer:

```text
reuse → extend → compose → create
```

Do not create duplicate abstractions merely because an existing implementation is inconvenient. Do not refactor unrelated code during a feature or bug fix.

## 5. ARCHITECTURAL BOUNDARIES

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

## 6. SERVER AUTHORITY

For multiplayer gameplay, the server is authoritative.

The client must never be trusted to determine authoritative legal moves, turn ownership, win/loss conditions, score, random outcomes, or game-state transitions.

Client-side prediction or optimistic UI may exist only as presentation behavior and must reconcile against authoritative server state.

Never move game rules into React merely to simplify UI implementation.

## 7. REAL-TIME AND CONCURRENCY

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

## 8. TYPE SAFETY

Prefer strict TypeScript. Avoid `any`.

If `any` is technically unavoidable, keep the scope narrow, document why, and avoid propagating it.

Do not assume a dependency exists. Always inspect the relevant `package.json` before importing a library.

Do not introduce a second validation framework if an established validation mechanism already exists and is appropriate.

## 9. DEPENDENCY DISCIPLINE

Before adding a dependency:
1. Search for an existing solution.
2. Check whether the dependency already exists.
3. Check whether another package already provides the capability.
4. Evaluate bundle/runtime impact.
5. Evaluate architecture-boundary impact.
6. Explain why the dependency is necessary.

Do not upgrade dependencies opportunistically. Do not remove dependencies without verifying actual usage.

## 10. FRONTEND RULES

For frontend work:
- follow `DESIGN_SYSTEM.md`
- use the existing MUI theme
- preserve RTL
- preserve responsive behavior
- reuse shared components
- preserve accessibility
- handle relevant loading, empty, error, and real-time/disconnection states

Do not introduce another generic UI framework. Do not create feature-local copies of existing shared components. Do not hard-code visual tokens when an existing theme token can be used.

## 11. UI LIBRARY POLICY

MUI is the primary BaziGB application UI system.

Use MUI for layout, typography, buttons, dialogs, cards, forms, navigation, and common controls. MUI Icons are the preferred generic icon system.

### Lucide

`lucide-react` may be used when MUI Icons has no appropriate equivalent, or an existing BaziGB component already uses it. Do not mix MUI and Lucide icons arbitrarily within the same component family. When Lucide is repeatedly used, prefer a shared BaziGB wrapper/adapter for size, stroke width, color, and alignment.

### Specialized UI Libraries

A specialized library may be used for a specialized problem. Example: `react-chessboard` may be used for Chess Board rendering. A specialized library does not become the general BaziGB visual system.

The rule is:

> Specialized libraries provide capability. BaziGB provides visual identity.

## 12. GAME UI

Game interfaces are different from CRUD/admin interfaces. Prioritize:
1. game state visibility
2. player/turn clarity
3. legal interaction visibility
4. board readability
5. action feedback
6. secondary information

Do not turn a game screen into a collection of generic administrative cards. Do not modify game rules while implementing UI unless explicitly requested.

## 13. PERFORMANCE

Optimize based on evidence. Prefer localized state, efficient event handling, stable component boundaries, appropriate memoization, and cleanup of subscriptions/timers.

Do not mechanically add `React.memo`, `useMemo`, or `useCallback` to every component. Do not claim an FPS guarantee unless it has actually been measured.

## 14. ERROR PREVENTION

Before completing work, inspect for missing cleanup, unhandled promises, broken loading/error/empty states, RTL regressions, mobile overflow, accessibility regressions, stale imports, dead code, accidental dependency changes, and architecture-boundary violations.

Do not leave placeholder implementations in production code. Do not use TODO comments as a substitute for required implementation.

## 15. VALIDATION

After implementation, run the narrowest relevant validation first:
1. typecheck affected package
2. relevant unit tests
3. affected build
4. broader tests/build when appropriate

Never claim validation succeeded unless it actually ran. If validation cannot be performed, state exactly what was not verified and why.

## 16. ARCHITECTURE CHANGES

Changes to package boundaries, public package APIs, database strategy, authentication, authorization, real-time transport, deployment model, or major dependencies require explicit architectural consideration.

Before implementation, identify current architecture, why it is insufficient, affected modules, migration risk, compatibility concerns, testing requirements, and rollback considerations.

Do not perform architectural changes as incidental cleanup.

## 17. DOCUMENTATION DISCIPLINE

Documentation must explain durable knowledge and decisions. It must not duplicate the codebase unnecessarily.

Use:

```text
AGENTS.md       → AI behavior and engineering workflow
DESIGN_SYSTEM.md → visual/UI rules
README.md       → human-facing project overview and onboarding
docs/           → durable architecture, operations, strategy, and history
GitHub Issues / task backlog → active implementation work
```

Historical documents must not override current implementation.

If documentation conflicts with code:
1. detect the conflict
2. identify the current source
3. update/deprecate the outdated document
4. record an ADR if the conflict represents an important architectural decision

## 18. DOCUMENTATION BLOAT CONTROL

Before creating a new documentation file ask:
1. Does this information already have a canonical home?
2. Can an existing document be updated?
3. Is this information durable?
4. Is it useful to future maintainers?
5. Is it historical and better preserved as history?
6. Is it actually an implementation task?

Do not create documentation simply because a topic exists. Prefer one canonical source over multiple partially overlapping documents.

## 19. ARCHITECTURAL DECISIONS

Create ADRs only when a decision meaningfully affects future development. Do not create ADRs for bug fixes, typo fixes, normal UI changes, routine refactors, or routine dependency updates.

Use `docs/decisions/NNN-short-title.md`.

An ADR explains Context, Decision, Alternatives, Consequences, Validation, and Related work.

ADR = WHY
Architecture documentation = WHAT
AGENTS = HOW AI behaves

Do not mix these responsibilities.

## 20. HANDOFF PROTOCOL

At the beginning of a new AI session:
1. Read `AGENTS.md`.
2. Read `DESIGN_SYSTEM.md` for frontend tasks.
3. Inspect root/package manifests.
4. Inspect relevant source files.
5. Read only documentation relevant to the task.
6. Determine CURRENT / TARGET / DEBT / UNKNOWN.

At the end of a task report:
- **Changed** — files and changes
- **Validation** — checks actually performed
- **Risks / Limitations** — anything not verified
- **Follow-up** — only genuinely necessary work

Do not generate generic handoff documents after every task.

## 21. ABSOLUTE RULE

> Inspect first.
>
> Reuse before creating.
>
> Plan before changing.
>
> Verify before claiming.
>
> Never invent project facts.
