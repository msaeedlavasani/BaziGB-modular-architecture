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
const requiredComponents = ['PageContainer', 'PageStack', 'ResponsiveGrid', 'ActionCard', 'ActionDeck', 'PageHeader', 'NavigationItem', 'TrustSeal', 'StatusCluster', 'StatusPill', 'GameCard', 'GameIdentityMark', 'GameSettingsToolbar', 'GameShell'];
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
  if (!['PENDING', 'REJECTED'].includes(pilot.evaluation?.humanVisualGate)) failures.push('Candidate Design System Pilot must preserve an unresolved human visual gate');
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

for (const marker of ['inlineGutter', 'blockPadding', 'section', 'compact', 'standard', 'action', 'gameSurfaceTrack']) {
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

const backgammonBoard = read('apps/web/src/components/game/BackgammonBoard.tsx');
if (/minWidth:\s*2[4-9]/.test(backgammonBoard)) failures.push('Backgammon checkers must not declare a narrow-screen pixel minimum');

const ticTacToeBoard = read('apps/web/src/components/game/TicTacToeBoard.tsx');
if (ticTacToeBoard.includes('state.scores')) failures.push('A game board must not repeat score already owned by GameShell');

const header = read('apps/web/src/components/layout/Header.tsx');
if (!header.includes('NavigationItem')) failures.push('Header must use the shared navigation composition');
const footer = read('apps/web/src/components/layout/Footer.tsx');
if (!footer.includes('TrustSeal')) failures.push('Footer must use the resilient trust-seal composition');
const gameHub = read('apps/web/src/app/games/[gameId]/page.tsx');
if (!gameHub.includes('ActionDeck')) failures.push('Game Hub must use the hierarchical action composition');
if (!gameHub.includes('PageHeader')) failures.push('Game Hub must use the shared page-title hierarchy');
const localGame = read('apps/web/src/app/game/[gameId]/page.tsx');
if (!localGame.includes('GameSettingsToolbar')) failures.push('Local Game must use the shared settings anatomy');
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
