import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checker = path.join(repositoryRoot, 'scripts/check-design-system.mjs');
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bazigb-design-system-'));

const write = (relativePath, content) => {
  const target = path.join(fixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};

const componentNames = ['PageContainer', 'PageStack', 'ResponsiveGrid', 'ActionCard', 'ActionDeck', 'PageHeader', 'Header', 'NavigationItem', 'TrustSeal', 'StatusCluster', 'StatusPill', 'GameCard', 'GameIdentityMark', 'GameSettingsToolbar', 'GameShell'];
const componentPaths = {
  PageContainer: 'apps/web/src/components/layout/PageContainer.tsx',
  PageStack: 'apps/web/src/components/layout/PageStack.tsx',
  ResponsiveGrid: 'apps/web/src/components/layout/ResponsiveGrid.tsx',
  ActionCard: 'apps/web/src/components/shared/ActionCard.tsx',
  ActionDeck: 'apps/web/src/components/layout/ActionDeck.tsx',
  PageHeader: 'apps/web/src/components/layout/PageHeader.tsx',
  Header: 'apps/web/src/components/layout/Header.tsx',
  NavigationItem: 'apps/web/src/components/layout/NavigationItem.tsx',
  TrustSeal: 'apps/web/src/components/layout/TrustSeal.tsx',
  StatusCluster: 'apps/web/src/components/shared/StatusCluster.tsx',
  StatusPill: 'apps/web/src/components/shared/StatusPill.tsx',
  GameCard: 'apps/web/src/components/shared/GameCard.tsx',
  GameIdentityMark: 'apps/web/src/components/game/GameIdentityMark.tsx',
  GameSettingsToolbar: 'apps/web/src/components/game/GameSettingsToolbar.tsx',
  GameShell: 'apps/web/src/components/game/GameShell.tsx',
};
const consumers = Object.fromEntries(componentNames.map((name) => [name, `apps/web/src/app/${name}.tsx`]));
const registry = {
  version: '1.0.0',
  maturityModel: ['Experimental', 'Candidate', 'Stable', 'Deprecated'],
  components: componentNames.map((name) => ({
    name,
    path: componentPaths[name],
    maturity: 'Candidate',
    responsibility: 'test responsibility',
    contracts: ['test-contract'],
    consumers: [consumers[name]],
    evaluation: ['static-contract'],
  })),
};

write('apps/web/src/design-system/registry.json', JSON.stringify(registry));
write('ai/pilots/design-system-v1.json', JSON.stringify({
  decisionClass: 'Material',
  resourceClass: 'Standard',
  rootLayer: 'design-system-contract-and-conformance-control',
  evaluation: { humanVisualGate: 'PENDING' },
  sharedControls: ['semantic-layout-contract', 'action-card', 'status-cluster', 'component-maturity-registry', 'fail-closed-design-system-check'],
  acceptanceCases: [{ name: 'game-screen' }, { name: 'non-game-discovery-and-action' }],
  renderedMatrix: [{ horizontalOverflow: false }],
  learningDestination: 'DESIGN_SYSTEM.md-and-executable-component-registry',
}));
write('apps/web/src/design-system/layout-contract.ts', 'inlineGutter blockPadding section compact standard action threeSlotTrack publicNavigationTrack gameSurfaceTrack supportInlineSize');
for (const name of componentNames) {
  let source = `export const ${name} = '${name}';`;
  if (name === 'ResponsiveGrid') source += ' itemSize';
  if (name === 'GameCard') source += " overflow: 'hidden' maxInlineSize";
  if (name === 'GameShell') source += ' gameSurfaceTrack StatusCluster StatusPill layoutContract.game.supportInlineSize';
  if (name === 'PageHeader') source += ' parentNavigation parentNavigation.href';
  if (name === 'Header') source += " NavigationItem gridTemplateColumns: layoutContract.header.threeSlotTrack gridTemplateColumns: layoutContract.header.publicNavigationTrack borderInlineEnd: '1px solid' data-header-slot=\"language\" data-header-slot=\"brand\" data-header-slot=\"primary-utility\" messages.navigation.games messages.navigation.leaderboard 'location' as const";
  write(componentPaths[name], source);
  write(consumers[name], `import '${name}';`);
}
write('apps/web/src/components/layout/Footer.tsx', "TrustSeal display: 'block'");
write('apps/web/src/components/game/ParticipantStrip.tsx', 'ParticipantStrip layoutContract.game.supportInlineSize');
write('apps/web/src/app/games/[gameId]/page.tsx', 'PageContainer PageStack ActionCard ActionDeck PageHeader GameIdentityMark parentNavigation={{ messages.gameHub.backToGames');
write('apps/web/src/app/game/[gameId]/page.tsx', "GameShell GameSettingsToolbar localizedGameHubRoute settingsPresentation={gameId === 'tic-tac-toe' ? 'collapsed' soundService.hasSoundChoice() messages.sound.consentTitle markCount === previous.markCount");
write('apps/web/src/app/play/[roomId]/page.tsx', 'soundService.hasSoundChoice() messages.sound.consentTitle layoutContract.game.supportInlineSize');
write('apps/web/src/lib/sound-service.ts', "STORAGE_CONSENT_VERSION_KEY SOUND_CONSENT_VERSION this.state.consent !== 'enabled' || !this.hasSoundChoice()");
write('apps/web/src/lib/game-catalog.ts', 'catalog without presentation symbols');
write('apps/web/src/components/game/BackgammonBoard.tsx', 'fluid checker containment');
write('apps/web/src/components/game/TicTacToeBoard.tsx', "board without duplicate result soundService.play('move') state.phase !== 'finished'");

const run = () => spawnSync(process.execPath, [checker], {
  env: { ...process.env, BAZIGB_DESIGN_ROOT: fixtureRoot },
  encoding: 'utf8',
});

const valid = run();
if (valid.status !== 0) {
  console.error(valid.stdout, valid.stderr);
  throw new Error('Expected valid design-system fixture to pass');
}

const broken = structuredClone(registry);
broken.components = broken.components.filter(({ name }) => name !== 'StatusCluster');
write('apps/web/src/design-system/registry.json', JSON.stringify(broken));
const invalid = run();
if (invalid.status === 0 || !invalid.stderr.includes('Design-system registry is missing component: StatusCluster')) {
  console.error(invalid.stdout, invalid.stderr);
  throw new Error('Expected missing composite component to fail closed');
}

fs.rmSync(fixtureRoot, { recursive: true, force: true });
console.log('Design-system checker tests passed: valid fixture accepted; missing composite component rejected.');
