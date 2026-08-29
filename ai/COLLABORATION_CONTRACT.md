# BaziGB — Collaboration Contract

**Version:** 1.0.0

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

Stop only for fresh authority over production or deployment, destructive or
hard-to-reverse work, secret disclosure or mutation, a material new cost or
scope, a consequential product choice, or a move to a higher-cost model. At
that boundary provide the result so far, risk, recommended default, and one
precise decision request.

## 4. Persistence and safe experiments

A failed command or method is evidence, not a stopping condition. Investigate
proportionately through independent safe alternatives, using temporary copies,
dry-runs, diffs, targeted tests, and rollback where appropriate. After three
documented, meaningfully different attempts at the same verified blocker,
create a resumable checkpoint and request direction if no safe path remains.

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

## 7. Definition of done

Completion records the technical result, proportional evidence, Git state,
remaining debt or risk, and the next legitimate step. “Unable to proceed” is
not valid without cause analysis, alternatives tried, and a safe checkpoint.

## 8. Durable memory

Read this file during task entry and link durable changes here or to the
appropriate canonical contract. Do not copy conversation history into it.
