# BaziGB — Validation Gate

**Version:** 1.2.0

## 1. Definition of Done

Writing code is not completion.

A task is complete only when the minimum sufficient validation gates for its scope and risk have been performed and reported truthfully.

Implementation completion, release completion, and production verification are different states.

## 2. Gate Order

Run the narrowest relevant checks first:

1. typecheck affected package
2. relevant unit/integration tests
3. affected build
4. architecture/scope review
5. rendered UI/browser validation when required by the risk classification below
6. deployment/release validation only when explicitly authorized
7. production verification only when explicitly authorized and applicable

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

A successful build does NOT prove UI correctness.

## 6. Architecture Review

Check:

- package boundaries
- dependency direction
- public APIs
- accidental circular dependencies
- game/application separation
- server authority for multiplayer rules
- unnecessary new dependencies

## 7. Risk Classification

Classify the change before selecting validation:

- **LOW** — localized change following an established pattern, with no meaningful responsive, interaction, state, or visual uncertainty. Use targeted source/design review and the narrowest relevant automated checks. Browser/UI validation is NOT RUN by default.
- **MEDIUM** — bounded UI/behavior change with a specific visual, responsive, or interaction uncertainty. Use targeted automated checks and, only when it materially resolves that uncertainty, one focused rendered check of the affected viewport/state.
- **HIGH** — a new or substantially changed page, game, game shell, complex interaction, broad responsive/layout change, release milestone, or change with unresolved visual risk. Rendered browser/UI validation is required when available.

The user may explicitly require browser/UI validation at any risk level. A genuine ambiguity that cannot be resolved cheaply from the design system, closest analogue, code, or targeted checks also escalates the relevant rendered check.

Do not open a browser, capture screenshots, or perform multi-viewport visual inspection merely because a frontend file changed.

## 8. Rendered UI / Browser Validation

When browser/UI validation is required, inspect the actual rendered interface, not only source code. Keep the inspection targeted to the identified risk.

When relevant to that risk, verify:

- mobile viewport around 360–430px
- representative desktop viewport
- RTL composition
- no accidental horizontal overflow
- hierarchy and spacing
- loading/empty/error states
- populated state when data is available
- focus/accessibility behavior where applicable
- no obvious regression in surrounding UI

### Evidence requirement

A UI validation status may be reported as PASS only if the agent actually rendered and inspected the UI.

The report must state:

- environment used
- viewport(s) inspected
- state(s) inspected
- what was observed

When available, retain or reference screenshots/artifacts as evidence.

If a required rendered inspection is unavailable, report:

`Browser/UI Validation: BLOCKED`

Do not substitute build success for browser validation.

If rendered inspection is not required by the risk classification, report:

`Browser/UI Validation: NOT RUN — not required for <LOW/MEDIUM> risk; <brief reason>`

## 9. Design Review

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
- integration with surrounding product UI

## 10. Scope Review

Confirm:

- no unrelated files changed
- no framework versions changed without authorization
- no dependency changes were introduced unnecessarily
- no unrelated redesign occurred
- no temporary placeholder was left in production code

## 11. Change / Release Authority

The following actions are separate operations and require explicit user authorization unless the user has already clearly authorized them in the current task:

- commit
- push
- merge
- deploy/release
- production data/schema migration
- destructive production operation

Implementation authorization does not automatically authorize commit, push, merge, or deployment.

`IMPLEMENTED` does not mean `COMMITTED`.
`COMMITTED` does not mean `PUSHED`.
`PUSHED` does not mean `MERGED`.
`MERGED` does not mean `DEPLOYED`.
`DEPLOYED` does not mean `PRODUCTION VERIFIED`.

Never silently promote changes to `main` or production.

## 12. Release Validation

When deployment is explicitly authorized:

1. confirm the exact release target,
2. validate the build/artifact,
3. deploy using the established repository/process,
4. perform health checks,
5. verify the intended production behavior when possible,
6. report the deployed revision/commit when available.

Production verification must not be claimed solely because a deployment command succeeded.

## 13. Validation Status

Every final report must classify each relevant check as:

- PASS — actually executed/inspected and passed
- FAIL — executed/inspected and failed
- NOT RUN — intentionally not executed
- BLOCKED — could not execute; reason stated

Never use vague language such as "looks good" as a substitute for validation.

## 14. Final Validation Report

Return the relevant subset:

```text
Validation
- Risk: LOW/MEDIUM/HIGH — reason
- Typecheck: PASS/FAIL/NOT RUN/BLOCKED
- Tests: PASS/FAIL/NOT RUN/BLOCKED
- Build: PASS/FAIL/NOT RUN/BLOCKED
- Architecture: PASS/FAIL/NOT RUN/BLOCKED
- Browser/UI: PASS/FAIL/NOT RUN/BLOCKED
- Design: PASS/FAIL/NOT RUN/BLOCKED
- Scope: PASS/FAIL/NOT RUN/BLOCKED
- Commit: NOT RUN/PASS
- Push: NOT RUN/PASS
- Merge: NOT RUN/PASS
- Deployment: NOT RUN/PASS/FAIL/BLOCKED
- Production Verification: NOT RUN/PASS/FAIL/BLOCKED
```
