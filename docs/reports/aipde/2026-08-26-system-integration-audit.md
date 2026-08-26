# AIPDE System Integration Audit

## Record

- Date: 2026-08-26
- Scope: full lifecycle integration, capability accountability, handoffs, gates, evidence, and learning
- Source revision: `044ade5acc7507aa64361871da6cb839d8256c43` plus the documented working-tree changes
- Resource class: Standard
- Product-code changes: none
- Status: integration contract implemented and structurally validated; domain maturity and live pilots remain
- Supersedes: the readiness-gap portion of `2026-08-26-system-capability-audit.md`; that report remains the baseline maturity evidence

## Decision

AIPDE will use a hybrid development model:

1. integrate the complete lifecycle at the level of authority, contracts, handoffs, evidence, and gates;
2. mature individual domains through bounded end-to-end pilots;
3. expand product remediation only after the controlling domain pilot passes.

This prevents two opposite failures: disconnected domain work when implementation begins too early, and speculative over-engineering when every domain is designed in full before real use.

## Evidence and gaps found

The existing Governance and Control Plane already defined system DNA, lifecycle stages, decision classes, resource approval, source precedence, documentation states, and a UI-root-control pilot. They did not yet provide an executable answer to four integration questions:

- which capability is accountable for every lifecycle stage,
- what each capability must receive and deliver,
- what evidence and authority permit a handoff,
- how a non-UI concern crosses the entire lifecycle into operations and learning.

This allowed the system to name enterprise capabilities without proving that work could move coherently between them. The risk was a collection of capable but disconnected “brains.”

## Controls implemented

`ai/SYSTEM_INTEGRATION.md` now defines the shared operational spine, authority separation, lifecycle ownership, handoff rejection, cross-cutting triggers, failure closure, and structural readiness.

`ai/system-integration-v1.json` now registers all 14 mandatory capabilities with purpose, inputs, outputs, evidence, AI authority, human authority, escalation conditions, and lifecycle participation.

The registry also defines all nine lifecycle stages with one accountable capability, required input, output, evidence, human gate, receiver, and rejection condition.

A non-UI integration fixture follows a multiplayer protocol defect from discovery through production operations and evolution. It requires Security and Privacy, release authority, recovery evidence, and a protocol learning destination; therefore UI can no longer be the only executable proof of orchestration.

The Governance Check validates this structure and fails closed when a capability, stage owner, handoff field, reserved human authority, or integration-fixture requirement is removed.

## Current maturity after integration

| Layer | State after this scope | Remaining proof |
| --- | --- | --- |
| Lifecycle spine | Structurally integrated | live end-to-end pilot |
| Capability accountability | Contracted for all mandatory capabilities | domain-specific execution evidence |
| Human and AI authority | Explicitly separated | observation across real Material tasks |
| Handoffs | Minimum acceptance and rejection fields enforced | artifact templates only where pilots prove useful |
| Evaluation | Cross-lifecycle responsibility connected | quality architecture and domain test suites |
| Security and Privacy | Connected as a cross-cutting control | policy, threat-model triggers, remediation lifecycle |
| Delivery and Operations | Connected to release, rollback, monitoring, and learning | canonical deployment, SLO, incident, and restore evidence |
| Cost governance | Connected to every stage | measured usage baselines where decision value justifies them |
| Knowledge resilience | Connected to provenance and retrieval | backup policy and restore drill |
| Continuous Learning | Closure contract established | recurrence metrics and live system changes |

## Prioritized execution roadmap

### Wave 1 — prove the system spine

Run one bounded live pilot from an existing product need through classification, design or architecture contract, implementation, validation, evidence registration, and learning. Design System is the recommended first pilot because current uncommitted interface work supplies real acceptance cases, but it must exercise the whole Control Plane rather than become the system's center.

Exit condition: the pilot produces a traceable task envelope, accepted handoffs, an approved shared control, implementation evidence, a regression mechanism, and a recorded learning without screenshot-led micromanagement.

### Wave 2 — encode highest-risk shared controls

Develop Security and Privacy, Evaluation and Quality, and Delivery and Operations as three bounded domain pilots. Use the existing security findings, web quality gaps, and deployment ambiguity as acceptance cases.

Exit condition: each domain has a canonical policy or contract, automated or reviewable gates, ownership, escalation, and one validated live case.

### Wave 3 — make product decisions evidence-led

Develop Product Discovery and Research and Strategy contracts using a real product decision. Add only the assumption, evidence, outcome, and success-measure artifacts that the pilot demonstrates are necessary.

Exit condition: Engineering work can trace back to an approved problem and measurable outcome rather than chat order or implementation convenience.

### Wave 4 — operational resilience and transferability

Validate canonical deployment and rollback, observability, incident handling, backup tiers, offline continuity, restore retrieval, documentation supersession, and onboarding retrieval.

Exit condition: a new human or AI can recover the current system state, explain authority and release state, and resume safely from canonical sources.

## Priority rule

Within every wave, order work by system leverage, risk reduction, dependency, evidence gap, and user impact. Do not prioritize by screenshot recency, file convenience, or which capability is easiest for the current agent.

## Explicitly outside this scope

- product UI remediation
- security finding remediation
- protocol or gameplay changes
- dependency installation
- deployment or production action
- commit, push, merge, or publication
- Elevated or Intensive evaluation

## Validation

- `jq empty ai/system-integration-v1.json`: PASS
- `npm run check:governance`: PASS with nine required control files, four registered reports, and complete capability and lifecycle contracts
- `npm run test:governance`: PASS; the valid fixture was accepted and fixtures missing a mandatory Validation Gate or Security and Privacy capability were rejected
- clean-room Governance Check from committed `HEAD` plus only this scope's files: PASS
- `git diff --check`: PASS
- scope review: no product, gameplay, protocol, dependency, deployment, merge, or production files were changed by this scope

## Limitations

The validation proves structural integration and fail-closed governance checks. It does not prove that an AI will execute every contract correctly in live work, that domain controls are mature, or that deployment and recovery are currently safe. Those claims require the bounded pilots in the roadmap.

## Next human gate

The next proposed scope is Wave 1: a live Design System pilot using the existing responsive and component-consistency problems as acceptance cases. Approval of that pilot must name its bounded shared controls, affected product files, evaluation budget, and the uncommitted changes it may adopt or replace.
