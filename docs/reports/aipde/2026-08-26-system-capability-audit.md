# AIPDE System Capability Audit

## Record

- Date: 2026-08-26
- Scope: lifecycle, governance, evaluation, operations, documentation, and resource use
- Method: repository-grounded static audit
- Product-code changes: none
- Status: analysis complete; target governance drafted; implementation not approved

## Executive conclusion

The current system has a comparatively mature engineering brain and an increasingly explicit design-system brain. It does not yet have a complete product-lifecycle operating system.

The main failure mode is not lack of intelligence or effort. It is uneven control coverage. Engineering and visible interface work have explicit rules, while discovery, product strategy, design operations, security ownership, privacy, reliability, release operations, cost governance, knowledge resilience, and continuous learning have partial or implicit processes. Work therefore gravitates toward what is easiest to observe and immediately validate, especially screenshots and local implementation defects.

The next Task List must begin with system-enablement work. Current UI and security findings should serve as acceptance cases, not as the organizing structure of the plan.

## Evidence found

The Repository contains strong engineering constraints in `AGENTS.md`, an evolving visual contract in `DESIGN_SYSTEM.md`, modular package boundaries, build and type-check scripts, a boundary checker, a partial impact checker, implementation ledgers, handoff documentation, and a branch workflow for selected web checks.

The Repository does not currently contain a canonical AIPDE lifecycle contract, a complete capability ownership map, a product discovery evidence model, a research-quality policy, a strategy decision framework, a cross-layer evaluation architecture, a privacy program, an operational service model, a release and rollback policy, observability objectives, a tested restore program, a cost and token approval policy, or a durable three-layer knowledge-resilience policy.

The security audit found eight concrete defects and two runtime follow-ups. Their common causes include missing shared authorization policy, incomplete protocol invariants, insufficient abuse controls, deployment-source drift, and untested recovery. This supports a system-first response.

## Capability assessment

| Capability | Current maturity | Evidence | Primary gap |
| --- | --- | --- | --- |
| Human Direction | Partial | approval rules exist in engineering governance and handoff | no unified decision-rights and approval matrix across the lifecycle |
| AI Orchestration | Partial | inspect, plan, execute, validate, and handoff rules exist | no routing policy by risk, confidence, specialty, and resource class |
| Product Discovery | Missing | isolated product decisions appear in conversations and strategy documents | no opportunity framing, evidence repository, assumption ledger, or outcome definition |
| Research and Strategy | Partial | monetization strategy and audits exist | no research-quality tiers, source policy, synthesis contract, or strategy review gate |
| Product Design | Partial | visual rules and screenshot review exist | no canonical flow, hierarchy, content, interaction, accessibility, and prototype deliverables |
| Design System | Developing | tokens, shared components, responsive rules, and catalog metadata exist | no formal contribution lifecycle, component maturity states, visual regression suite, or release notes |
| Engineering | Strong but incomplete | modular boundaries, authority rules, builds, type checks, and package tests | impact analysis is incomplete; web tests and broad protocol tests are absent |
| Security and Privacy | Weak | one validated audit and several guards exist | no SECURITY policy, threat-model lifecycle, privacy inventory, remediation SLA, or security regression gate |
| Evaluation and Quality | Weak | builds, type checks, game tests, manual viewport checks | no unified quality model, web test suite, visual regression, accessibility automation, or evidence registry |
| Delivery and Operations | Weak | deployment and backup scripts exist | canonical deployment is ambiguous; no release gate, rollback proof, SLO, monitoring, incident process, or restore drill |
| Governance and Versioning | Partial | Git, source precedence, ADR guidance, and ledgers exist | cross-domain versioning and document state are not enforced; important reports were previously temporary |
| Cost and Resource Governance | Missing | none found | no token, compute, paid-service, runtime, or storage approval policy |
| Knowledge Management | Weak | docs and handoffs exist | no report registry until this task, no archival/supersession workflow, and no verified off-device guarantee |
| Continuous Learning | Weak | bugs and debt are recorded | no root-control analysis, recurrence metric, system experiment, or closed learning loop |

## Missing enterprise responsibilities

The system must explicitly preserve the work normally owned by product leadership, product operations, user research, product analytics, content design, accessibility, design operations, design-system stewardship, architecture, application security, privacy, quality engineering, release engineering, site reliability, incident management, database and backup ownership, FinOps, documentation and knowledge management, and change governance.

This does not mean creating one AI persona per human title. It means preserving every responsibility as a capability contract with evidence and escalation. Role simulation without delivery contracts creates ceremony; deleting roles before encoding their work creates blind spots.

## Root causes of the recent UI loop

The responsive and consistency problems were handled too close to the rendered symptom. The system lacked a complete contribution path from new product pattern to design-system primitive, responsive contract, reference implementation, automated conformance check, and regression evidence.

The design system improved during the work, but its changes were reactive. It had no formal intake state, component maturity model, required test matrix, or release process. As a result, human screenshot review became the integration test.

The correct correction is not more breakpoint instructions. It is a governed design-system lifecycle plus automated layout, visual, accessibility, localization, and content-stress evaluation.

## Required system architecture before product backlog execution

### Work intake and classification

Every request must be classified by lifecycle stage, risk, affected capabilities, reversibility, evidence need, human gate, and resource class. A UI symptom must be traced to its likely system layer before implementation priority is assigned.

### Capability contracts

Every AIPDE capability needs inputs, outputs, accountable owner, AI authority, human authority, evidence requirements, escalation conditions, and exit criteria.

### Design-system evolution protocol

New patterns move through proposal, evidence, specification, reference implementation, responsive and accessibility contract, test fixture, review, release, adoption, and deprecation. Components receive maturity states so experimental work cannot silently become canonical.

### Evaluation architecture

Evaluation must be layered: static contracts, unit and protocol tests, component examples, visual regression, accessibility, localization and content stress, responsive matrices, integration flows, performance, security, release checks, and operational signals. Evidence is stored by run and linked to the decision it supports.

### Security and privacy lifecycle

Define security policy, threat-model triggers, identity and authorization invariants, abuse controls, dependency policy, secret handling, privacy data inventory, finding severity and SLA, regression requirements, and release blockers.

### Delivery and operational control

Choose and document the canonical deployment path. Define environments, release evidence, approval, rollback, monitoring, SLOs, alerts, incident handling, backup tiers, restore drills, and continuity when international Internet access is unavailable.

### Resource governance

Use the Resource Approval Request defined in `docs/aipde/system-governance.md`. Confidence must be proportional to risk, not maximized without regard to cost. Elevated and Intensive methods require separate approval.

### Knowledge resilience

Canonical documents remain local for active work, committed in Git for history, and pushed or independently backed up for off-device resilience. A registry tracks important reports. Restore and retrieval are tested rather than assumed.

### Continuous learning

Every repeated defect produces a root-control analysis. The learning output is a changed system contract and an evaluation that would catch recurrence. Metrics should distinguish symptom fixes from systemic closures.

## Readiness gates for the eventual Task List

The Task List should not be considered ready until these questions are answered:

- What is the canonical AIPDE capability map and source of truth?
- Which capability owns each lifecycle transition and risk?
- Which decisions require human approval?
- Which outputs are mandatory before the next stage begins?
- Which checks are automated, reviewed by AI, or reviewed by a human?
- What evidence proves a shared system change works?
- How are design-system contributions versioned, tested, and released?
- What is the canonical deployment and recovery model?
- Where are security and privacy requirements enforced?
- What resource class applies, and is additional approval required?
- Where is durable knowledge stored locally, in Git history, and off-device?
- How does a production or evaluation signal update the system?

## Recommended prioritization model

The future backlog should be ordered by system leverage, risk reduction, dependency, evidence gap, and user impact. Screenshot recency and implementation convenience must not determine priority.

The first scope should establish governance and evaluation foundations that prevent repeated work. The second should encode the highest-risk shared controls. The third should run a pilot through the full lifecycle. Only after the pilot passes should the remaining product findings be expanded into implementation waves.

## Proposed next approval boundary

The next approval should cover designing the executable AIPDE blueprint and its tests. It should not yet authorize product remediation, security fixes, deployment changes, new dependencies, or a broad UI rewrite.
