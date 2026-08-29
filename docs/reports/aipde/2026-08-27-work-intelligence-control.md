# Work Intelligence Control Implementation

Date: 2026-08-27
Status: Implemented and machine validated; live usage observation begins with the next task

## Decision

AIPDE now separates active operational state from historical evidence. Work is grouped by portfolio, domain, workstream and milestone; every task retains lifecycle, evidence, cost, gate, receiver and learning metadata. Historical reports remain immutable but are excluded from default retrieval.

## Controls delivered

- `ai/WORK_MANAGEMENT.md`: portfolio, priority, lifecycle, reporting, retrieval, supersession and cost policy.
- `ai/work-registry-v1.json`: canonical active work state, including completed, pending, deferred, reopened and security work.
- `ai/current-state.json`: bounded session-resume state.
- `ai/retrieval-manifest-v1.json`: task-specific progressive retrieval with history excluded by default.
- Updated entry, context, Control Plane, Validation Gate and Governance contracts.
- Governance checker coverage for required files, task fields, categories, lifecycle states, resource approvals, Current State references and retrieval routes.
- Fail-closed fixtures for missing controls, missing capability, unknown Current State task and unbounded historical retrieval.

## Supersession behavior

HANDOFF, progress narratives and audit reports no longer determine active backlog state. They remain evidence and provenance. Agents must resolve current priority and lifecycle through the Work Registry and open linked history only for provenance, recurrence, conflict or explicit audit requests.

## Resource boundary

The approved scope was medium, estimated at 5% to 8% of the user's five-hour usage window. No product code, browser acceptance, build, deployment, commit, push or merge was part of this implementation. Exact token attribution is unavailable and must not be inferred as measured usage.

## Validation

- JSON parse: PASS for Current State, Work Registry and Retrieval Manifest.
- Governance Check: PASS.
- Governance fail-closed fixture suite: PASS.
- Diff whitespace check: PASS.
- Live retrieval-cost reduction: NOT YET OBSERVED; evaluate over subsequent tasks.

## Limitation

This control makes work state and retrieval enforceable but cannot guarantee perfect prioritization by itself. Priorities must change when evidence, human direction, risk or dependencies change. The registry is deliberately concise enough for routine retrieval and must not become a narrative report store.
