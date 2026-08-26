import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = process.env.AIPDE_ROOT
  ? path.resolve(process.env.AIPDE_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

const requiredFiles = [
  'AGENTS.md',
  'AI_CONTEXT_MAP.md',
  'ai/CONTROL_PLANE.md',
  'ai/SYSTEM_INTEGRATION.md',
  'ai/VALIDATION_GATE.md',
  'docs/aipde/system-governance.md',
  'docs/reports/README.md',
  'ai/pilots/control-plane-v1.json',
  'ai/system-integration-v1.json',
];

const read = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required control-plane file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(absolutePath, 'utf8');
};

for (const file of requiredFiles) read(file);

const agents = read('AGENTS.md');
const contextMap = read('AI_CONTEXT_MAP.md');
const governance = read('docs/aipde/system-governance.md');
const controlPlane = read('ai/CONTROL_PLANE.md');
const systemIntegration = read('ai/SYSTEM_INTEGRATION.md');
const registry = read('docs/reports/README.md');
const pilotText = read('ai/pilots/control-plane-v1.json');
const integrationText = read('ai/system-integration-v1.json');

const requiredWiring = [
  [agents, 'AI_CONTEXT_MAP.md', 'AGENTS must route through AI_CONTEXT_MAP.md'],
  [agents, 'docs/aipde/system-governance.md', 'AGENTS must reference AIPDE Governance'],
  [agents, 'npm run check:governance', 'AGENTS must require the Governance Check'],
  [contextMap, 'ai/CONTROL_PLANE.md', 'Context Map must route to the Control Plane'],
  [contextMap, 'ai/VALIDATION_GATE.md', 'Context Map must route validation'],
  [contextMap, 'ai/SYSTEM_INTEGRATION.md', 'Context Map must route AIPDE work through System Integration'],
  [controlPlane, 'ai/SYSTEM_INTEGRATION.md', 'Control Plane must connect to System Integration'],
  [systemIntegration, 'accepted handoff', 'System Integration must define accepted handoffs'],
  [systemIntegration, 'cross-cutting controls', 'System Integration must define cross-cutting controls'],
  [controlPlane, 'Resource Approval Request', 'Control Plane must define resource approval'],
  [controlPlane, 'Pilot protocol', 'Control Plane must define its Pilot'],
  [governance, 'Working layer', 'Governance must define local working storage'],
  [governance, 'History layer', 'Governance must define Git history storage'],
  [governance, 'Off-device layer', 'Governance must define off-device storage'],
  [governance, 'Elevated', 'Governance must define elevated resource use'],
  [governance, 'Intensive', 'Governance must define intensive resource use'],
];

for (const [content, marker, message] of requiredWiring) {
  if (!content.includes(marker)) failures.push(message);
}

try {
  const pilot = JSON.parse(pilotText);
  const expectedCapabilities = [
    'Product Design',
    'Design System',
    'Engineering',
    'Evaluation and Quality',
    'Governance and Versioning',
    'Continuous Learning',
  ];
  if (pilot.decisionClass !== 'Material') failures.push('Pilot must classify the shared responsive-system change as Material');
  if (pilot.resourceClass !== 'Standard') failures.push('Pilot must begin with Standard resource use');
  if (pilot.firstAction !== 'inspect-shared-control') failures.push('Pilot must inspect the shared control before local patching');
  if (pilot.humanGate !== 'approve-shared-system-change') failures.push('Pilot must stop for approval before a shared-system change');
  for (const capability of expectedCapabilities) {
    if (!pilot.capabilities?.includes(capability)) failures.push(`Pilot is missing capability: ${capability}`);
  }
  if (!pilot.evidence?.includes('regression-fixture')) failures.push('Pilot must require a regression fixture');
  if (pilot.forbiddenFirstAction !== 'page-specific-breakpoint-patch') failures.push('Pilot must reject page-specific breakpoint tuning as the first action');
} catch (error) {
  failures.push(`Pilot JSON is invalid: ${error.message}`);
}

try {
  const integration = JSON.parse(integrationText);
  const requiredCapabilities = [
    'Human Direction',
    'AI Orchestration',
    'Product Discovery',
    'Research and Strategy',
    'Product Design',
    'Design System',
    'Engineering',
    'Security and Privacy',
    'Evaluation and Quality',
    'Delivery and Operations',
    'Governance and Versioning',
    'Cost and Resource Governance',
    'Knowledge Management',
    'Continuous Learning',
  ];
  const requiredStages = ['Discovery', 'Research', 'Strategy', 'Design', 'Engineering', 'Validation', 'Delivery', 'Operations', 'Evolution'];
  const capabilityNames = new Set(integration.capabilities?.map((capability) => capability.name));
  const capabilityIds = new Set(integration.capabilities?.map((capability) => capability.id));
  const stageNames = new Set(integration.lifecycle?.map((stage) => stage.stage));
  const capabilityFields = ['id', 'name', 'purpose', 'inputs', 'outputs', 'evidence', 'aiAuthority', 'humanAuthority', 'escalatesWhen', 'stages'];
  const stageFields = ['stage', 'accountable', 'requiredInput', 'output', 'evidence', 'humanGate', 'receiver', 'rejectWhen'];

  for (const name of requiredCapabilities) {
    if (!capabilityNames.has(name)) failures.push(`System Integration is missing capability: ${name}`);
  }
  if (capabilityNames.size !== (integration.capabilities?.length ?? 0)) failures.push('System Integration capability names must be unique');
  if (capabilityIds.size !== (integration.capabilities?.length ?? 0)) failures.push('System Integration capability ids must be unique');
  for (const capability of integration.capabilities ?? []) {
    for (const field of capabilityFields) {
      const value = capability[field];
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        failures.push(`Capability ${capability.name ?? capability.id ?? 'unknown'} is missing contract field: ${field}`);
      }
    }
  }
  for (const stageName of requiredStages) {
    if (!stageNames.has(stageName)) failures.push(`System Integration is missing lifecycle stage: ${stageName}`);
  }
  if (stageNames.size !== (integration.lifecycle?.length ?? 0)) failures.push('Each lifecycle stage must have exactly one accountable contract');
  for (const stage of integration.lifecycle ?? []) {
    for (const field of stageFields) {
      if (!stage[field]) failures.push(`Lifecycle stage ${stage.stage ?? 'unknown'} is missing handoff field: ${field}`);
    }
    if (stage.accountable && !capabilityIds.has(stage.accountable)) {
      failures.push(`Lifecycle stage ${stage.stage} has unknown accountable capability: ${stage.accountable}`);
    }
    if (stage.receiver && !stageNames.has(stage.receiver)) failures.push(`Lifecycle stage ${stage.stage} has unknown receiver: ${stage.receiver}`);
  }
  for (const capabilityId of integration.crossCuttingRequired ?? []) {
    if (!capabilityIds.has(capabilityId)) failures.push(`System Integration has unknown cross-cutting capability: ${capabilityId}`);
  }
  const fixture = integration.integrationFixture ?? {};
  if (fixture.decisionClass !== 'Material') failures.push('System Integration fixture must be Material');
  if (fixture.resourceClass !== 'Standard') failures.push('System Integration fixture must begin with Standard resources');
  if (fixture.firstGate !== 'approve-protocol-change-plan') failures.push('System Integration fixture must stop before protocol implementation');
  if (fixture.forbiddenShortcut !== 'implement-from-user-symptom-without-protocol-root-analysis') failures.push('System Integration fixture must prohibit symptom-first protocol work');
  for (const stage of requiredStages) {
    if (!fixture.requiredStages?.includes(stage)) failures.push(`System Integration fixture is missing stage: ${stage}`);
  }
  for (const capability of requiredCapabilities.filter((name) => name !== 'Design System')) {
    if (!fixture.requiredCapabilities?.includes(capability)) failures.push(`System Integration fixture is missing capability: ${capability}`);
  }
  for (const requirement of ['explicit-deploy-authority', 'protocol-regression-evidence', 'rollback-or-recovery-proof']) {
    if (!fixture.releaseRequires?.includes(requirement)) failures.push(`System Integration fixture is missing release requirement: ${requirement}`);
  }
  if (fixture.learningDestination !== 'protocol-invariant-and-regression-suite') failures.push('System Integration fixture must close into a protocol learning destination');
} catch (error) {
  failures.push(`System Integration JSON is invalid: ${error.message}`);
}

const reportLinks = [...registry.matchAll(/\]\((\.\/[^)]+\.md)\)/g)].map((match) => match[1]);
for (const link of reportLinks) {
  const target = path.resolve(root, 'docs/reports', link);
  if (!fs.existsSync(target)) failures.push(`Report registry target does not exist: ${link}`);
}

const reportFiles = [];
const collectReports = (directory) => {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) collectReports(target);
    else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') reportFiles.push(target);
  }
};
collectReports(path.join(root, 'docs/reports'));

for (const report of reportFiles) {
  const content = fs.readFileSync(report, 'utf8');
  const relative = path.relative(root, report);
  if (!/^#\s+.+/m.test(content)) failures.push(`Report lacks a title: ${relative}`);
  if (!/Date:/i.test(content)) failures.push(`Report lacks a date: ${relative}`);
  if (!/Status:|Outcome:/i.test(content)) failures.push(`Report lacks status or outcome: ${relative}`);
}

if (failures.length > 0) {
  console.error('Governance check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Governance check passed: ${requiredFiles.length} required files, ${reportLinks.length} registry links, ${reportFiles.length} reports.`);
