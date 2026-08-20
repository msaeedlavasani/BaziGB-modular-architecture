# BaziGB — Validation Gate

**Version:** 1.0.0

## 1. Definition of Done

Writing code is not completion.

A task is complete only when relevant implementation and validation gates have been performed.

## 2. Gate Order

Run the narrowest relevant checks first:

1. typecheck affected package
2. relevant unit/integration tests
3. affected build
4. broader checks when justified
5. design/architecture review
6. scope review

## 3. Type Safety

Run the repository's established TypeScript/typecheck command for the affected package.

Do not claim success unless the command actually ran.

## 4. Tests

Run tests relevant to the changed feature.

Prefer targeted tests before broad suites.

If no relevant tests exist, report that explicitly.

## 5. Build

Run the affected application/package build when appropriate.

If a build cannot be run because of an external/environmental blocker, report the exact blocker.

## 6. Architecture Review

Check:

- package boundaries
- dependency direction
- public APIs
- accidental circular dependencies
- game/application separation
- server authority for multiplayer rules
- unnecessary new dependencies

## 7. Design Review

For frontend work check:

- existing theme tokens
- MUI discipline
- RTL
- responsive behavior
- 360px minimum support where applicable
- loading states
- empty states
- error states
- real-time/disconnection states where applicable
- accessibility
- focus states
- reduced motion where applicable
- no duplicate visual patterns

## 8. Scope Review

Confirm:

- no unrelated files changed
- no framework versions changed without authorization
- no dependency changes were introduced unnecessarily
- no unrelated redesign occurred
- no temporary placeholder was left in production code

## 9. Validation Status

Every final report must classify each relevant check as:

- PASS — actually executed and passed
- FAIL — executed and failed
- NOT RUN — not executed
- BLOCKED — could not execute; reason stated

Never use vague language such as "looks good" as a substitute for validation.

## 10. Final Validation Report

Return:

```text
Validation
- Typecheck: PASS/FAIL/NOT RUN/BLOCKED
- Tests: PASS/FAIL/NOT RUN/BLOCKED
- Build: PASS/FAIL/NOT RUN/BLOCKED
- Architecture: PASS/FAIL/NOT RUN/BLOCKED
- Design: PASS/FAIL/NOT RUN/BLOCKED
- Scope: PASS/FAIL/NOT RUN/BLOCKED
```
