# BaziGB AI Context Map

**Version:** 2.0.0

**Role:** Mandatory task-routing map for AI agents.

## Entry route

Every task begins with `AGENTS.md` and this file from the active branch. Then read only the canonical sources required by the route.

The lifecycle is:

`DIRECT → ROUTE → DISCOVER → CLASSIFY → PLAN → APPROVE WHEN REQUIRED → IMPLEMENT → EVALUATE → RECORD → LEARN`

## Canonical routes

| Task | Required sources | Primary evidence |
| --- | --- | --- |
| AIPDE or Governance | `docs/aipde/system-governance.md`, `ai/CONTROL_PLANE.md`, `ai/SYSTEM_INTEGRATION.md` | Governance Check and Pilot |
| Product discovery or strategy | `docs/aipde/system-governance.md`, current product strategy | research evidence, assumptions, outcome decision |
| Frontend or responsive UI | `DESIGN_SYSTEM.md`, `ai/CONTROL_PLANE.md`, relevant component and closest analogue | design-system contract, rendered risk-based evaluation |
| Reusable component or pattern | `DESIGN_SYSTEM.md`, relevant shared components and consumers | contribution contract and conformance evidence |
| Backend, API, or data | `AGENTS.md`, relevant architecture and manifests | contract, authorization, validation, tests |
| Multiplayer or game protocol | `AGENTS.md`, engine and server contracts | server authority, adversarial protocol tests |
| Security or privacy | security policy when present, latest registered security report, relevant threat model | validated source-to-sink evidence and regression test |
| Validation only | `ai/VALIDATION_GATE.md` | executed evidence with PASS, FAIL, NOT RUN, or BLOCKED |
| Delivery or operations | canonical deployment and recovery documentation | release, rollback, monitoring, and recovery evidence |
| Important report | `docs/reports/README.md` | registered immutable report with provenance |

## Classification before action

Record internally or explicitly as the risk requires:

- lifecycle stage
- affected AIPDE capabilities
- current state and target state
- root system layer
- Routine, Material, or Critical decision class
- Standard, Elevated, or Intensive resource class
- required human approval
- expected evidence and learning destination

## Context budget

Use minimum sufficient context. Expand inspection only when dependency, risk, uncertainty, or failed evidence requires it.

Broad scans, multiple independent agents, repeated viewport matrices, large external research, and exhaustive validation are not default. Route them through the Resource Approval Request when they cross into Elevated or Intensive work.

## Conflict handling

Current explicit human direction controls permission and intent. Repository code controls current technical facts. Canonical domain documents control established contracts. Historical handoffs cannot override newer approval boundaries.

Report conflicts instead of silently resolving them.
