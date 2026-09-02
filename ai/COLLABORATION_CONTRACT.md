# BaziGB — Collaboration Contract

**Version:** 1.4.0

This is the canonical operating contract for an AI task. It complements
`AGENTS.md`; current explicit human direction remains the highest authority.

## 1. Self-organizing execution

Turn an approved objective into meaningful, dependency-aware stages. Keep the
state and advance from one safe stage to the next without asking the user to
design commands or diagnostic methods. Update the plan when evidence changes.

## 2. Guided collaboration

Report briefly at a stage start, after a material finding or direction change,
and at a checkpoint. State the result, what it proves, and what happens next.
Do not send raw logs, repetitive status, or tool narration.

## 3. Approval boundary

Use **Bundled Approval**: one approved objective authorizes its explicitly
bounded sequence of read-only inspection, fetch without prune, targeted tests,
dry-runs, and reversible local edits. Advance through those internal steps
without command-by-command confirmation and report at meaningful checkpoints.

Stop for one consolidated decision only when work reaches a consequential
product or architecture choice, exceeds the approved resource band, materially
changes scope, or requires an external, destructive, hard-to-reverse,
production, deployment, secret, merge, push, delete, tag, migration, or similar
high-risk action not already enumerated in the approved bundle. A bundle may
explicitly enumerate several such actions and receive one approval for the
whole stage; do not fragment that authority into repetitive micro-approvals.
At the boundary provide the result so far, risk, recommended default, exact
actions covered, rollback or recovery path, and one decision request.

## 4. Persistence and safe experiments

A failed command or method is evidence, not a stopping condition. Investigate
proportionately through independent safe alternatives, using temporary copies,
dry-runs, diffs, targeted tests, and rollback where appropriate. After three
documented, meaningfully different attempts at the same verified blocker,
create a resumable checkpoint and request direction if no safe path remains.

Recurring local-runtime failures or tool-generated working-tree artifacts are
root-cause signals, not routine cleanup. Keep the current task moving with the
lowest-risk workaround, then create or update a durable control task with a
recurrence detector, root-cause analysis, and a permanent containment. Do not
normalize repeated manual cleanup, repeated server restarts, or repeated test
spend as the solution.

## 5. Reuse before reinvention

For a known problem, consult narrowly scoped evidence in this order: official
documentation and advisories; upstream issues and release notes; then reputable
technical sources and established open source. Check version, date,
compatibility, license, provenance, and security impact. Never run or copy
unknown code blindly, send project data or secrets to external services, or add
a dependency unless its benefit exceeds maintenance and supply-chain cost.

## 6. Cost intelligence

Use the least costly adequate reasoning and validation. Filter output, route
reading, run targeted checks before one full gate, and do not repeat unchanged
checks. A higher-cost model needs an explicit reason and approval; creating a
new task solely to change models is prohibited.

## 7. Git checkpoints and asset protection

Before a material, multi-file, shared-UI, architecture, dependency, data, or
operations change, inspect the working tree and identify a recoverable Git
checkpoint boundary. If existing uncommitted work would be mixed with the new
scope, explicitly tell the human the risk and recommend the smallest safe
sequence: validate the current slice, create an atomic commit, and push it when
separately authorized. Do not silently mix scopes because a change is locally
convenient.

A local commit is a reversible checkpoint; a verified push protects that
checkpoint remotely. Neither authorizes a merge, deployment, production change,
or destruction of local work. Commit and push require explicit authority, but
that authority may be granted once as an enumerated part of a Bundled Approval;
do not ask again for each command inside the approved checkpoint sequence.
When a clean checkpoint cannot be made without mixing unrelated work, propose an
isolated branch or worktree before implementation rather than making rollback
ambiguous.

## 8. Definition of done

Completion records the technical result, proportional evidence, Git state,
remaining debt or risk, and the next legitimate step. “Unable to proceed” is
not valid without cause analysis, alternatives tried, and a safe checkpoint.

## 9. Durable memory

Read this file during task entry and link durable changes here or to the
appropriate canonical contract. Do not copy conversation history into it.

## 10. Control Tower and specialist routing

The coordinating task is the **Control Tower**. It owns intake, dependency-aware
priority, Task Passport issuance, executor selection, Work Registry and Current
State updates, integration review, and branch closure. A specialist owns only
the approved package it receives. It may implement and validate that package,
but must not merge to `main`, deploy, change production, broaden scope, or absorb
unrelated findings unless the Passport explicitly grants that authority.

Raw human feedback is valid intake in every task. Before acting, classify each
item as `OWN_CURRENT`, `OWN_FUTURE`, `BLOCKER`, `FOREIGN`, or `AMBIGUOUS`.
Execute only `OWN_CURRENT`. Record `OWN_FUTURE`; return `FOREIGN` and
`AMBIGUOUS` to the Control Tower; escalate `BLOCKER` with the smallest decision
needed. A specialist must not silently turn an inbox item into branch, merge,
database, production, or architecture authority.

One implementation package is active by default. Parallel work requires proven
independence, separate worktrees, explicit integration order, and sufficient
resource budget. Dependency ancestors and release blockers outrank cosmetic
recency. The Control Tower presents one decision-ready bundle to the human and
does not make the human coordinate technical substeps.

## 11. Internal and external executors

Every executable package has one Task Passport conforming to
`ai/exchange/schemas/task-passport.schema.json`. The Control Tower chooses one
route:

- `internal-specialist`: a Codex task receives the Passport and reports against
  its acceptance and permission envelope;
- `external-ai`: another AI receives the generated short prompt, Passport, and
  only the referenced canonical sources.

External execution is default-deny. The Permission Envelope explicitly lists
repository, worktree, branch, paths, actions, network, GitHub, server, database,
migration, dependency, secret, push, merge, deployment, and production access.
Anything not granted is forbidden. When required authority is absent, stop at a
recoverable checkpoint and emit an `INTERIM_BLOCKED` report; do not improvise.

## 12. Exchange and report lifecycle

`ai/exchange/` contains the tracked protocol, schemas, and templates. Runtime
reports live under the gitignored `ai/exchange/runtime/` tree:

`active → awaiting-decision → active → delivered → retired`

Invalid or untrusted deliveries go to `quarantine`. An external executor may
maintain one revisioned intermediate report. Its final delivery contains
`final-report.md` plus `delivery-receipt.json`; exact required evidence is
defined by the tracked templates and schema. Human-relayed questions and
answers must be preserved in the final report.

A downstream task may depend only on an `ACCEPTED` delivery whose identity,
path, and checksum are recorded. Durable decisions or reusable evidence are
promoted into canonical version-controlled documentation; raw runtime exchange
files remain local and are not project memory.
