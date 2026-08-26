# AIPDE System Governance

**Status:** Target governance contract

**Category:** AI-Native Product Lifecycle Ecosystem

This document is the canonical operating contract for evolving the product-delivery system itself. It governs how product work is discovered, designed, built, evaluated, delivered, operated, learned from, and documented. It does not replace product architecture, the design system, or engineering instructions.

## System DNA

AIPDE is human-directed, AI-orchestrated, evidence-driven, lifecycle-complete, self-observing, self-correcting, version-controlled, transferable, and cost-aware.

The system optimizes for durable product capability rather than rapid local output. It fixes a missing shared rule before repeatedly patching symptoms produced by that missing rule.

Human judgment owns intent, values, risk appetite, budget, irreversible decisions, and final approval. AI owns bounded investigation, synthesis, proposal generation, implementation within approved scope, verification, traceability, and learning capture.

## Capability architecture

The system must preserve all of these capabilities:

- Human Direction
- AI Orchestration
- Product Discovery
- Research and Strategy
- Product Design
- Design System
- Engineering
- Security and Privacy
- Evaluation and Quality
- Delivery and Operations
- Governance and Versioning
- Cost and Resource Governance
- Knowledge Management
- Continuous Learning

These are capabilities, not necessarily permanent human job titles. A capability may be fulfilled by a human, an AI agent, an automated control, or a collaboration between them. It may be removed from the human team only after its responsibilities, evidence, escalation rules, and quality gates have been implemented and tested.

## Lifecycle

The lifecycle is:

`Discovery → Research → Strategy → Design → Engineering → Validation → Delivery → Operations → Evolution`

Work may iterate backward when evidence invalidates an assumption. It must not silently skip a stage whose risks apply.

Each stage requires a contract containing purpose, accountable capability, inputs, outputs, evidence, entry criteria, exit criteria, human approval level, cost class, and learning destination.

## Decision classes

### Routine

Low-risk, reversible work using established patterns and normal validation. It may proceed inside an already approved scope.

### Material

Work that changes a shared pattern, user journey, data contract, security control, operating process, or recurring cost. It requires a written plan and explicit human approval.

### Critical

Irreversible or externally consequential work involving production, destructive data operations, privacy, money, credentials, legal commitments, major architecture, or substantial resource consumption. It requires explicit approval immediately before execution and a rollback or recovery plan.

## System-first correction rule

When a defect is found, classify its origin before patching it:

- isolated implementation defect
- missing reusable component or pattern
- incomplete design-system contract
- missing architecture or protocol invariant
- missing evaluation or test
- missing workflow gate
- missing ownership or escalation rule
- documentation or source-of-truth drift

If the defect can recur because a shared control is missing, the shared control and its test are the primary task. The visible instance becomes a validation case for that control. Local patches are secondary unless user harm requires an immediate containment fix.

## Evidence and evaluation

No capability is considered automated merely because an AI can describe or perform it once. Automation requires a repeatable input contract, bounded authority, observable output, acceptance criteria, failure handling, regression test, and evidence record.

Evaluation must cover product value, usability and accessibility, design-system conformance, functional correctness, protocol integrity, security and privacy, reliability and recovery, performance, localization, operational readiness, and documentation freshness when relevant.

Screenshot feedback is evidence, not the responsive-design method. Responsive behavior must be expressed through reusable layout and component contracts, tested against a defined viewport and content matrix, and supplemented by visual review rather than created through screenshot-by-screenshot tuning.

## Token and resource governance

Token minimization is not an absolute objective. The objective is the lowest responsible cost for the decision's risk and value.

The AI must choose the least expensive method that can produce adequate confidence. It must not spend substantially more tokens merely to create the appearance of certainty, and it must not under-investigate a material risk to save tokens.

Before using a materially more expensive method, the AI must present a Resource Approval Request containing:

- the decision or uncertainty being addressed
- why the normal method is insufficient
- the proposed higher-cost method
- expected confidence or risk reduction
- cheaper alternatives and their limitations
- approximate cost class and expected duration
- the stopping condition and output artifact

The AI must wait for explicit human approval before proceeding.

Cost classes are relative and do not promise exact token counts:

- Standard: focused repository inspection and one validation path; covered by ordinary task approval
- Elevated: broad cross-layer audit, multiple independent agents, large artifact processing, or repeated visual/runtime matrices; separate resource approval required
- Intensive: deep multi-pass scans, exhaustive independent replication, large-scale research, or long-running evaluation; separate resource approval and a hard stopping condition required

Escalation is required when expected usage moves above Standard, when repeated attempts have diminishing returns, or when a new method would materially increase compute, runtime, network, storage, or paid-service use.

Approval is not required for a small amount of extra reasoning needed to safely finish an already approved Standard task. The AI must use judgment based on risk, reversibility, and expected value.

## Documentation and resilience

Durable knowledge uses three independent layers:

### Working layer

The local Repository contains current source, canonical documents, reports, and uncommitted work. This layer is fast but is not a backup.

### History layer

Git commits preserve reviewed versions, authorship, diffs, tags, and rollback points. A file is not protected by Git merely because it is inside the Repository; it must be committed.

### Off-device layer

A pushed Git remote or another independently managed backup preserves committed history outside the laptop. GitHub is the current configured remote, but successful push and remote integrity must be verified. Sensitive secrets and recoverable operational data require a separate encrypted backup policy and must not be stored in Git.

Important reports are registered under `docs/reports/README.md`. Canonical rules live in their domain document. Architectural decisions use ADRs. Active implementation work belongs in the task backlog. Generated chat text and temporary tool folders are never canonical records.

No report may claim remote protection until its commit is confirmed on the remote. No backup may be called healthy until a restore or retrieval check has succeeded.

## Human gates

Human approval is required for product intent, prioritization, shared-system architecture, material design-system changes, security remediation scope, data or protocol changes, dependencies, deployment, destructive actions, external publication, and Elevated or Intensive resource use.

The approval request must identify the exact scope, alternatives, risk, validation, rollback where applicable, resource class, and what remains outside scope.

## Learning loop

Every significant failure or correction must answer:

- Which system control should have prevented or detected this?
- Was the control missing, ambiguous, bypassed, or untested?
- What reusable rule, artifact, test, or gate changes?
- How will recurrence be detected automatically?
- Which earlier document or assumption is now superseded?

Learning is complete only when the relevant canonical source and evaluation mechanism are updated. Adding another prose rule without an executable or reviewable check is incomplete when such a check is feasible.

## Definition of a healthy system

AIPDE is healthy when important work can move from intent to operation with traceable decisions, explicit authority, reusable product and engineering patterns, proportional evaluation, known cost, recoverable artifacts, and feedback that changes the system rather than merely accumulating notes.
