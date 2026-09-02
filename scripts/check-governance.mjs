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
  'ai/COLLABORATION_CONTRACT.md',
  'ai/SYSTEM_INTEGRATION.md',
  'ai/WORK_MANAGEMENT.md',
  'ai/VALIDATION_GATE.md',
  'ai/current-state.json',
  'ai/retrieval-manifest-v1.json',
  'ai/work-registry-v1.json',
  'docs/aipde/system-governance.md',
  'docs/reports/README.md',
  'ai/pilots/control-plane-v1.json',
  'ai/pilots/branch-lifecycle-v1.json',
  'ai/system-integration-v1.json',
  'scripts/check-branch-health.mjs',
  'scripts/check-branch-health.test.mjs',
  'ai/exchange/README.md',
  'ai/exchange/schemas/task-passport.schema.json',
  'ai/exchange/schemas/delivery-receipt.schema.json',
  'ai/exchange/templates/execution-prompt.md',
  'ai/exchange/templates/final-report.md',
  'scripts/check-task-package.mjs',
  'scripts/check-task-package.test.mjs',
  'scripts/generate-task-passport.mjs',
  'scripts/check-sensitive-diff.mjs',
  'scripts/check-sensitive-diff.test.mjs',
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
const collaboration = read('ai/COLLABORATION_CONTRACT.md');
const systemIntegration = read('ai/SYSTEM_INTEGRATION.md');
const workManagement = read('ai/WORK_MANAGEMENT.md');
const registry = read('docs/reports/README.md');
const pilotText = read('ai/pilots/control-plane-v1.json');
const branchPilotText = read('ai/pilots/branch-lifecycle-v1.json');
const integrationText = read('ai/system-integration-v1.json');
const currentStateText = read('ai/current-state.json');
const retrievalText = read('ai/retrieval-manifest-v1.json');
const workRegistryText = read('ai/work-registry-v1.json');

const requiredWiring = [
  [agents, 'AI_CONTEXT_MAP.md', 'AGENTS must route through AI_CONTEXT_MAP.md'],
  [agents, 'docs/aipde/system-governance.md', 'AGENTS must reference AIPDE Governance'],
  [agents, 'npm run check:governance', 'AGENTS must require the Governance Check'],
  [agents, 'ai/current-state.json', 'AGENTS must route through Current State'],
  [agents, 'ai/work-registry-v1.json', 'AGENTS must route active work through the Work Registry'],
  [agents, 'ai/retrieval-manifest-v1.json', 'AGENTS must route context through the Retrieval Manifest'],
  [contextMap, 'ai/CONTROL_PLANE.md', 'Context Map must route to the Control Plane'],
  [contextMap, 'ai/VALIDATION_GATE.md', 'Context Map must route validation'],
  [contextMap, 'ai/SYSTEM_INTEGRATION.md', 'Context Map must route AIPDE work through System Integration'],
  [contextMap, 'ai/current-state.json', 'Context Map must begin with Current State'],
  [contextMap, 'ai/work-registry-v1.json', 'Context Map must use the Work Registry for active status'],
  [contextMap, 'ai/retrieval-manifest-v1.json', 'Context Map must use the Retrieval Manifest'],
  [controlPlane, 'ai/SYSTEM_INTEGRATION.md', 'Control Plane must connect to System Integration'],
  [controlPlane, 'ai/WORK_MANAGEMENT.md', 'Control Plane must connect to Work Management'],
  [systemIntegration, 'accepted handoff', 'System Integration must define accepted handoffs'],
  [systemIntegration, 'cross-cutting controls', 'System Integration must define cross-cutting controls'],
  [controlPlane, 'Resource Approval Request', 'Control Plane must define resource approval'],
  [controlPlane, 'Pilot protocol', 'Control Plane must define its Pilot'],
  [governance, 'Working layer', 'Governance must define local working storage'],
  [governance, 'History layer', 'Governance must define Git history storage'],
  [governance, 'Off-device layer', 'Governance must define off-device storage'],
  [governance, 'Elevated', 'Governance must define elevated resource use'],
  [governance, 'Intensive', 'Governance must define intensive resource use'],
  [governance, 'ai/work-registry-v1.json', 'Governance must identify the canonical active Work Registry'],
  [workManagement, 'Historical reports are excluded by default', 'Work Management must exclude historical reports from default retrieval'],
  [workManagement, 'Medium and high work require', 'Work Management must require approval for medium and high resource work'],
  [workManagement, 'Bundled Approval', 'Work Management must define Bundled Approval'],
  [collaboration, 'fetch without prune', 'Collaboration Contract must allow bounded fetch without prune'],
  [collaboration, 'do not fragment that authority into repetitive micro-approvals', 'Collaboration Contract must prohibit micro-approval fragmentation'],
  [collaboration, 'Control Tower', 'Collaboration Contract must define Control Tower ownership'],
  [collaboration, 'OWN_CURRENT', 'Collaboration Contract must classify raw findings before execution'],
  [collaboration, 'Permission Envelope', 'Collaboration Contract must define external permission boundaries'],
  [workManagement, 'PASSPORT_INCOMPLETE', 'Work Management must fail closed for incomplete legacy Passports'],
  [workManagement, 'default WIP limit is one', 'Work Management must define the default WIP limit'],
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
  const branchPilot = JSON.parse(branchPilotText);
  if (branchPilot.rootLayer !== 'branch-lifecycle-and-release-authority-control') failures.push('Branch lifecycle Pilot must identify the shared release-authority control');
  if (branchPilot.decisionClass !== 'Material') failures.push('Branch lifecycle Pilot must be Material');
  if (branchPilot.firstAction !== 'inventory-refs-divergence-unique-commits-and-worktrees') failures.push('Branch lifecycle Pilot must inventory recoverability before action');
  if (branchPilot.forbiddenFirstAction !== 'merge-delete-or-deploy-from-branch-name-assumption') failures.push('Branch lifecycle Pilot must reject consequential action inferred from a branch name');
  if (branchPilot.humanGate !== 'approve-canonical-branch-and-cleanup-plan') failures.push('Branch lifecycle Pilot must require human approval for canonical authority and cleanup');
  for (const evidence of ['duplicate-tip-fixture', 'divergence-threshold-fixture', 'unique-commit-retention-check']) {
    if (!branchPilot.evidence?.includes(evidence)) failures.push(`Branch lifecycle Pilot is missing evidence: ${evidence}`);
  }
  for (const requirement of ['one-identified-immutable-revision', 'explicit-deploy-authority', 'separate-cleanup-authority']) {
    if (!branchPilot.releaseRequires?.includes(requirement)) failures.push(`Branch lifecycle Pilot is missing release requirement: ${requirement}`);
  }
} catch (error) {
  failures.push(`Branch lifecycle Pilot JSON is invalid: ${error.message}`);
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

let workRegistry;
try {
  workRegistry = JSON.parse(workRegistryText);
  const requiredCategories = [
    'Product Integrity', 'Security and Trust', 'Product Experience',
    'Design System and Brand', 'Platform Architecture', 'Evaluation and Quality',
    'Delivery and Operations', 'Governance and Knowledge', 'Evolution',
  ];
  const requiredStates = [
    'observed', 'triaged', 'approved', 'in-progress', 'implemented',
    'machine-validated', 'human-validation-pending', 'accepted',
    'operationally-verified', 'learning-captured', 'blocked', 'deferred',
    'rejected', 'superseded', 'reopened',
  ];
  const taskFields = [
    'id', 'title', 'category', 'domain', 'workstream', 'milestone', 'outcome',
    'accountable', 'contributors', 'source', 'state', 'priority', 'risk',
    'dependencies', 'scope', 'exclusions', 'acceptance', 'machineEvidence',
    'humanEvidence', 'resource', 'approvalGate', 'artifact', 'receiver',
    'learningDestination', 'related',
  ];
  for (const category of requiredCategories) {
    if (!workRegistry.portfolioOrder?.includes(category)) failures.push(`Work Registry is missing portfolio category: ${category}`);
  }
  for (const state of requiredStates) {
    if (!workRegistry.states?.includes(state)) failures.push(`Work Registry is missing task state: ${state}`);
  }
  const taskIds = new Set();
  const milestoneIds = new Set(workRegistry.milestones?.map(({ id }) => id));
  for (const task of workRegistry.tasks ?? []) {
    if (taskIds.has(task.id)) failures.push(`Work Registry task id must be unique: ${task.id}`);
    taskIds.add(task.id);
    for (const field of taskFields) {
      if (task[field] === undefined || task[field] === '') failures.push(`Work Registry task ${task.id ?? 'unknown'} is missing field: ${field}`);
    }
    if (!requiredCategories.includes(task.category)) failures.push(`Work Registry task ${task.id} has unknown category: ${task.category}`);
    if (!requiredStates.includes(task.state)) failures.push(`Work Registry task ${task.id} has unknown state: ${task.state}`);
    if (!['P0', 'P1', 'P2', 'P3'].includes(task.priority)) failures.push(`Work Registry task ${task.id} has invalid priority: ${task.priority}`);
    if (!milestoneIds.has(task.milestone)) failures.push(`Work Registry task ${task.id} has unknown milestone: ${task.milestone}`);
    if (!['low', 'medium', 'high'].includes(task.resource?.band)) failures.push(`Work Registry task ${task.id} has invalid resource band`);
    if ((task.resource?.band === 'medium' || task.resource?.band === 'high') && typeof task.resource?.approved !== 'boolean') {
      failures.push(`Work Registry task ${task.id} must record approval for medium/high resource use`);
    }
  }
  if (taskIds.size === 0) failures.push('Work Registry must contain tasks');
} catch (error) {
  failures.push(`Work Registry JSON is invalid: ${error.message}`);
}

try {
  const currentState = JSON.parse(currentStateText);
  for (const field of ['version', 'updated', 'repository', 'branch', 'activeMilestone', 'currentGate', 'lastValidation', 'constraints', 'canonical']) {
    if (!currentState[field]) failures.push(`Current State is missing field: ${field}`);
  }
  if (workRegistry && !workRegistry.milestones?.some(({ id }) => id === currentState.activeMilestone)) {
    failures.push(`Current State has unknown active milestone: ${currentState.activeMilestone}`);
  }
  if (workRegistry && !workRegistry.tasks?.some(({ id }) => id === currentState.currentGate?.taskId)) {
    failures.push(`Current State has unknown gate task: ${currentState.currentGate?.taskId}`);
  }
  if (workRegistry && !workRegistry.tasks?.some(({ id }) => id === currentState.nextProposedTask)) {
    failures.push(`Current State has unknown next proposed task: ${currentState.nextProposedTask}`);
  }
} catch (error) {
  failures.push(`Current State JSON is invalid: ${error.message}`);
}

try {
  const retrieval = JSON.parse(retrievalText);
  for (const entry of ['AGENTS.md', 'AI_CONTEXT_MAP.md', 'ai/current-state.json']) {
    if (!retrieval.defaultEntry?.includes(entry)) failures.push(`Retrieval Manifest default entry is missing: ${entry}`);
  }
  if (retrieval.rules?.historicalReportsDefault !== 'exclude') failures.push('Retrieval Manifest must exclude historical reports by default');
  const routeIds = new Set();
  for (const route of retrieval.routes ?? []) {
    if (!route.id || routeIds.has(route.id)) failures.push(`Retrieval route id must be present and unique: ${route.id ?? 'missing'}`);
    routeIds.add(route.id);
    for (const field of ['triggers', 'initialSources', 'expandTo', 'forbiddenDefault']) {
      if (!Array.isArray(route[field]) || route[field].length === 0) failures.push(`Retrieval route ${route.id ?? 'unknown'} is missing non-empty ${field}`);
    }
  }
  for (const requiredRoute of ['work-state-and-priority', 'game-rules-change', 'frontend-or-design-system', 'security-finding', 'validation-only', 'governance-evolution']) {
    if (!routeIds.has(requiredRoute)) failures.push(`Retrieval Manifest is missing route: ${requiredRoute}`);
  }
} catch (error) {
  failures.push(`Retrieval Manifest JSON is invalid: ${error.message}`);
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
