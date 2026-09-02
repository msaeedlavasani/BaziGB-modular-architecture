import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = process.env.BAZIGB_DESIGN_ROOT
  ? path.resolve(process.env.BAZIGB_DESIGN_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

const read = (relativePath) => {
  const target = path.join(root, relativePath);
  if (!fs.existsSync(target)) {
    failures.push(`Missing design-system file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(target, 'utf8');
};

const registryText = read('apps/web/src/design-system/registry.json');
const pilotText = read('ai/pilots/design-system-v1.json');
const contract = read('apps/web/src/design-system/layout-contract.ts');
const requiredComponents = ['PageContainer', 'PageStack', 'ResponsiveGrid', 'ActionCard', 'ActionDeck', 'PageHeader', 'Header', 'NavigationItem', 'TrustSeal', 'StatusCluster', 'StatusPill', 'GameCard', 'GameIdentityMark', 'GameSettingsToolbar', 'GameShell'];
const maturityStates = new Set(['Experimental', 'Candidate', 'Stable', 'Deprecated']);

try {
  const registry = JSON.parse(registryText);
  const components = registry.components ?? [];
  const names = new Set(components.map((component) => component.name));

  for (const name of requiredComponents) {
    if (!names.has(name)) failures.push(`Design-system registry is missing component: ${name}`);
  }
  if (names.size !== components.length) failures.push('Design-system component names must be unique');

  for (const component of components) {
    const label = component.name ?? 'unknown';
    for (const field of ['name', 'path', 'maturity', 'responsibility', 'contracts', 'consumers', 'evaluation']) {
      const value = component[field];
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        failures.push(`Design-system component ${label} is missing field: ${field}`);
      }
    }
    if (!maturityStates.has(component.maturity)) failures.push(`Design-system component ${label} has invalid maturity: ${component.maturity}`);
    const source = read(component.path ?? 'missing');
    if (source && !source.includes(label)) failures.push(`Component source does not identify ${label}: ${component.path}`);
    for (const consumer of component.consumers ?? []) {
      const consumerSource = read(consumer);
      if (consumerSource && !consumerSource.includes(label)) failures.push(`Registered consumer does not use ${label}: ${consumer}`);
    }
    if (component.maturity === 'Stable') {
      if ((component.consumers?.length ?? 0) < 2) failures.push(`Stable component ${label} requires at least two consumers`);
      if (!component.evaluation?.includes('automated-regression')) failures.push(`Stable component ${label} requires automated regression evidence`);
      if (!component.evaluation?.includes('rendered-evidence')) failures.push(`Stable component ${label} requires rendered evidence`);
    }
  }
} catch (error) {
  failures.push(`Design-system registry is invalid JSON: ${error.message}`);
}

try {
  const pilot = JSON.parse(pilotText);
  if (pilot.decisionClass !== 'Material') failures.push('Design System Pilot must classify shared controls as Material');
  if (pilot.resourceClass !== 'Standard') failures.push('Design System Pilot must begin with Standard resources');
  if (pilot.rootLayer !== 'design-system-contract-and-conformance-control') failures.push('Design System Pilot must target the root system control');
  if (!['PENDING', 'REJECTED', 'APPROVED_WITH_REFINEMENTS'].includes(pilot.evaluation?.humanVisualGate)) failures.push('Design System Pilot has an invalid human visual gate state');
  if (pilot.evaluation?.humanVisualGate === 'REJECTED' && !pilot.correctionLoop?.acceptanceRule) failures.push('Rejected Design System Pilot must define a correction loop');
  for (const control of ['semantic-layout-contract', 'action-card', 'status-cluster', 'component-maturity-registry', 'fail-closed-design-system-check']) {
    if (!pilot.sharedControls?.includes(control)) failures.push(`Design System Pilot is missing shared control: ${control}`);
  }
  for (const requiredCase of ['game-screen', 'non-game-discovery-and-action']) {
    if (!pilot.acceptanceCases?.some(({ name }) => name === requiredCase)) failures.push(`Design System Pilot is missing acceptance case: ${requiredCase}`);
  }
  if (pilot.renderedMatrix?.some(({ horizontalOverflow }) => horizontalOverflow !== false)) failures.push('Design System Pilot rendered matrix contains horizontal overflow');
  if (pilot.learningDestination !== 'DESIGN_SYSTEM.md-and-executable-component-registry') failures.push('Design System Pilot must close into the canonical contract and registry');
} catch (error) {
  failures.push(`Design System Pilot is invalid JSON: ${error.message}`);
}

for (const marker of ['inlineGutter', 'blockPadding', 'section', 'compact', 'standard', 'action', 'threeSlotTrack', 'publicNavigationTrack', 'gameSurfaceTrack', 'supportInlineSize']) {
  if (!contract.includes(marker)) failures.push(`Layout contract is missing semantic control: ${marker}`);
}

const responsiveGrid = read('apps/web/src/components/layout/ResponsiveGrid.tsx');
if (!responsiveGrid.includes('itemSize')) failures.push('ResponsiveGrid must expose semantic itemSize');
if (responsiveGrid.includes('minItemWidth')) failures.push('ResponsiveGrid must not expose raw minItemWidth geometry');

const gameCard = read('apps/web/src/components/shared/GameCard.tsx');
if (!gameCard.includes("overflow: 'hidden'")) failures.push('GameCard media frame must contain overflow');
if (!gameCard.includes('maxInlineSize')) failures.push('GameCard media must have a logical inline bound');

const gameShell = read('apps/web/src/components/game/GameShell.tsx');
if (!gameShell.includes('gameSurfaceTrack')) failures.push('GameShell must use the shared game surface track');
if (!gameShell.includes('StatusCluster')) failures.push('GameShell must use the shared status composition');
if (!gameShell.includes('StatusPill')) failures.push('GameShell status anatomy must use the direction-safe StatusPill');
if (!gameShell.includes('layoutContract.game.supportInlineSize')) failures.push('GameShell result/support panels must use the shared support track');

const participantStrip = read('apps/web/src/components/game/ParticipantStrip.tsx');
if (!participantStrip.includes('layoutContract.game.supportInlineSize')) failures.push('ParticipantStrip must align to the shared game support track');

const backgammonBoard = read('apps/web/src/components/game/BackgammonBoard.tsx');
if (/minWidth:\s*2[4-9]/.test(backgammonBoard)) failures.push('Backgammon checkers must not declare a narrow-screen pixel minimum');

const ticTacToeBoard = read('apps/web/src/components/game/TicTacToeBoard.tsx');
if (ticTacToeBoard.includes('state.scores')) failures.push('A game board must not repeat score already owned by GameShell');

const header = read('apps/web/src/components/layout/Header.tsx');
if (!header.includes('NavigationItem')) failures.push('Header must use the shared navigation composition');
if (!header.includes('gridTemplateColumns: layoutContract.header.threeSlotTrack')) failures.push('Header must use the exact three-slot layout contract');
if (!header.includes('gridTemplateColumns: layoutContract.header.publicNavigationTrack')) failures.push('Public Header navigation must use two equal full-row segments');
if (!header.includes("borderInlineEnd: '1px solid'")) failures.push('Public Header peer navigation must preserve the subtle center divider');
for (const slot of ['language', 'brand', 'primary-utility']) {
  if (!header.includes(`data-header-slot="${slot}"`)) failures.push(`Header is missing independent slot: ${slot}`);
}
if (!header.includes("messages.navigation.games") || !header.includes("messages.navigation.leaderboard")) failures.push('Public Header peer navigation must expose Games and Leaderboard');
if (!header.includes("'location' as const")) failures.push('A parent global destination must expose location-current semantics on descendant pages');
if (header.includes('role="group"')) failures.push('Header must not place unrelated utility controls in one visual group');
const pageHeader = read('apps/web/src/components/layout/PageHeader.tsx');
if (!pageHeader.includes('parentNavigation') || !pageHeader.includes('parentNavigation.href')) failures.push('PageHeader must own the reusable direct-parent navigation contract');
const footer = read('apps/web/src/components/layout/Footer.tsx');
if (!footer.includes('TrustSeal')) failures.push('Footer must use the resilient trust-seal composition');
if (/display:\s*\{\s*xs:\s*['"]none['"]/.test(footer)) failures.push('Lobby/trust footer links must remain reachable on mobile');
const gameHub = read('apps/web/src/app/games/[gameId]/page.tsx');
if (!gameHub.includes('ActionDeck')) failures.push('Game Hub must use the hierarchical action composition');
if (!gameHub.includes('PageHeader')) failures.push('Game Hub must use the shared page-title hierarchy');
if (!gameHub.includes('parentNavigation={{') || !gameHub.includes('messages.gameHub.backToGames')) failures.push('Game Hub must expose a contextual return to all games while Games remains the active section');
const localGame = read('apps/web/src/app/game/[gameId]/page.tsx');
if (!localGame.includes('GameSettingsToolbar')) failures.push('Local Game must use the shared settings anatomy');
if (!localGame.includes("settingsPresentation={gameId === 'tic-tac-toe' ? 'collapsed'")) failures.push('Tic-tac-toe pilot must keep settings secondary to the board');
if (!localGame.includes('localizedGameHubRoute')) failures.push('Local Game Back must return to the game hub, not skip to Lobby');
if (!localGame.includes('soundService.hasSoundChoice()') || !localGame.includes('messages.sound.consentTitle')) failures.push('Direct local game entry must preserve the explicit sound-choice gate');
if (!ticTacToeBoard.includes("soundService.play('move')")) failures.push('Tic-tac-toe pilot must wire real move feedback to the sound service');
if (!ticTacToeBoard.includes("state.phase !== 'finished'")) failures.push('A terminal Tic-tac-toe transition must prefer the result cue over a stacked move cue');
if (!localGame.includes('markCount === previous.markCount')) failures.push('A robot move must not stack move and your-turn cues in one Tic-tac-toe transition');
const onlineGame = read('apps/web/src/app/play/[roomId]/page.tsx');
if (!onlineGame.includes('soundService.hasSoundChoice()') || !onlineGame.includes('messages.sound.consentTitle')) failures.push('Direct online room entry must preserve the explicit sound-choice gate');
if (!onlineGame.includes('layoutContract.game.supportInlineSize')) failures.push('Online room support panels must align to the shared support track');
if (/maxWidth:\s*(520|620|680)/.test(onlineGame)) failures.push('Online room support panels must not declare competing local widths');
if (/useState\(\(\)\s*=>\s*Date\.now\(\)\)/.test(onlineGame)) failures.push('Online room hydration must not derive initial render state from the wall clock');
if (/const\s+myId\s*=\s*socket\.id/.test(onlineGame)) failures.push('Online room hydration must not read the mutable Socket.IO singleton during render');
const rootLayout = read('apps/web/src/app/layout.tsx');
if (!rootLayout.includes('formatDetection') || !rootLayout.includes('telephone: false')) failures.push('The application shell must prevent mobile auto-formatting from mutating server HTML before hydration');
const soundService = read('apps/web/src/lib/sound-service.ts');
if (!soundService.includes('STORAGE_CONSENT_VERSION_KEY') || !soundService.includes('SOUND_CONSENT_VERSION')) failures.push('Sound consent must distinguish an explicit game-entry choice from legacy mute state');
if (!soundService.includes("this.state.consent !== 'enabled' || !this.hasSoundChoice()")) failures.push('Sound playback must remain blocked until explicit versioned entry consent');
const catalog = read('apps/web/src/lib/game-catalog.ts');
if (catalog.includes('chipSymbol')) failures.push('Game catalog must not define random presentation emoji');

const appRoot = path.join(root, 'apps/web/src/app');
if (fs.existsSync(appRoot)) {
  const scan = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) scan(target);
      else if (/\.tsx?$/.test(entry.name)) {
        const source = fs.readFileSync(target, 'utf8');
        if (/minItemWidth\s*=/.test(source)) failures.push(`Feature page supplies raw repeated-item geometry: ${path.relative(root, target)}`);
      }
    }
  };
  scan(appRoot);
}

if (failures.length > 0) {
  console.error('Design-system check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Design-system check passed: ${requiredComponents.length} required components and executable layout controls are registered.`);
