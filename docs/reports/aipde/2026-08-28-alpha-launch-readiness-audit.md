# BaziGB Private Alpha Launch Readiness Audit

Status: Machine validated; awaiting human selection of the first Alpha execution scope

## Record

- Date: 2026-08-28
- Branch: `refactor/platform-foundation-i18n-v3`
- Mode: decision audit; no product implementation, browser acceptance, build, deployment, commit, or push
- Target: invite-only Private Alpha for 20–50 users
- Product promise: discover four games, play locally with a bot, or create/join a room to play with a friend in Persian or English

## Decision

BaziGB should stop pre-launch perfection work and move to an invite-only Private
Alpha release train. The four-game interface is sufficient for learning, but the
current repository is not yet a safe or operable public multiplayer release.
Launch readiness is blocked by trust-boundary, release, observability, recovery,
legal-route, and evidence gaps—not by remaining visual polish or optional game
features.

## Private Alpha boundary

### Included

- Lobby as game discovery for Tic-Tac-Toe, Backgammon, Chess, and Vegas
- Local bot play
- Invite-only create/join room flow after shared room-action authorization lands
- Persian and English routes
- Explicit Alpha labeling and direct user feedback

### Disabled or removed from Alpha navigation

- Tournaments and tournament mutation routes
- Ranked or authoritative leaderboard claims
- Administrative surfaces outside an explicitly protected operator path
- Monetization, prizes, advanced coaching, optional variants, and unfinished game settings
- Public anonymous room discovery until abuse controls and pagination are in place

### Deferred without blocking Alpha

- Header and game-mark polish
- Full Design System candidate acceptance
- Optional Backgammon adaptations
- Full rules-first audits of the other three games beyond critical-flow evidence
- Engine Build-versus-Buy migration
- Ecosystem naming

## Release blockers

1. **Multiplayer authority:** `SEC-004`, `SEC-005`, `SEC-006`, and `SEC-008`
   prove that unrelated or crafted sockets can mutate room state. One shared
   seated-actor authorization policy and adversarial contract suite is required.
2. **Room abuse boundary:** anonymous persistent room creation is unbounded and
   listing is unpaginated (`SEC-007`). Invite-only Alpha still needs quotas,
   identifier bounds, expiry, and a bounded listing policy.
3. **Release architecture:** the repository contains a systemd/SQLite deployment
   script and a conflicting Docker/PostgreSQL path with predictable fallback
   credentials (`SEC-003`). Select one fail-closed canonical path before deploy.
4. **Recoverability:** local backup copying exists, but off-device retention and
   an actual restore drill have not been proven.
5. **Observability:** no product-owned health endpoint, error reporting, uptime
   signal, or launch analytics implementation was found.
6. **Legal/support routes:** Footer links target Rules, Privacy, and Contact, but
   corresponding App Router pages were not found.
7. **Test baseline:** the complete Server suite is not green because two Admin
   controller fixtures omit current dependencies.
8. **Recoverable source checkpoint:** the approved work is a large dirty working
   tree. It must be validated, committed, pushed, and recoverably tagged or
   identified before release work can be trusted.

## Alpha execution order

1. Approve the exact Alpha promise and disable excluded surfaces.
2. Establish shared multiplayer authorization and bounded room creation.
3. Restore the complete Server test baseline.
4. Add the minimum Rules, Privacy, Contact, feedback, health, error, and product
   event surfaces.
5. Select and harden one deployment path; prove rollback and restore.
6. Run one machine Critical Path across four games and one human acceptance pass.
7. Create the approved repository checkpoint, rotate to a fresh Codex task, deploy
   only with separate authority, and verify production.
8. Invite 20–50 users and prioritize only completion, trust, connection, and
   retention blockers during Alpha.

## Go criteria

- Excluded surfaces cannot perform unsafe mutations.
- A socket cannot act for another seat or mutate a room it has not joined.
- Room creation and listing are bounded.
- Four local games start; selected online rooms create, join, reconnect, play,
  complete, and report errors through tested Critical Paths.
- Rules, Privacy, Contact, and feedback are reachable in both locales.
- Production health and errors are observable.
- A backup can actually be restored and the release can be rolled back.
- The candidate commit and deployment revision are identifiable.

## No-Go criteria

- Any validated actor-substitution or unrelated-socket mutation remains reachable.
- Deployment depends on fallback secrets or an ambiguous database architecture.
- There is no rollback/restore evidence or production error signal.
- The candidate exists only as an uncommitted working tree.
- Human Critical Path cannot complete the advertised Alpha promise.

## Learning metrics

- Lobby visit → game selection
- game selection → local start or room creation
- room creation → second player joined
- joined room → match started → match completed
- reconnect success and error rate
- invitation conversion
- next-day and seven-day return
- feedback category and blocking step

Vanity traffic and sign-up totals do not replace match-start, match-completion,
invite conversion, and return evidence.
