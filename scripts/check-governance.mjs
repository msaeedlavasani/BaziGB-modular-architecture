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
  'ai/VALIDATION_GATE.md',
  'docs/aipde/system-governance.md',
  'docs/reports/README.md',
  'ai/pilots/control-plane-v1.json',
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
const registry = read('docs/reports/README.md');
const pilotText = read('ai/pilots/control-plane-v1.json');

const requiredWiring = [
  [agents, 'AI_CONTEXT_MAP.md', 'AGENTS must route through AI_CONTEXT_MAP.md'],
  [agents, 'docs/aipde/system-governance.md', 'AGENTS must reference AIPDE Governance'],
  [agents, 'npm run check:governance', 'AGENTS must require the Governance Check'],
  [contextMap, 'ai/CONTROL_PLANE.md', 'Context Map must route to the Control Plane'],
  [contextMap, 'ai/VALIDATION_GATE.md', 'Context Map must route validation'],
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
