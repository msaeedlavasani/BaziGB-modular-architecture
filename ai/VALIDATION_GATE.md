# AIPDE Validation Gate

**Version:** 3.0.0

## Evidence rule

Validation is proportional to risk and must test the controlling contract, not merely the visible symptom. Every reported result is PASS, FAIL, NOT RUN, or BLOCKED.

## Gate selection

Routine work uses the narrowest relevant static check, test, or build.

Material work adds evaluation for the shared contract, affected integration, regression risk, and human decision criteria.

Critical work requires recovery or rollback evidence and explicit release authority in addition to technical checks.

## Product and engineering evidence

Choose the relevant subset of type safety, unit tests, protocol or integration tests, affected build, architecture boundaries, security and privacy controls, accessibility, localization, responsive and content stress, visual regression, performance, release checks, monitoring, and recovery.

A build does not prove visual correctness. A screenshot does not prove responsive correctness. Static inspection does not prove runtime behavior. No single check is promoted beyond the evidence it actually provides.

## Control Plane evidence

A Governance change requires:

- `npm run check:governance`
- source-priority and routing review
- approval and resource-gate review
- report-registry and provenance review
- the Pilot defined in `ai/CONTROL_PLANE.md` for material changes
- scope review proving that product code and unauthorized release states were not changed
- valid Current State, Work Registry, Retrieval Manifest, lifecycle states, portfolio categories, evidence links, and resource gates
- a fail-closed fixture proving broken active-state or retrieval controls are rejected

## Rendered evaluation

Use rendered inspection when risk is high, when the human requests it, or when a specific ambiguity cannot be resolved through established contracts and targeted checks.

Do not use screenshot exchange as the design-system construction method. Store durable visual evidence outside chat when it materially supports a decision.

## Release states

`IMPLEMENTED → MACHINE VALIDATED → HUMAN ACCEPTED → COMMITTED → PUSHED → BACKED UP → STAGED → DEPLOY APPROVED → DEPLOYED → PRODUCTION VERIFIED → OBSERVED`

Each transition requires its own evidence and authority. Never collapse them in reporting.

The canonical release, database, backup, rollback, and credential authority rules are defined in `docs/release-and-secrets-contract.md`. Contract acceptance does not authorize implementation, production access, reading secret values, backup execution, migration, rotation, or deployment.

## Next.js validation isolation

When a Web Dev Server is active in the same checkout, use `npm run build:verify -w @bazigb/web`. It writes to `.next-verify` and must be preferred over a normal Web build for validation. A normal `next build` and `next dev` share `.next` and may corrupt the running server. This is an executable prevention control, not merely a handoff warning.
