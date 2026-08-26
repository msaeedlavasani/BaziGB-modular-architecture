# AIPDE Validation Gate

**Version:** 2.0.0

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

## Rendered evaluation

Use rendered inspection when risk is high, when the human requests it, or when a specific ambiguity cannot be resolved through established contracts and targeted checks.

Do not use screenshot exchange as the design-system construction method. Store durable visual evidence outside chat when it materially supports a decision.

## Release states

`IMPLEMENTED → VALIDATED → COMMITTED → PUSHED → MERGED → DEPLOYED → PRODUCTION VERIFIED`

Each transition requires its own evidence and authority. Never collapse them in reporting.
