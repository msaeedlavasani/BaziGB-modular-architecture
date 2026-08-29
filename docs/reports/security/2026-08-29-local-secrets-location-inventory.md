# BaziGB Local Secrets Location Inventory

**Date:** 2026-08-29
**Status:** Local metadata inventory complete and seed default remediated; production values and server locations not inspected

## Scope and handling

This review searched the BaziGB repository for environment files, private-key file types, runtime environment references, and hardcoded credential defaults. It reported names and locations only. Secret values were not copied into this report, KeePassXC, chat, or command output by design.

## Outcome

- No local `.env` containing real values was found in the repository checkout.
- No local PEM, private-key, PKCS#12, or KeePass key file was found in the repository checkout.
- `.env.example` contains names and empty placeholders, not production values.
- Production values therefore cannot be migrated from this checkout. Their current server location remains unknown until separately approved production inspection.
- One development seed script contains a hardcoded account identity and password default in versioned source. The password must be treated as compromised; any account ever created with it must be disabled or rotated after exact impact is established.
- The Docker Compose alternative contains predictable fallback database and JWT values already covered by `SEC-003`. It remains disabled as a production architecture under the Release and Secrets Contract.

## Classified names

| Name or class | Classification | Current local evidence | Required next action |
| --- | --- | --- | --- |
| `JWT_SECRET` | production secret | required by server; empty example; unsafe Docker fallback | inspect runtime metadata, transfer approved value to KeePassXC, remove fallback, rotate if fallback was ever used |
| `SMSIR_API_KEY` | provider secret | empty example; server consumer exists | inspect runtime metadata and transfer approved value |
| SSH deployment private key | privileged file credential | no key file in checkout; deploy script expects SSH access | identify operator key without printing it, attach encrypted recovery copy, replace root deployment later |
| seed bootstrap password | compromised source credential | hardcoded default in `apps/server/scripts/seed-user.js` | remove default and rotate or disable affected account |
| `POSTGRES_PASSWORD` | deferred-path secret | predictable Docker fallback; PostgreSQL not selected for Alpha | disable production path and remove fallback; do not create Alpha credential |
| `DATABASE_URL` | sensitive connection configuration | Docker-only conflicting path; SQLite is selected | no PostgreSQL value for Alpha; keep future migration separate |
| `SMSIR_TEMPLATE_ID` | configuration, not secret by default | present in example | record configuration metadata only |
| `PROD_HOST`, `PROD_PATH`, `API_PROXY_TARGET` | operational configuration | present in scripts/examples | move to release configuration contract; do not store as password unless access-bearing data is added |
| public web and socket URLs | public configuration | same-origin defaults | keep out of secret vault; validate per environment |

## Required authority split

The next production-oriented work must remain separated:

1. Read only secret names, file permissions, consumers, and service locations on the server without printing values.
2. Present the redacted map to Human Direction.
3. Obtain explicit approval for each value transfer into KeePassXC.
4. Obtain separate approval for rotation, account disabling, runtime edits, service restart, or deletion.

## Immediate blocker

No production credential transfer can proceed from local files because no real local values were found. Production inspection is a new critical authority and has not been performed.

## Seed remediation evidence

The current working tree no longer supplies a default seed identity or password. `apps/server/scripts/seed-user.js` now requires `SEED_EMAIL`, `SEED_USERNAME`, and `SEED_PASSWORD` before hashing or constructing a Prisma client. Missing, empty, whitespace-only, and non-string inputs fail closed. The existing explicit-environment behavior remains: the password is hashed, an existing matching user has only its password updated, a new user is created as `ADMIN`, and the database client disconnects.

Evidence:

- focused seed configuration and behavior tests: 6 of 6 passed;
- server TypeScript check: passed;
- missing-input trigger: stopped before database access;
- independent read-only bypass and regression review: no concrete surviving path found;
- governance and diff checks: passed;
- full server suite: 16 passed and 2 pre-existing Admin controller fixture failures remained; neither failure touches the seed script.

This source fix cannot remove the credential from Git history and cannot prove whether an account was created or reset with it. That account-impact check and any disable or rotation require separately approved environment inspection.
