# Game Integrity and Identity Audit

Date: 2026-08-27
Status: Backgammon vertical slice implemented and locally validated; human acceptance pending

## Decision

Do not continue screenshot-led patching and do not start a big-bang rewrite.
Run a rules-first vertical audit for each game, beginning with Backgammon, while
strengthening shared contracts only when a verified game requirement needs them.

## Evidence

- The local game route combines orchestration, bot timing, persistence, match
  settings, reporting, undo and game-specific exceptions using untyped state.
- Backgammon automatically creates the next game inside `finishRound`, so there
  is no explicit completed-game boundary for result acknowledgement or undo.
- The engine has generic match fields, while real configuration differs by game.
  Backgammon match points, gammons/backgammons, cube, Crawford rule and resignations
  are not equivalent to Tic-Tac-Toe rounds or Chess time controls/draw policy.
- Backgammon bar data exists in canonical state and serialization, but its visual
  representation is too small and can appear invisible. This is a state-to-view
  contract failure, not evidence that capture should be reimplemented in UI.
- Header balancing by equal geometric slots improved symmetry but did not produce
  a professionally resolved navigation composition. It remains a rejected design
  candidate.

## Required system layers per game

1. Source dossier: authoritative rules, edition/date, product adaptations and
   unresolved interpretations.
2. Rules profile: legal actions, phases, randomness, scoring, match format,
   completion, undo/resign/draw policy and configuration schema.
3. Conformance suite: examples, edge cases, exploit regressions and invariants.
4. Orchestrator: local, bot and online flow consuming the same typed game contract.
5. Presentation model: player-relative state, visible assets, interaction targets,
   announcements and Guided Play hints derived from canonical legal actions.
6. Game identity kit: silhouette, motifs, palette roles, materials, motion and
   logo constraints derived from the game and BaziGB brand system.

## Backgammon first vertical slice

- Add an explicit `roundEnd` boundary and result acknowledgement before the next
  game begins.
- Clear or seal undo history at game completion; never cross a completed-game
  boundary.
- Keep an unresolved roll non-undoable and persistent.
- Make bar ownership/count visually undeniable and test the rendered state.
- Add Crawford/dead-cube behavior before describing match play as standard.
- Replace generic match toggles with a Backgammon rules profile and validated
  settings schema.
- Extract local orchestration from the page and eliminate untyped game state and
  duplicated transition calls.

## Source policy

- Prefer official federations/publishers and current rule editions.
- Record source, version and product deviations in the game package.
- A UI control may only exist when its rule capability and configuration schema
  exist in the game profile.
- Generated art cannot define or silently alter gameplay rules.

## Cost policy

The economical sequence is: source dossier → rules profile → tests → one complete
vertical implementation → reusable contract. Broad UI redesign, asset generation
and full-repository cleanup are deferred until the Backgammon slice proves the
contracts. This minimizes repeated visual work and avoids paying for a rewrite
whose target architecture has not yet been validated.

## Implementation result

The approved Backgammon slice now provides a package-owned rules profile, an explicit completed-game boundary, an adapter-owned next-game transition, score/cube/Crawford continuity, a non-crossable Undo boundary, and visible bar counts. Local and online orchestration consume the same transition capability rather than recreating the next-game state.

Executable evidence on 2026-08-27:

- Backgammon conformance/regression suite: 29/29 passed.
- Targeted server gateway suite: 8/8 passed.
- Shared package build, package-boundary check, server typecheck, web typecheck and design-system/governance checks passed.
- Optimized web build passed after the final adapter extraction.
- Local Persian Backgammon route smoke passed at 1280px with RTL direction, no horizontal overflow and no runtime console errors.

The slice deliberately leaves resignation, a dedicated opening-roll procedure and optional federation variants unresolved. It does not claim full official tournament completeness. Header composition, richer game identity assets and the other game audits remain separate human-gated work.

## Environment finding

The server workspace contained a stale nested Vitest 4 installation while the repository declares Vitest 1.6. The incompatible nested copy was moved recoverably to `/private/tmp/bazigb-server-node-modules-vitest4-20260827-1335`, restoring the declared workspace runner. The complete server suite still contains two pre-existing Admin controller failures caused by missing `roomService` mocks; the gameplay gateway suite itself passes.
