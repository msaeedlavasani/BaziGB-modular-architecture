# BaziGB — Collaboration Contract

**Version:** 1.3.0

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
