# AIPDE Design System Live Pilot

## Record

- Date: 2026-08-26
- Scope: reusable responsive layout, composite components, component maturity, and two live acceptance cases
- Source revision: `d8103f7d50a895e2ccdd299e178066c9d2da04f8` plus the documented working-tree changes
- Decision class: Material
- Resource class: Standard
- Human approval: received before implementation
- Product-code scope: shared Design System controls, Lobby and Game Hub acceptance, and Game Shell acceptance
- Status: first and second candidates rejected; third correction Candidate awaits human review

## Task envelope

The outcome was to replace page-level responsive geometry and screenshot-led correction with reusable product components and executable conformance controls.

The root layer was classified as a missing Design System contribution and evaluation path. The visible spacing, media overflow, card hierarchy, status composition, and landscape issues were acceptance cases rather than independent patch instructions.

The contributing capabilities were Human Direction, AI Orchestration, Product Design, Design System, Engineering, Evaluation and Quality, Governance and Versioning, Cost and Resource Governance, Knowledge Management, and Continuous Learning.

## Shared controls delivered

- one executable layout contract owns page gutters, section rhythm, grid item roles, card padding, and game-surface comfort geometry;
- `PageContainer` and `PageStack` own outer page geometry and section rhythm;
- `ResponsiveGrid` accepts semantic item roles instead of raw `minItemWidth` values;
- `ActionCard` owns primary and secondary product-action hierarchy and composite padding;
- `StatusCluster` owns wrapping and logical icon/text spacing for status indicators;
- `GameCard` contains arbitrary supplied media inside its frame;
- `GameShell` consumes the shared surface track and status composition;
- a versioned component registry records responsibility, contracts, consumers, evidence, and maturity;
- a fail-closed checker rejects missing composite components and feature-level raw grid geometry.

All pilot components remain Candidate. No component is promoted to Stable merely because implementation and local rendering passed.

## Human gate failure

The first rendered evaluation over-weighted zero horizontal overflow, shared width and initial-viewport visibility. Those checks were technically true but insufficient to establish product quality.

Human review rejected the candidate because navigation icon/label proximity was incoherent, Game Hub cards lacked visual hierarchy, the Bot card contained unjustified empty space, the Game Settings toolbar had no internal anatomy, the trust-seal image failed without a fallback, game identity relied on unrelated emoji, page titles were oversized, and Backgammon exposed orientation, ownership, interaction-latency and Undo-rule concerns.

The second human gate also failed. Machine checks had still overvalued overflow
and underweighted initial-viewport task access, compact mobile anatomy, board-piece
containment, unique navigation destinations, status-indicator internals and game
art recognizability. This prevented Candidate promotion again.

The third correction adds a 320x700 task-access criterion, compact mobile action
anatomy, collapsed mobile settings, fluid Backgammon checker containment,
direction-safe StatusPill, single Lobby entry and removal of duplicate board score.
Cross-game art direction remains explicitly human-gated.

The reported `328px` toolbar/board measurement was also framed incorrectly. It was the observed result of a `360px` viewport minus two fluid `16px` minimum gutters, not a fixed mobile target. Responsive acceptance must evaluate use of available space, composition, hierarchy and usability rather than treating one exact measurement as the rule.

## Acceptance evidence

### Non-game case

Lobby and Backgammon Game Hub consume PageContainer, PageStack and semantic ResponsiveGrid. Game Hub uses ActionCard for primary Create Room and secondary Bot and Join actions.

Rendered checks at `360x800`, `800x360`, and `1440x900` showed no horizontal overflow and contained GameCard media. Human review established that equal-height wide Game Hub cards were the wrong product composition. This claim therefore failed despite passing geometry checks.

### Game case

Tic-Tac-Toe Game Shell consumed StatusCluster and the shared intrinsic surface track.

At `360x800`, settings and the game surface consumed the available container width after fluid gutters; the observed width was `328px`, not a cross-device target. At `800x360`, the board and settings formed separate side-by-side regions and the board entered the initial viewport. Human review still rejected the toolbar anatomy and Backgammon usability, showing that geometry alone was not sufficient. No runtime console errors were observed.

## Executed validation

- `npm run check:design-system`: PASS
- `npm run test:design-system`: PASS; the valid fixture passed and removal of StatusCluster failed closed
- `npm run typecheck -w @bazigb/web`: PASS
- `npm run build:packages`: PASS for Engine, Tic-Tac-Toe, Backgammon, Chess, and Vegas
- `npm run check:boundaries`: PASS
- `npm run build:web`: PASS
- targeted runtime geometry matrix: PASS
- product-quality and human visual evaluation: FAIL; correction loop opened
- `git diff --check`: PASS before report finalization

The web build emitted one non-blocking warning because the Google Fonts stylesheet could not be downloaded for optimization. Compilation, type validation, static generation, and route generation completed successfully.

## Limitations

- the first human visual candidate was rejected and requires a new gate after correction;
- Candidate components do not yet have the evidence required for Stable maturity;
- no new visual-regression or browser-testing dependency was introduced;
- this pilot does not convert every existing page or composite component;
- backend availability and room API behavior were not part of the rendered layout claims;
- commit, push, merge, deploy, and production verification remain separate states and permissions.

## Learning

Responsive consistency is now expressed as semantic component selection plus an executable contract. Feature pages no longer choose repeated-item minimum widths. Composite status spacing and action-card hierarchy are reusable responsibilities rather than local `sx` fragments.

The next decision is human visual acceptance. If accepted, the Candidate controls remain the required path for the next bounded adoption wave. Stable promotion occurs only after a second representative domain, automated regression evidence, and retained rendered evidence satisfy the registry contract.

## Correction outcome

The correction loop added shared NavigationItem, ActionDeck, PageHeader,
GameSettingsToolbar, GameIdentityMark and TrustSeal components. It also changed
the Persian Backgammon product name from «نرد» to «تخته» and removed random
emoji identity metadata from the game catalog.

ActionDeck was itself corrected during evaluation: a first attempt made the
primary card span two rows and produced empty height. The final contract gives
the primary action greater width and emphasis without using empty height as a
proxy for importance.

The rebuilt candidate passed Governance, Design System checks, fail-closed
tests, web typecheck, all game-package builds, boundary checks and web build.
Rendered checks at `360x800` and `1440x900` showed no horizontal overflow. The
wide action cards measured different semantic widths (`491`, `263`, and
`333px`) with a shared content-driven height; these are observed evidence for
that viewport, not fixed responsive targets. No runtime console errors were
observed.

Backgammon perspective/ownership, mobile destination latency, and Undo/dice
semantics were registered as `BUG-011` through `BUG-013` in
`docs/platform-foundation-progress.md`. They remain outside this Design System
implementation because they require gameplay-interaction, engine and protocol
evidence.
