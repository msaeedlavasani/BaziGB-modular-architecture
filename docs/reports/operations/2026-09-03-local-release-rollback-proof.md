# Local Release Rollback Proof

**Date:** 2026-09-03  
**Scope:** `DO-RELEASE-001` release controller and rollback gate  
**Source revision:** local working tree after `91c616a`  
**Status:** Machine-validated locally; staging and production execution remain blocked

## Result

The local release-controller rehearsal detected and corrected a fail-open health-check composition bug. Both the API and Web health checks are now jointly mandatory. A simulated failed activation switches the `current` pointer back to the previously verified release and re-runs the mandatory health checks.

## Evidence

- `node --test scripts/release-safety.test.mjs`: 9 of 9 passed.
- The rollback test uses isolated temporary release and shared-data directories.
- The activation failure is injected through the health-check boundary.
- The test verifies both `current` and `previous` resolve to the prior release after rollback.
- No production host, production database, secret, or network endpoint is accessed.

## Limitations and remaining gates

- This is a local deterministic rehearsal, not staging or production proof.
- The production host preparation script has not been executed.
- No production backup or restore drill has been performed.
- No candidate has been staged or activated.
- A clean committed and remotely protected candidate, staging rehearsal, production checkpoint, and explicit per-candidate deploy approval remain required.

## Supersession

This report does not supersede the release contract or the 2026-08-29 local release-candidate preflight. A later staging rehearsal must reference this report and record the real host configuration, candidate identity, backup integrity, health verification, and rollback result without exposing secrets.
