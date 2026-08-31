import assert from 'assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checker = path.join(repositoryRoot, 'scripts/check-branch-health.mjs');
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bazigb-branch-health-'));

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { cwd: fixtureRoot, encoding: 'utf8', ...options });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout.trim();
};
const git = (...args) => run('git', args);
const commit = (message, file) => {
  fs.writeFileSync(path.join(fixtureRoot, file), message);
  git('add', file);
  git('commit', '-m', message);
};
const inspect = (...args) => spawnSync(process.execPath, [checker, '--json', ...args], {
  cwd: fixtureRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    BAZIGB_BRANCH_HEALTH_ROOT: fixtureRoot,
    BAZIGB_CANONICAL_BRANCH: 'candidate',
    BAZIGB_MAIN_BRANCH: 'main',
    BAZIGB_STALE_BRANCH_DAYS: '36500',
  },
});

git('init', '-b', 'main');
git('config', 'user.name', 'BaziGB Fixture');
git('config', 'user.email', 'fixture@bazigb.invalid');
commit('base', 'base.txt');
git('switch', '-c', 'candidate');
commit('candidate', 'candidate.txt');
git('update-ref', 'refs/remotes/origin/candidate-copy', 'HEAD');
git('update-ref', 'refs/remotes/origin/historical-copy', 'HEAD');
git('switch', '-c', 'unique');
commit('unique', 'unique.txt');
git('switch', 'candidate');

const reportResult = inspect();
assert.equal(reportResult.status, 0, reportResult.stderr);
const report = JSON.parse(reportResult.stdout);
assert.equal(report.mainDistance.canonicalAheadOfMain, 1, 'candidate divergence must be detected');
assert.deepEqual(report.identicalRemoteTips, ['origin/candidate-copy', 'origin/historical-copy'], 'duplicate remote tips must be detected');
assert.deepEqual(report.uniqueUnmergedCommits, [{ name: 'unique', count: 1 }], 'unique commits must be retained in the report');

const enforced = inspect('--enforce');
assert.equal(enforced.status, 1, 'divergence must fail closed in enforce mode');
assert.match(enforced.stdout, /allowed threshold is 0/);

git('switch', 'main');
git('branch', '-D', 'candidate');
const missingCanonical = inspect('--enforce');
assert.equal(missingCanonical.status, 1, 'missing canonical branch must fail closed');
assert.match(`${missingCanonical.stdout}\n${missingCanonical.stderr}`, /Canonical history is unavailable/);

fs.rmSync(fixtureRoot, { recursive: true, force: true });
console.log('Branch health tests passed: duplicate tips, divergence, unique commits, and missing canonical authority are detected.');
