# AIPDE System Integration Contract

**Version:** 1.0.0

**Role:** Canonical operational spine connecting AIPDE capabilities, lifecycle stages, handoffs, gates, evidence, and learning.

The machine-readable companion is `ai/system-integration-v1.json`. This document explains the operating rules; the registry supplies the minimum structure enforced by the Governance Check.

## Integration rule

AIPDE uses one shared task envelope across the lifecycle. A capability may contribute without owning a lifecycle stage, but every active stage has exactly one accountable capability. Supporting capabilities challenge or enable the work; they do not dilute accountability.

Work advances only through an explicit transition:

`verified input → accountable work → bounded output → evidence → exit gate → accepted handoff`

If an applicable output, gate, or receiving capability is absent, the transition is BLOCKED. An AI may propose the missing control but may not silently invent approval, evidence, product intent, or operational readiness.

## Authority model

- Human Direction owns intent, values, priorities, risk appetite, budget, and approval of Material or Critical change.
- AI Orchestration owns routing, task-envelope completeness, capability coordination, and escalation within approved authority.
- Domain capabilities own the quality and evidence of their contracted outputs.
- Governance and Versioning owns traceability, decision state, source precedence, and release-state accuracy.
- Evaluation and Quality independently tests claims against the controlling contract.
- Cost and Resource Governance prevents both unjustified expenditure and unsafe under-investigation.
- Knowledge Management preserves retrievable canonical knowledge without duplicating active implementation state.
- Continuous Learning converts repeated failure or new evidence into a changed control and regression mechanism.

AI execution never turns advisory authority into approval authority. A generated artifact is not accepted merely because the same AI generated and reviewed it.

## Capability contract

Every capability registered in `ai/system-integration-v1.json` declares:

- purpose and durable responsibilities
- required inputs and bounded outputs
- evidence required for acceptance
- AI authority and reserved human authority
- escalation triggers
- lifecycle participation

Capabilities represent enterprise responsibilities, not simulated job titles. One agent may fulfill multiple capabilities when risk permits, but it must keep their outputs and gates distinguishable. Material or Critical self-review requires independent evidence or a human gate proportional to risk.

## Lifecycle ownership

| Stage | Accountable capability | Required outcome |
| --- | --- | --- |
| Discovery | Product Discovery | Evidence-backed problem or opportunity worth investigating |
| Research | Research and Strategy | Sourced findings, uncertainty, and tested assumptions |
| Strategy | Research and Strategy | Selected outcome, constraints, success measures, and explicit non-goals |
| Design | Product Design | Validated flow and interaction contract, including system contributions |
| Engineering | Engineering | Traceable implementation of approved contracts |
| Validation | Evaluation and Quality | Proportional evidence and an explicit PASS, FAIL, BLOCKED, or NOT RUN result |
| Delivery | Delivery and Operations | Approved, recoverable release candidate with deployment evidence |
| Operations | Delivery and Operations | Observed service behavior, incident response, and recovery evidence |
| Evolution | Continuous Learning | Evidence-driven change to a canonical control, backlog, or strategy |

Security and Privacy, Design System, Governance and Versioning, Cost and Resource Governance, Knowledge Management, Human Direction, and AI Orchestration are cross-cutting controls. They join any stage whose risk or output invokes their contract.

## Handoff protocol

Every handoff must identify:

1. the accepted upstream output and its source,
2. unresolved uncertainty and assumptions,
3. decision and resource class,
4. receiving capability and expected output,
5. applicable human gate,
6. evaluation required before the next transition,
7. learning destination if the work fails or produces a reusable insight.

The receiver rejects the handoff when the source is not authoritative, required evidence is absent, unresolved risk exceeds its authority, or the output has been mislabeled as a later release state.

## Cross-cutting control triggers

- Design System joins when work creates or changes a reusable visual, interaction, content, accessibility, or responsive pattern.
- Security and Privacy joins when identity, authorization, untrusted input, personal data, secrets, abuse, payments, protocols, dependencies, or production exposure are affected.
- Evaluation and Quality joins before a claim advances and defines evidence independently from implementation convenience.
- Delivery and Operations joins before environment, release, rollback, monitoring, backup, recovery, or incident behavior changes.
- Governance and Versioning joins for Material decisions, canonical sources, reports, commits, releases, supersession, and state claims.
- Cost and Resource Governance joins when analysis or execution may become Elevated or Intensive or introduce recurring paid cost.
- Knowledge Management joins when durable knowledge, an important report, retrieval, backup, onboarding, or transferability is involved.
- Continuous Learning joins after recurrence, failed validation, incident, meaningful user feedback, or a system experiment.

## Failure and learning loop

Failures are classified as local defects or missing shared controls. A repeated or structurally repeatable failure cannot close with a symptom patch alone.

Closure requires:

`contain if necessary → identify failed control → change canonical contract → add evaluation → validate acceptance case → record supersession or learning`

The loop is incomplete when it produces only prose, only a backlog item, or only a local fix despite a feasible shared control.

## Integration readiness

The system spine is structurally ready when:

- all mandatory capabilities have complete contracts,
- every lifecycle stage has one accountable owner,
- all stage transitions declare outputs, evidence, receiver, and rejection conditions,
- cross-cutting triggers are explicit,
- human and resource gates are preserved,
- a non-UI cross-lifecycle fixture passes the Governance Check,
- product execution remains separately approved.

Structural readiness does not mean every domain is mature. Domain maturity must be developed through bounded end-to-end pilots and measured evidence.
