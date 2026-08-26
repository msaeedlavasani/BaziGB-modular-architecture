# AIPDE Control Plane Pilot

## Record

- Date: 2026-08-26
- Status: passed as a dry-run contract; product execution not authorized
- Control Plane version: 1.0.0
- Pilot fixture: `ai/pilots/control-plane-v1.json`

## Input

A newly created game page has inconsistent spacing and poor landscape behavior.

## Result

The request routed to Product Design, Design System, Engineering, Evaluation and Quality, Governance and Versioning, and Continuous Learning.

The root decision is to inspect the shared design-system or conformance control before changing page-specific breakpoints. A missing shared contract is a Material system change and stops at a human approval gate. Reuse of an existing Stable contract remains Routine.

The initial resource class is Standard. A broad visual matrix is not automatic. If targeted evidence remains inconclusive and a broad multi-page matrix becomes justified, the work escalates through a Resource Approval Request.

Required evidence includes a shared contract or conformance result, responsive/content/accessibility requirements, targeted rendered evidence proportional to risk, and a regression fixture.

The learning destination is the canonical design-system contract and its evaluation. The visible page is an acceptance case, not the source of a permanent local geometry rule.

## Automated enforcement

`scripts/check-governance.mjs` validates the Pilot's required capabilities, decision class, resource class, first action, approval gate, forbidden symptom-first action, and regression evidence.

`scripts/check-governance.test.mjs` verifies that a valid Control Plane fixture passes and a fixture missing a mandatory Validation Gate fails closed.

## Limitation

This Pilot proves routing and gate structure. It does not yet prove the behavior of an AI across a complete live product task. That requires the later approved product-lifecycle Pilot.
