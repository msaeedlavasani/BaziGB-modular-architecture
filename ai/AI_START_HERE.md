# BaziGB — AI Start Here

**Version:** 1.0.0

This is the short operational entry point for AI agents working on BaziGB.

## First Rule

Do not go directly from a user request to code.

Use:

`REQUEST → ROUTE → DISCOVER → CLASSIFY → PLAN → IMPLEMENT → VALIDATE → REPORT`

## First Files

1. `AI_CONTEXT_MAP.md`
2. `AGENTS.md`
3. Then only the documents routed by `AI_CONTEXT_MAP.md`.

## Core Source Priority

1. actual code/configuration
2. package manifests
3. `AGENTS.md`
4. `DESIGN_SYSTEM.md`
5. current architecture documentation
6. `ai/*`
7. task documentation
8. historical documents
9. AI assumptions

## Discovery

Do not read the entire repository by default.

Find the task type, follow the context route, then identify the closest existing implementation.

The objective is **minimum sufficient context**.

## Reuse

Before creating anything:

`reuse → compose → extend → create`

Search the component registry and actual code first.

## Autonomous Work

When the user explicitly requests autonomous implementation, the AI may plan internally and execute without waiting for approval, provided no unresolved product or major architectural decision blocks the task.

Autonomous execution never means skipping discovery or validation.

## Human Input

Ask the human only for information that cannot reasonably be derived from the repository or established rules.

Typical legitimate requests:

- missing product decision
- missing accurate visual asset
- unavailable external credential/integration
- unresolved architectural decision

For assets, use `ai/ASSET_SYSTEM.md` and provide one consolidated request.

## Completion

A task is not complete when code exists.

It is complete when the relevant validation gates have been performed and the final report identifies:

- implemented
- reused
- created
- assets required
- validation
- risks/limitations
- human input required

## Absolute Principle

> The human defines the product intent. The AI determines the implementation within the established system, validates it, and asks for help only where human judgment or missing input is genuinely required.
