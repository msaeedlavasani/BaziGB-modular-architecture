# Backgammon Rules Profile

Version: Candidate 1 · 2026-08-27

## Authority

Primary product reference: U.S. Backgammon Federation, “Rules for In-Person
Play”: https://usbgf.org/tournament-rules/rules-for-in-person-play/

The package records product adaptations explicitly. UI text and generated art
are never rule sources.

## Supported modes

- Single game: one completed game is terminal.
- Points match: independent games continue until a player reaches the configured
  target score.
- Local bot and online play consume the same pure rules package.

## Match behavior

- Normal, gammon and backgammon awards are multiplied by the current cube.
- A completed game enters `roundEnd`; the board and result remain visible.
- The next game begins only after acknowledgement and starts with the cube at 1
  in the center.
- The Crawford game disables doubling once per match when a player first becomes
  one-away.
- A player cannot offer a dead-cube double that adds no match-winning value.
- Random dice are not undoable. Undo cannot cross `roundEnd` or `finished`.

## Settings owned by this profile

- play mode: single game or points match;
- target score for points match;
- bot difficulty outside the pure rules layer.

`win by two` is not a Backgammon match setting and must not be rendered by its
toolbar.

## Open product adaptations

- Resignation UI and validation for single/gammon/backgammon values.
- Optional Jacoby rule, only if a money-play mode is introduced.
- Clock settings for competitive online formats.
- Explicit opening-roll procedure instead of assigning the first turn by seat.

These are not silently assumed to be implemented.
