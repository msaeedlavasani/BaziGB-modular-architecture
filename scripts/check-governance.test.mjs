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

write('AGENTS.md', 'AI_CONTEXT_MAP.md docs/aipde/system-governance.md npm run check:governance');
write('AI_CONTEXT_MAP.md', 'ai/CONTROL_PLANE.md ai/VALIDATION_GATE.md');
write('ai/CONTROL_PLANE.md', 'Resource Approval Request Pilot protocol');
write('ai/VALIDATION_GATE.md', 'PASS FAIL NOT RUN BLOCKED');
write('ai/pilots/control-plane-v1.json', JSON.stringify(pilot));
write('docs/aipde/system-governance.md', 'Working layer History layer Off-device layer Elevated Intensive');
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

fs.rmSync(fixtureRoot, { recursive: true, force: true });
console.log('Governance checker tests passed: valid fixture accepted; broken fixture rejected.');
