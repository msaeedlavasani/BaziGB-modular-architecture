import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checker = path.join(repositoryRoot, 'scripts/check-governance.mjs');
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bazigb-governance-'));

const write = (relativePath, content) => {
  const target = path.join(fixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};

const pilot = {
  decisionClass: 'Material',
  resourceClass: 'Standard',
  firstAction: 'inspect-shared-control',
  forbiddenFirstAction: 'page-specific-breakpoint-patch',
  humanGate: 'approve-shared-system-change',
  capabilities: ['Product Design', 'Design System', 'Engineering', 'Evaluation and Quality', 'Governance and Versioning', 'Continuous Learning'],
  evidence: ['regression-fixture'],
};

const integrationCapabilities = [
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
].map((name, index) => ({
  id: `capability-${index}`,
  name,
  purpose: 'test-purpose',
  inputs: ['test-input'],
  outputs: ['test-output'],
  evidence: ['test-evidence'],
  aiAuthority: ['test-ai-authority'],
  humanAuthority: ['test-human-authority'],
  escalatesWhen: ['test-escalation'],
  stages: ['Discovery'],
}));
const integrationStages = ['Discovery', 'Research', 'Strategy', 'Design', 'Engineering', 'Validation', 'Delivery', 'Operations', 'Evolution']
  .map((stage, index, stages) => ({
    stage,
    accountable: 'capability-0',
    requiredInput: 'test-input',
    output: 'test-output',
    evidence: 'test-evidence',
    humanGate: 'test-gate',
    receiver: stages[(index + 1) % stages.length],
    rejectWhen: 'test-rejection',
  }));
const integration = {
  version: '1.0.0',
  capabilities: integrationCapabilities,
  lifecycle: integrationStages,
  crossCuttingRequired: ['capability-0'],
  integrationFixture: {
    decisionClass: 'Material',
    resourceClass: 'Standard',
    firstGate: 'approve-protocol-change-plan',
    forbiddenShortcut: 'implement-from-user-symptom-without-protocol-root-analysis',
    requiredStages: integrationStages.map(({ stage }) => stage),
    requiredCapabilities: integrationCapabilities.map(({ name }) => name),
    releaseRequires: ['explicit-deploy-authority', 'protocol-regression-evidence', 'rollback-or-recovery-proof'],
    learningDestination: 'protocol-invariant-and-regression-suite',
  },
};

write('AGENTS.md', 'AI_CONTEXT_MAP.md docs/aipde/system-governance.md npm run check:governance');
write('AGENTS.md', 'AI_CONTEXT_MAP.md docs/aipde/system-governance.md npm run check:governance ai/current-state.json ai/work-registry-v1.json ai/retrieval-manifest-v1.json');
write('AI_CONTEXT_MAP.md', 'ai/CONTROL_PLANE.md ai/SYSTEM_INTEGRATION.md ai/VALIDATION_GATE.md ai/current-state.json ai/work-registry-v1.json ai/retrieval-manifest-v1.json');
write('ai/CONTROL_PLANE.md', 'Resource Approval Request Pilot protocol ai/SYSTEM_INTEGRATION.md ai/WORK_MANAGEMENT.md');
write('ai/SYSTEM_INTEGRATION.md', 'accepted handoff cross-cutting controls');
write('ai/VALIDATION_GATE.md', 'PASS FAIL NOT RUN BLOCKED');
write('ai/WORK_MANAGEMENT.md', 'Historical reports are excluded by default. Medium and high work require approval.');
write('ai/pilots/control-plane-v1.json', JSON.stringify(pilot));
write('ai/system-integration-v1.json', JSON.stringify(integration));
write('docs/aipde/system-governance.md', 'Working layer History layer Off-device layer Elevated Intensive ai/work-registry-v1.json');
const categories = ['Product Integrity', 'Security and Trust', 'Product Experience', 'Design System and Brand', 'Platform Architecture', 'Evaluation and Quality', 'Delivery and Operations', 'Governance and Knowledge', 'Evolution'];
const states = ['observed', 'triaged', 'approved', 'in-progress', 'implemented', 'machine-validated', 'human-validation-pending', 'accepted', 'operationally-verified', 'learning-captured', 'blocked', 'deferred', 'rejected', 'superseded', 'reopened'];
const testTask = {id:'TASK-1',title:'Test',category:'Governance and Knowledge',domain:'Test',workstream:'Test',milestone:'m1',outcome:'Test',accountable:'Governance and Versioning',contributors:[],source:[],state:'in-progress',priority:'P0',risk:'test',dependencies:[],scope:[],exclusions:[],acceptance:[],machineEvidence:[],humanEvidence:[],resource:{band:'medium',approved:true},approvalGate:'approved',artifact:[],receiver:'AI Orchestration',learningDestination:'test',related:[]};
write('ai/work-registry-v1.json', JSON.stringify({version:'1.0.0',states,portfolioOrder:categories,milestones:[{id:'m1'}],tasks:[testTask]}));
write('ai/current-state.json', JSON.stringify({version:'1.0.0',updated:'2026-08-27',repository:'test',branch:'test',activeMilestone:'m1',currentGate:{taskId:'TASK-1'},nextProposedTask:'TASK-1',lastValidation:{passed:[]},constraints:[],canonical:{workRegistry:'ai/work-registry-v1.json'}}));
write('ai/retrieval-manifest-v1.json', JSON.stringify({version:'1.0.0',defaultEntry:['AGENTS.md','AI_CONTEXT_MAP.md','ai/current-state.json'],rules:{historicalReportsDefault:'exclude'},routes:['work-state-and-priority','game-rules-change','frontend-or-design-system','security-finding','validation-only','governance-evolution'].map(id=>({id,triggers:['test'],initialSources:['test'],expandTo:['test'],forbiddenDefault:['test']}))}));
write('docs/reports/README.md', '| 2026-08-26 | Test | [Report](./test/report.md) | Status | revision |');
write('docs/reports/test/report.md', '# Test Report\n\n- Date: 2026-08-26\n- Status: test\n');

const run = () => spawnSync(process.execPath, [checker], {
  env: { ...process.env, AIPDE_ROOT: fixtureRoot },
  encoding: 'utf8',
});

const valid = run();
if (valid.status !== 0) {
  console.error(valid.stdout, valid.stderr);
  throw new Error('Expected the valid control-plane fixture to pass');
}

fs.rmSync(path.join(fixtureRoot, 'ai/VALIDATION_GATE.md'));
const invalid = run();
if (invalid.status === 0 || !invalid.stderr.includes('Missing required control-plane file')) {
  console.error(invalid.stdout, invalid.stderr);
  throw new Error('Expected the broken control-plane fixture to fail closed');
}

write('ai/VALIDATION_GATE.md', 'PASS FAIL NOT RUN BLOCKED');
const brokenIntegration = structuredClone(integration);
brokenIntegration.capabilities = brokenIntegration.capabilities.filter(({ name }) => name !== 'Security and Privacy');
write('ai/system-integration-v1.json', JSON.stringify(brokenIntegration));
const invalidIntegration = run();
if (invalidIntegration.status === 0 || !invalidIntegration.stderr.includes('System Integration is missing capability: Security and Privacy')) {
  console.error(invalidIntegration.stdout, invalidIntegration.stderr);
  throw new Error('Expected incomplete System Integration capability coverage to fail closed');
}

write('ai/system-integration-v1.json', JSON.stringify(integration));
write('ai/current-state.json', JSON.stringify({version:'1.0.0',updated:'2026-08-27',repository:'test',branch:'test',activeMilestone:'m1',currentGate:{taskId:'MISSING'},nextProposedTask:'TASK-1',lastValidation:{passed:[]},constraints:[],canonical:{workRegistry:'ai/work-registry-v1.json'}}));
const invalidCurrentState = run();
if (invalidCurrentState.status === 0 || !invalidCurrentState.stderr.includes('Current State has unknown gate task')) {
  console.error(invalidCurrentState.stdout, invalidCurrentState.stderr);
  throw new Error('Expected a Current State pointing at an unknown task to fail closed');
}

write('ai/current-state.json', JSON.stringify({version:'1.0.0',updated:'2026-08-27',repository:'test',branch:'test',activeMilestone:'m1',currentGate:{taskId:'TASK-1'},nextProposedTask:'TASK-1',lastValidation:{passed:[]},constraints:[],canonical:{workRegistry:'ai/work-registry-v1.json'}}));
write('ai/retrieval-manifest-v1.json', JSON.stringify({version:'1.0.0',defaultEntry:['AGENTS.md','AI_CONTEXT_MAP.md','ai/current-state.json'],rules:{historicalReportsDefault:'include'},routes:['work-state-and-priority','game-rules-change','frontend-or-design-system','security-finding','validation-only','governance-evolution'].map(id=>({id,triggers:['test'],initialSources:['test'],expandTo:['test'],forbiddenDefault:['test']}))}));
const invalidRetrieval = run();
if (invalidRetrieval.status === 0 || !invalidRetrieval.stderr.includes('Retrieval Manifest must exclude historical reports by default')) {
  console.error(invalidRetrieval.stdout, invalidRetrieval.stderr);
  throw new Error('Expected an unbounded historical retrieval policy to fail closed');
}

fs.rmSync(fixtureRoot, { recursive: true, force: true });
console.log('Governance checker tests passed: valid fixture accepted; broken files, capability, Current State, and retrieval policy rejected.');
