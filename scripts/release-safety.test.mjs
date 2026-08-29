import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const deployPath = new URL('./deploy.sh', import.meta.url);
const controllerPath = new URL('./bazigb-release', import.meta.url);
const preparePath = new URL('./prepare-release-host.sh', import.meta.url);
const backupPath = new URL('./sqlite-backup.py', import.meta.url);

function runDeploy(env = {}) {
  return spawnSync('bash', [deployPath.pathname], {
    cwd: new URL('..', import.meta.url).pathname,
    env: {
      ...process.env,
      RELEASE_ID: '',
      CANDIDATE_APPROVED: '',
      ACTIVATE_APPROVED: '',
      ...env,
    },
    encoding: 'utf8',
  });
}

test('deploy refuses a missing release identity before network access', () => {
  const result = runDeploy();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /RELEASE_ID is required/);
});

test('deploy refuses path-like release identities', () => {
  const result = runDeploy({ RELEASE_ID: '../../active', CANDIDATE_APPROVED: '../../active' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /7-40 character lowercase Git revision/);
});

test('deploy requires approval for the exact candidate', () => {
  const result = runDeploy({ RELEASE_ID: 'abcdef1', CANDIDATE_APPROVED: 'abcdef2' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CANDIDATE_APPROVED must exactly equal RELEASE_ID/);
});

test('deploy rejects activation approval for a different candidate', () => {
  const result = runDeploy({
    RELEASE_ID: 'abcdef1',
    CANDIDATE_APPROVED: 'abcdef1',
    ACTIVATE_APPROVED: 'abcdef2',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ACTIVATE_APPROVED must be empty or exactly equal RELEASE_ID/);
});

test('deploy preserves pinned SSH trust and avoids root defaults', () => {
  const source = readFileSync(deployPath, 'utf8');
  assert.doesNotMatch(source, /ssh-keygen\s+-R/);
  assert.doesNotMatch(source, /root@193\.151\.153\.204/);
  assert.match(source, /StrictHostKeyChecking=yes/);
  assert.match(source, /bazigb-deploy@193\.151\.153\.204/);
  assert.match(source, /CANDIDATE_APPROVED/);
  assert.match(source, /ACTIVATE_APPROVED/);
  assert.match(source, /https:\/\/package-mirror\.liara\.ir\/repository\/npm\//);
  assert.match(source, /BAZIGB_NPM_REGISTRY must use HTTPS/);
});

test('release controller uses isolated releases and mandatory health checks', () => {
  const source = readFileSync(controllerPath, 'utf8');
  assert.match(source, /ROOT=.*\/srv\/bazigb/);
  assert.match(source, /database_checkpoint/);
  assert.match(source, /bazigb-sqlite-backup/);
  assert.match(readFileSync(backupPath, 'utf8'), /PRAGMA integrity_check/);
  assert.match(source, /curl --fail/);
  assert.doesNotMatch(source, /\|\|\s*true/);
});

test('release verification accepts an intact candidate and rejects lockfile drift', () => {
  const root = mkdtempSync(join(tmpdir(), 'bazigb-release-test-'));
  const releaseId = 'abcdef1';
  const candidate = join(root, 'releases', releaseId);
  const lock = '{"lockfileVersion":3}\n';
  const checksum = createHash('sha256').update(lock).digest('hex');

  mkdirSync(join(candidate, 'apps/server/dist'), { recursive: true });
  mkdirSync(join(candidate, 'apps/web/.next/standalone/apps/web'), { recursive: true });
  writeFileSync(join(candidate, 'package-lock.json'), lock);
  writeFileSync(join(candidate, 'release.manifest'), `release_id=${releaseId}\ngit_revision=${releaseId}\n`);
  writeFileSync(join(candidate, 'apps/server/dist/main.js'), '');
  writeFileSync(join(candidate, 'apps/web/.next/standalone/apps/web/server.js'), '');

  try {
    const valid = spawnSync('bash', [controllerPath.pathname, 'verify', releaseId, checksum], {
      env: { ...process.env, BAZIGB_RELEASE_ROOT: root },
      encoding: 'utf8',
    });
    assert.equal(valid.status, 0, valid.stderr);

    writeFileSync(join(candidate, 'package-lock.json'), `${lock}tampered\n`);
    const tampered = spawnSync('bash', [controllerPath.pathname, 'verify', releaseId, checksum], {
      env: { ...process.env, BAZIGB_RELEASE_ROOT: root },
      encoding: 'utf8',
    });
    assert.notEqual(tampered.status, 0);
    assert.match(tampered.stderr, /checksum mismatch/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('host preparation stages units instead of activating them', () => {
  const source = readFileSync(preparePath, 'utf8');
  assert.match(source, /bazigb-server\.service\.next/);
  assert.match(source, /bazigb-web\.service\.next/);
  assert.doesNotMatch(source, /systemctl\s+(enable|restart|start)/);
  assert.match(source, /User=bazigb-runtime/);
  assert.match(source, /NoNewPrivileges=true/);
});
