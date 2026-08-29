# Private Alpha Scope Boundary

Date: 2026-08-29
Status: machine-validated; six-item human browser acceptance passed; publication pending
Source: Private Alpha checkpoint following `a577fe0c3d7810a061a3218a02b2cc9d749f1607`
Supersedes: none

## Scope

The approved Alpha offers four games, local bots, invite-code rooms, public
room discovery and a public leaderboard. Tournament capabilities are deferred.
Admin operations remain server-protected but are not advertised to Alpha users.
The lobby shows a small “Free experimental version” badge in Persian and
English.

## Implementation

- Server tournament endpoints use a fail-closed guard that returns 404.
  Leaderboard and `GET /rooms` remain public.
- The web navigation exposes leaderboard but not tournaments or Admin. Direct
  tournament routes return users to the localized lobby.
- The Game Hub polls and displays public rooms; invite-code joining remains.

## Validation

The validation copy used Node 24.19.0, a clean dependency installation and
Vitest 1.6.1.

- Route/capability tests: 3/3 passed.
- Full server suite: 21/21 passed.
- Full workspace suite: 90/90 passed, including Vegas without alteration.
- Package builds, server build and optimized web build passed.
- Following the human scope adjustment: server and web typechecks, updated
  route/capability tests (3/3), and optimized web build passed.

The clean installation intentionally skipped lifecycle scripts. Prisma Client
generation was blocked only by a sandboxed local cache permission, so the
matching generated client from the checkout was copied into the temporary
validation directory before the server build. This did not alter repository
source, manifests, lockfile, deployment or production.

## Limitations and next gate

The six-item human browser check passed in both locales on 2026-08-30,
including room refresh, creation, return, and tournament-route behavior. The
scope is checkpointed on its tracked branch; production remains unchanged. The
next independent launch task is `LA-TRUST-001`; it needs a specific approval
of bilingual legal and support content.
