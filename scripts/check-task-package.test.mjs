import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checker = path.join(root, 'scripts/check-task-package.mjs');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'bazigb-passport-'));
const run = (mode, value) => {
  const file = path.join(temp, `${mode}-${Math.random()}.json`);
  fs.writeFileSync(file, JSON.stringify(value));
  return spawnSync(process.execPath, [checker, mode, file], { encoding: 'utf8' });
};
const passport = {
  schemaVersion: '1.0.0', taskId: 'TEST-001', objective: 'Validate governed delegation', route: 'external-ai',
  dependencyGate: { status: 'READY', taskDependencies: [], evidenceDependencies: [] },
  scopeLock: { allowedPaths: ['ai/**'], forbiddenPaths: ['apps/**'], excludedWork: ['product-code'] },
  resource: { band: 'medium', approved: true, stopWhen: 'approved band exceeded' },
  git: { repository: 'test', branch: 'codex/test', baseRevision: 'abc', worktree: '/tmp/test', allowCommit: false, allowPush: false, allowMerge: false },
  permissionEnvelope: { allowedActions: ['read', 'edit'], network: false, github: false, server: false, database: false, migration: false, dependencies: false, secrets: false, production: false, deploy: false },
  acceptance: ['contract passes'], validation: ['npm test'], stopConditions: ['scope expansion'],
  closure: { receiver: 'Control Tower', requiredDelivery: ['final-report.md', 'delivery-receipt.json'], branchDecision: 'pending-control-tower' },
};
if (run('passport', passport).status !== 0) throw new Error('Valid Passport was rejected');
if (run('passport', { ...passport, dependencyGate: { ...passport.dependencyGate, status: 'BLOCKED' } }).status === 0) throw new Error('Blocked dependency was accepted');
if (run('passport', { ...passport, permissionEnvelope: { ...passport.permissionEnvelope, production: true } }).status === 0) throw new Error('External production access was accepted');
const receipt = {
  schemaVersion: '1.0.0', taskId: 'TEST-001', status: 'FINAL', revision: 1,
  executor: { provider: 'test', model: null }, repository: { path: '/tmp/test', branch: 'codex/test', baseRevision: 'abc', finalRevision: null, gitStatusBefore: 'clean', gitStatusAfter: 'dirty' },
  git: { committed: false, pushed: false, merged: false, deployed: false }, changedFiles: [], validation: [],
  touches: { database: false, schema: false, environment: false, dependencies: false, secrets: false, server: false, github: false, production: false },
  rollback: 'discard isolated worktree', artifacts: [], blockingQuestions: [],
};
if (run('receipt', receipt).status !== 0) throw new Error('Valid receipt was rejected');
if (run('receipt', { ...receipt, git: { ...receipt.git, merged: true } }).status === 0) throw new Error('Forbidden merge was accepted');
console.log('Task package tests passed: valid contracts accepted; blocked dependencies and forbidden authority rejected.');
