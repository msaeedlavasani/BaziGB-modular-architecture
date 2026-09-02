# AIPDE Work Management Contract

**Version:** 1.1.0
**Role:** Canonical policy for portfolio grouping, task state, reporting, retrieval, supersession, and resource gates.

The machine-readable companions are `ai/work-registry-v1.json`, `ai/current-state.json`, and `ai/retrieval-manifest-v1.json`. Active work state lives in the Work Registry, never in historical reports.

## Operating model

AIPDE capabilities are accountable operational functions, not simulated job titles. Every task has one accountable capability, bounded contributors, an evidence contract, a receiver, and a learning destination.

The hierarchy is:

`portfolio → domain → workstream → milestone → task → evidence → learning`

Tasks are grouped when they share an outcome, root control, evidence path, or dependency boundary. Screenshot recency, file proximity, and chat order are not grouping or priority rules.

## Portfolio taxonomy

The canonical portfolio categories are:

1. Product Integrity — rules, state, scoring, completion, randomness, reconnect, and result correctness.
2. Security and Trust — identity, authorization, protocol trust, abuse prevention, privacy, and administrative authority.
3. Product Experience — information architecture, interaction, accessibility, ergonomics, hierarchy, and comprehension.
4. Design System and Brand — reusable anatomy, tokens, responsive contracts, identity, assets, maturity, and conformance.
5. Platform Architecture — package, adapter, routing, persistence, localization, and server/client ownership contracts.
6. Evaluation and Quality — unit, contract, integration, adversarial, accessibility, human-acceptance, and evidence gates.
7. Delivery and Operations — environment, deployment, rollback, observability, backup, restore, and incidents.
8. Governance and Knowledge — authority, work state, retrieval, reporting, versioning, cost, and transferability.
9. Growth and Market Learning — launch scope, acquisition, activation, retention, feedback, experiments, and cost of delay.
10. Evolution — recurrence analysis, changed controls, regression mechanisms, and measured learning.

Evaluation and Quality and Evolution are embedded in every applicable workstream even when another category owns its outcome.

## Priority model

Priority is recomputed from evidence rather than inherited from report order. Evaluate:

- user or safety harm;
- release-blocking trust or correctness risk;
- dependency leverage and number of downstream tasks unblocked;
- recurrence likelihood and shared-control leverage;
- uncertainty and evidence gap;
- reversibility;
- cost relative to expected risk reduction;
- cost of delay and time to validated market learning;
- human value and product visibility.

Priority bands:

- `P0`: active harm, exploit, corrupted authority/state, or release blocker.
- `P1`: high-value dependency or user-critical correctness/experience gap.
- `P2`: important quality, resilience, or scale work that does not block the current candidate.
- `P3`: bounded improvement, optional capability, or deferred optimization.

## Launch discipline

When a usable candidate exists, launch readiness becomes an explicit portfolio
milestone rather than an implicit final phase. The system must distinguish:

1. release blockers: trust, correctness, operability, recovery, legal/support,
   and evidence gaps that can harm users or make the service uncontrollable;
2. Alpha learning enablers: onboarding, feedback, critical funnel events, and an
   owned response loop;
3. post-launch evolution: polish, optional variants, speculative capabilities,
   and architecture improvements that do not block the stated release promise.

Every pre-launch task must justify why its risk reduction exceeds the cost of
delaying user learning. A release train uses an explicit included/excluded
capability boundary, WIP limits, Go/No-Go evidence, a candidate revision, and
separate deploy authority. Product perfection is never an implicit release gate.

## Task lifecycle

Allowed states are:

`observed → triaged → approved → in-progress → implemented → machine-validated → human-validation-pending → accepted → operationally-verified → learning-captured`

Additional non-linear states are `blocked`, `deferred`, `rejected`, `superseded`, and `reopened`.

Implemented is not validated. Machine-validated is not human-accepted. Accepted is not deployed or operationally verified. A task is never deleted to make the backlog appear smaller.

Every task records: stable id, category, domain, workstream, milestone, outcome, accountable capability, contributors, source, state, priority, risk, dependencies, scope, exclusions, acceptance, machine evidence, human evidence, resource estimate, approval gate, artifact, receiver, learning destination, and related or superseding tasks.

## Task Passport and execution readiness

The Work Registry is the portfolio source; a Task Passport is the bounded
execution contract for one package. Before assignment, the Control Tower
derives a Passport containing: objective, lifecycle stage, dependency gate,
scope lock, exclusions, risk and reversibility, resource band and stopping
threshold, executor route, branch/base/worktree, permission envelope,
acceptance, exact validation, evidence inputs, expected outputs, human gate,
stop conditions, and closure receiver.

A task without enough data is `PASSPORT_INCOMPLETE`, not executable. Legacy
tasks gain Passports lazily: P0/P1 first, then their dependency ancestors, then
the selected executable task. Do not spend resources converting the entire
backlog in advance.

Dependencies are fail-closed. A package may start only when each required task
or evidence dependency has the required accepted status. Evidence dependencies
record task id, artifact, canonical or local path, checksum, and required
status. Local reports are usable only after Control Tower acceptance.

The default WIP limit is one implementation package. A second package requires
documented independence, separate worktrees, integration order, and resource
capacity. Every branch closes through validation, integration review, human
gate when applicable, merge authority, post-merge validation, and an explicit
retain/archive/delete decision.

## Work reporting policy

Every milestone report separates:

1. changed;
2. validated, with exact evidence;
3. implemented but awaiting a gate;
4. genuinely open, blocked, deferred, rejected, reopened, or superseded;
5. resource estimate versus observed user-reported usage when available.

Reports are evidence snapshots and must not become a second active backlog. They reference task ids. Status changes occur only in the Work Registry.

## Current-state policy

`ai/current-state.json` is the small mandatory session-resume source. It contains only repository context, active milestone, active or next tasks, current gates, blockers, last validation, constraints, and links to canonical registries.

Update it at a material handoff or milestone boundary. Do not copy long decisions or histories into it.

## Retrieval policy

Every task first reads:

1. `AGENTS.md`;
2. `AI_CONTEXT_MAP.md`;
3. `ai/current-state.json`;
4. the matching route in `ai/retrieval-manifest-v1.json`;
5. only the routed domain sources and closest implementation/evidence.

Historical reports are excluded by default. They may be opened only when provenance is required, a regression recurs, current sources conflict, or the user requests history/audit. Within one task, an unchanged source is not reread without a concrete reason.

Context expansion is progressive: start with the route's initial sources, inspect direct dependencies, and expand only when uncertainty, risk, a failed check, or a source conflict demands it. Broad documentation search requires an explicit retrieval reason and may trigger a Resource Approval Request.

## Supersession policy

Historical evidence is immutable. A newer artifact does not erase it.

- Canonical contracts may be updated in place with version and validation changes.
- Historical reports receive status metadata and a `supersededBy` link when replaced.
- The Work Registry task retains relationships and the decision reason.
- A superseded task is excluded from actionable backlog counts.
- A reopened task links the new evidence and preserves the earlier acceptance record.
- HANDOFF and Current State link to canonical active state rather than restating historical status.

## Resource and cost gate

### Bundled Approval

An approved work package covers its bounded reversible internal sequence:
read-only discovery, fetch without prune, proportional tests, dry-runs, and
local edits. These steps do not create separate approval gates. Reconfirm only
for a meaningful decision, material scope change, resource-band overrun, or an
external or high-risk action not explicitly included in the package.

When a stage needs multiple consequential actions, enumerate their exact scope,
recovery path, and exclusions in one decision-ready bundle. One human approval
authorizes that bundle; implementation must not convert it into repeated
command-level confirmations. Authority for one bundle never implies authority
for later deployment, production mutation, secret change, migration, or cleanup
outside its enumerated targets.

Each task has an estimated usage band:

- `low`: under 3% of the user's five-hour usage window;
- `medium`: 3% to 8%;
- `high`: above 8%.

Low work may proceed inside an approved scope. Medium and high work require an explicit estimate and human approval before execution. If expected usage crosses the approved band, work stops before expansion.

Human browser acceptance is assigned to the human when experiential judgment can supply the evidence. AI-run browser work is used only when specifically approved or when a technical ambiguity cannot be tested more economically. Machine tests necessary for correctness are not removed to save cost; scope is reduced instead.

Exact token attribution is reported only when telemetry exists. Otherwise label percentages as estimates, give confidence, and never present inferred allocation as measured fact.

## Closure and learning

Task closure requires the applicable evidence and gate. A structurally repeatable failure also requires a changed shared control and recurrence detector. The visible defect may close before all optional evolution work, but the learning task remains linked and explicitly prioritized.

## Branch lifecycle and release-drift control

A branch is temporary work state, not permanent project memory. Before creating a branch, record its owner, purpose, base, intended receiver, and closure condition. Reuse the current approved branch when isolation is not required. A completed checkpoint must explicitly choose one outcome: merge, retain with a dated reason, archive after tagging, or delete after proving that no unique commits will be lost.

At every material checkpoint and handoff, automatically report: the canonical branch, its ahead/behind distance from `main`, remote branches with identical tips, stale branches, unique unmerged commits, and active worktrees. Branch creation is forbidden when the canonical branch is ambiguous or an earlier temporary branch has no recorded closure decision, unless isolation is required to protect unrelated work and the exception is recorded.

Branch health affects priority. Ambiguous release authority, a materially diverged `main`, or an unidentified deploy source is a P0 release-control risk. Cosmetic branch clutter with a proven canonical source is P2. Atomic deployment consumes one immutable commit artifact and never infers production intent from a branch name; it does not replace branch closure, small release cadence, or merge discipline.
