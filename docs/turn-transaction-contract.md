# Turn Transaction Contract

Status: Accepted product contract · pure rules and local orchestration machine-validated · human acceptance pending · 2026-08-28

## Decision

A Backgammon turn is an explicit transaction:

`Roll → Draft Moves → Undo within the draft → End Turn → Commit`

Moving the final die must not implicitly hand control to the opponent. The actor owns a reversible draft until they explicitly end the turn. Once committed, neither local nor online play may undo that turn.

This is an orchestration contract built on canonical game rules. It does not put UI state into the rules package and does not allow the web app or server to invent legality.

## State boundaries

Every active turn has two distinct states:

- **Committed state** — the authoritative board at the start of the turn, including the once-generated unresolved roll.
- **Draft state** — the committed state plus zero or more validated moves by the current actor.

The transaction records the actor, base revision, rolled dice, ordered draft moves, draft state, and status (`draft` or `committed`). The roll is generated once and persisted immediately. Undo removes only draft moves; it never regenerates or removes the roll.

## Rules-owned capabilities

The Backgammon package must expose pure operations that answer:

1. which move chains satisfy the mandatory-use rules from the rolled state;
2. whether a proposed move is a valid prefix of at least one maximal legal chain;
3. whether the current draft can be committed;
4. the committed result of the complete chain, including turn transfer or game completion.

The mandatory-use rules include using the maximum possible number of dice and, when only one of two unequal dice can be used, using the higher die. Doubles expose up to four uses. A UI hint is never sufficient proof of legality; commit repeats validation in the rules package.

## End Turn policy

`End Turn` is enabled only when one of these conditions is true:

- every required die has been consumed by a valid maximal chain;
- no legal move exists for the unresolved roll;
- the draft produces a game-ending bear-off.

The control must not permit a player to skip a usable die or commit a shorter non-maximal chain. A no-move turn still requires an explicit acknowledgement before control transfers.

## Undo policy

- Undo is disabled before the first draft move.
- Undo removes the most recent draft move and restores its consumed die and board effects.
- Undo may repeat back to the rolled committed state.
- Undo cannot cross the roll, the turn commit, a bot turn, a completed game, or a completed match.
- No opponent approval is requested because uncommitted draft moves have not changed shared committed state.

## Local bot orchestration

- Session persistence stores both committed state and the active draft transaction.
- Refresh restores the same roll and current draft; it cannot create a new roll.
- The bot starts only after the human commits.
- The bot receives the same canonical legal-chain constraints, presents its roll and moves at a readable pace, then commits atomically.
- Difficulty may influence move selection only; it cannot influence dice generation or rule legality.

## Online orchestration

- The server owns the committed state, revision, roll, active actor, and transaction authority.
- A client submits draft actions against a base revision; the server validates them or validates the complete chain at commit.
- Commit is atomic and idempotent. Stale revisions, wrong actors, duplicate commits, and incomplete chains are rejected.
- The opponent acts only on committed state. Reconnect restores the same unresolved roll and server-recognized draft or safely reconstructs the draft from its validated move list.
- Timeout and abandonment policy are separate product decisions; they must not be hidden inside Undo behavior.

## Acceptance matrix

### Pure rules

- One move of a two-die turn remains a valid draft and can be undone.
- After the second required move, turn ownership remains unchanged until commit.
- Commit transfers the turn exactly once.
- A shorter chain is rejected when a longer legal chain exists.
- The higher die is enforced when only one unequal die can be played.
- All four legal uses of doubles can be drafted and individually undone.
- A no-move roll can be explicitly committed.
- A winning draft becomes `roundEnd` or `finished` only at commit.

### Local integration

- Refresh preserves the roll, draft moves, and Undo depth.
- The bot cannot start before human commit and starts once after commit.
- Undo never reaches a prior human turn or bot action.
- A new game and result acknowledgement clear the transaction.

### Online integration

- Only the seated current actor can mutate or commit a draft.
- Duplicate and stale commits do not transfer the turn twice.
- Reconnect preserves transaction continuity.
- The opponent cannot observe or act on an uncommitted board as authoritative state.

## Implementation slices

1. Add pure Backgammon chain-prefix and commit validation with conformance tests. **Completed: 34/34 package tests pass.**
2. Add the local transaction controller, persistence, `End Turn`, and bot handoff tests. **Completed: targeted tests, Web typecheck and optimized Web build pass.**
3. Run human local acceptance.
4. Add the server-authoritative online transaction after the multiplayer authorization boundary is secured.
5. Run two-client human acceptance.
