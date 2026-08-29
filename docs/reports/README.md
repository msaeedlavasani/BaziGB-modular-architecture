# Permanent Reports Registry

This directory is the version-controlled home for high-value reports that must not be lost in chat history or temporary tool storage.

## Rules

- Every material audit, architecture decision, evaluation, incident review, or migration report receives a stable file here.
- Reports record their date, scope, source revision, validation status, limitations, and supersession relationship.
- Reports are immutable evidence snapshots. Later corrections create a new version and link back to the superseded report.
- Chat output and temporary tool artifacts are not canonical until registered here.
- Product code changes and report publication remain separate approvals.

## Registry

| Date | Area | Report | Status | Source revision |
| --- | --- | --- | --- | --- |
| 2026-08-26 | Security | [Repository security audit](./security/2026-08-26-repository-security-audit.md) | Validated static audit; runtime follow-ups remain | `17049d2704f755a1df85190580027001c0bb6856` |
| 2026-08-26 | AIPDE | [System capability audit](./aipde/2026-08-26-system-capability-audit.md) | Analysis complete; implementation not approved | `17049d2704f755a1df85190580027001c0bb6856` |
| 2026-08-26 | AIPDE | [Control Plane Pilot](./aipde/2026-08-26-control-plane-pilot.md) | Dry-run contract passed; live product Pilot remains | working tree after `17049d2704f755a1df85190580027001c0bb6856` |
| 2026-08-26 | AIPDE | [System integration audit](./aipde/2026-08-26-system-integration-audit.md) | Integration contract implemented and structurally validated; domain pilots remain | working tree after `044ade5acc7507aa64361871da6cb839d8256c43` |
| 2026-08-26 | AIPDE | [Design System live pilot](./aipde/2026-08-26-design-system-live-pilot.md) | Second human gate rejected; third correction Candidate under review | working tree after `d8103f7d50a895e2ccdd299e178066c9d2da04f8` |
| 2026-08-27 | AIPDE | [Game Integrity and Identity Audit](./aipde/2026-08-27-game-integrity-audit.md) | Backgammon vertical slice implemented and locally validated; human acceptance pending | working tree after `d8103f7d50a895e2ccdd299e178066c9d2da04f8` |
| 2026-08-27 | AIPDE | [Work Intelligence Control Implementation](./aipde/2026-08-27-work-intelligence-control.md) | Implemented and machine validated; live usage observation begins with the next task | working tree after `d8103f7d50a895e2ccdd299e178066c9d2da04f8` |
| 2026-08-29 | AIPDE | [Local Release-Candidate Preflight](./aipde/2026-08-29-local-release-candidate-preflight.md) | Local machine validation passed; candidate freeze and activation are blocked by required release gates | dirty working tree at `21cf30f7f73a51acb55d459063e95fb6541b3437` |
