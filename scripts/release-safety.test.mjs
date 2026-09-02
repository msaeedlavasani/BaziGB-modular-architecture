import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
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
  assert.match(source, /api\/rooms[^\n]+&&/);
  assert.doesNotMatch(source, /\|\|\s*true/);
});

test('failed activation atomically restores the previous release', () => {
  const root = mkdtempSync(join(tmpdir(), 'bazigb-rollback-test-'));
  const bin = join(root, 'bin');
  const releaseId = 'abcdef1';
  const previousId = '1234567';
  const candidate = join(root, 'releases', releaseId);
  const previous = join(root, 'releases', previousId);
  const lock = '{"lockfileVersion":3}\n';
  const checksum = createHash('sha256').update(lock).digest('hex');
  const curlCount = join(root, 'curl-count');
  const backup = join(root, 'sqlite-backup');

  mkdirSync(join(candidate, 'apps/server/dist'), { recursive: true });
  mkdirSync(join(candidate, 'apps/server/prisma'), { recursive: true });
  mkdirSync(join(candidate, 'apps/web/.next/standalone/apps/web'), { recursive: true });
  mkdirSync(previous, { recursive: true });
  mkdirSync(join(root, 'shared/data'), { recursive: true });
  mkdirSync(join(root, 'shared/backups'), { recursive: true });
  mkdirSync(bin);
  writeFileSync(join(candidate, 'package-lock.json'), lock);
  writeFileSync(join(candidate, 'release.manifest'), `release_id=${releaseId}\ngit_revision=${releaseId}\n`);
  writeFileSync(join(candidate, 'apps/server/dist/main.js'), '');
  writeFileSync(join(candidate, 'apps/web/.next/standalone/apps/web/server.js'), '');
  writeFileSync(join(root, 'shared/.env'), 'NODE_ENV=production\n');
  writeFileSync(join(root, 'shared/data/dev.db'), 'sqlite fixture');
  symlinkSync(previous, join(root, 'current'));

  writeFileSync(backup, '#!/bin/sh\ncp "$1" "$2"\n');
  writeFileSync(join(bin, 'systemctl'), '#!/bin/sh\nexit 0\n');
  writeFileSync(join(bin, 'chown'), '#!/bin/sh\nexit 0\n');
  writeFileSync(
    join(bin, 'curl'),
    `#!/bin/sh\ncount=0\n[ ! -f "${curlCount}" ] || count=$(cat "${curlCount}")\ncount=$((count + 1))\nprintf '%s' "$count" > "${curlCount}"\n[ "$count" -gt 1 ]\n`,
  );
  writeFileSync(join(bin, 'mv'), '#!/bin/sh\n[ "$1" = "-Tf" ] && shift\n/bin/mv -f "$1" "$2"\n');
  for (const executable of [
    backup,
    join(bin, 'systemctl'),
    join(bin, 'chown'),
    join(bin, 'curl'),
    join(bin, 'mv'),
  ]) {
    chmodSync(executable, 0o755);
  }

  try {
    const result = spawnSync('bash', [controllerPath.pathname, 'activate', releaseId, checksum], {
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        BAZIGB_RELEASE_ROOT: root,
        BAZIGB_SQLITE_BACKUP: backup,
      },
      encoding: 'utf8',
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /previous release restored/);
    assert.equal(readlinkSync(join(root, 'current')), previous);
    assert.equal(readlinkSync(join(root, 'previous')), previous);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
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
