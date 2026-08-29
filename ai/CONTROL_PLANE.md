# AIPDE Control Plane

**Version:** 2.0.0

**Role:** Operational contract that turns AIPDE Governance into repeatable task behavior.

Lifecycle ownership, capability responsibilities, handoffs, and cross-cutting triggers are defined by `ai/SYSTEM_INTEGRATION.md` and its machine-readable registry. The Control Plane routes each task through that integration contract rather than treating capabilities as an unconnected checklist.

Portfolio grouping, active task state, reporting, retrieval, supersession, and percentage-based resource gates are defined by `ai/WORK_MANAGEMENT.md`. `ai/work-registry-v1.json` is the only active backlog; `ai/current-state.json` is the bounded resume source.

## Task envelope

Before material work, establish this envelope:

| Field | Required answer |
| --- | --- |
| Intent | What human or product outcome is being pursued? |
| Lifecycle | Which lifecycle stage is active? |
| Capabilities | Which AIPDE capabilities must contribute? |
| Evidence | What repository or research evidence grounds the decision? |
| Root layer | Is the issue local or produced by a missing shared control? |
| Decision class | Routine, Material, or Critical |
| Resource class | Standard, Elevated, or Intensive |
| Human gate | What must be approved, and when? |
| Output | What artifact, implementation, or decision will exist? |
| Evaluation | What proves the output is sufficient? |
| Learning | Which canonical rule, registry, test, or backlog receives the result? |
| Work identity | Which portfolio, workstream, milestone, and stable task id own this work? |
| Resource estimate | Low, medium, or high; what percentage band and stopping condition apply? |

## Lifecycle stage contract

Every active stage must have an accountable capability, verified inputs, a bounded output, exit criteria, evidence, and an escalation path.

Discovery defines the opportunity and user problem. Research establishes evidence quality and uncertainty. Strategy selects outcomes and constraints. Design defines flows, hierarchy, interaction, content, accessibility, and system contributions. Engineering implements approved contracts. Validation challenges the output proportionally to risk. Delivery controls release and rollback. Operations observes real behavior and recovery. Evolution changes the system from evidence.

Skipping an applicable stage requires an explicit rationale. Implementation convenience is not a rationale.

## Root-control analysis

Classify every significant defect as one of:

- isolated implementation defect
- missing reusable component or pattern
- incomplete design-system contract
- missing architecture or protocol invariant
- missing security or privacy control
- missing evaluation or regression test
- missing workflow gate or approval
- missing operational ownership or recovery control
- source-of-truth or documentation drift

When recurrence is possible, create the shared control and its evaluation first. Use the reported instance as the first acceptance fixture.

## Design-system contribution path

A new UI pattern becomes reusable through:

`need evidence → pattern proposal → responsibility and anatomy → tokens and variants → responsive/content/accessibility contract → reference implementation → component example → automated and rendered evaluation → maturity decision → registration → adoption → deprecation when needed`

Maturity states are Experimental, Candidate, Stable, and Deprecated. A component is not Stable merely because it exists in a shared directory.

New product work must consult the Stable system first. Missing capability creates a contribution proposal; it does not authorize page-local geometry rules as a permanent substitute.

## Approval matrix

Routine work is reversible, established, and bounded. Existing task approval is sufficient.

Material work changes shared behavior, product outcomes, architecture, design-system contracts, security, privacy, data, protocol, operations, or recurring cost. It requires an explicit plan and approval before implementation.

Critical work is irreversible or externally consequential. It requires target confirmation, approval immediately before execution, and rollback or recovery evidence.

Commit, push, merge, deploy, production migration, destructive operation, and external publication are distinct permissions.

## Resource Approval Request

Before Elevated or Intensive work, present:

- decision or uncertainty
- why Standard analysis is insufficient
- proposed method
- expected confidence or risk reduction
- cheaper alternative and limitation
- relative token, compute, runtime, network, storage, or paid-service cost
- stopping condition
- durable output artifact

Wait for explicit approval. Stop or de-escalate when marginal evidence no longer justifies cost.

Medium work (estimated 3% to 8% of the user's five-hour usage window) and high work (above 8%) require prior approval. If actual telemetry is unavailable, label allocation as an estimate and state confidence. Experiential browser acceptance defaults to Human Direction; do not spend AI resources reproducing it unless explicitly approved or technically necessary.

## Documentation state

Durable knowledge states are:

`LOCAL DRAFT → VALIDATED → COMMITTED → PUSHED OR INDEPENDENTLY BACKED UP → RETRIEVAL VERIFIED → SUPERSEDED WHEN REPLACED`

Do not call Local Draft a backup. Do not call Pushed content merged. Do not overwrite a historical report; register a new version and link supersession.

## Pilot protocol

A Control Plane release must pass a representative dry-run before it governs product execution.

The Pilot must prove that a request is routed to multiple relevant capabilities, classified by root layer, given a decision and resource class, stopped at the correct human gate, assigned proportional evaluation, and linked to a learning destination.

Pilot acceptance case for this release:

Input: a newly created game page has inconsistent spacing and poor landscape behavior.

Expected route: Product Design, Design System, Engineering, Evaluation and Quality, Governance and Versioning, and Continuous Learning.

Expected root decision: first determine whether the shared layout/component contribution contract is absent or violated. Do not begin with page-specific breakpoint tuning.

Expected gate: a Material design-system change requires an approved plan; a routine use of an existing Stable contract does not.

Expected resource class: Standard for targeted contract and implementation inspection. Elevated only if a broad multi-page visual matrix is justified through Resource Approval.

Expected evidence: shared contract or verified conformance, automated layout checks where feasible, targeted rendered evidence proportional to risk, and a regression fixture.

Expected learning: update the canonical design-system contract and its evaluation, then close the visible page as an acceptance case.
