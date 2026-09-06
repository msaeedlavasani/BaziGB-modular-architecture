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
  assert.match(source, /PATH=\$\{REMOTE_NODE_ROOT\}\/bin:\/usr\/bin:\/bin/);
  assert.match(source, /npm" run prisma:generate/);
  assert.match(source, /--workspace @bazigb\/server/);
  assert.match(source, /BAZIGB_NPM_REGISTRY must use HTTPS/);
});

test('release controller uses isolated releases and mandatory health checks', () => {
  const source = readFileSync(controllerPath, 'utf8');
  assert.match(source, /ROOT=.*\/srv\/bazigb/);
  assert.match(source, /database_checkpoint/);
  assert.match(source, /bazigb-sqlite-backup/);
  assert.match(readFileSync(backupPath, 'utf8'), /PRAGMA integrity_check/);
  assert.match(source, /--write-out '%\{http_code\}'/);
  assert.match(source, /connection_failure/);
  assert.match(source, /http_404/);
  assert.match(source, /timeout/);
  assert.match(source, /HEALTH_DEADLINE_SECONDS/);
  assert.match(source, /HEALTH_RETRY_SECONDS/);
  assert.match(source, /Generated Prisma client is missing/);
  assert.match(source, /ensure_persistent_link/);
  assert.match(source, /probe_endpoint api/);
  assert.match(source, /probe_endpoint web/);
  assert.match(source, /TRUST_PROXY_HOPS=1/);
  assert.match(source, /prepare_first_cutover/);
  assert.match(source, /restore_legacy_units/);
  assert.match(source, /systemctl daemon-reload/);
  assert.doesNotMatch(source, /\|\|\s*true/);
});

test('canary is bounded, isolated, redacted, and cannot widen deploy-user access', () => {
  const controller = readFileSync(controllerPath, 'utf8');
  const prepare = readFileSync(preparePath, 'utf8');

  assert.match(controller, /canary\|preflight\) canary/);
  assert.match(controller, /Canary must run through the approved root controller/);
  assert.match(controller, /Canary requires exactly RELEASE_ID and LOCK_SHA256/);
  assert.match(controller, /DATABASE_URL=file:\$\{snapshot\}/);
  assert.match(controller, /RuntimeMaxSec=\$\{CANARY_RUNTIME_SECONDS\}/);
  assert.match(controller, /CPUQuota=100%/);
  assert.match(controller, /MemoryMax=512M/);
  assert.match(controller, /TasksMax=128/);
  assert.match(controller, /StandardOutput=null/);
  assert.match(controller, /StandardError=null/);
  assert.match(controller, /9>>"\$\{EVIDENCE_FILE\}"/);
  assert.doesNotMatch(controller, /rm[^\n]*EVIDENCE/);
  assert.doesNotMatch(controller, /cat[^\n]*SHARED[^\n]*\.env/);

  const sudoers = prepare.match(/cat >\/etc\/sudoers\.d\/bazigb-release[\s\S]*?^SUDOERS$/m)?.[0] ?? '';
  assert.match(sudoers, /bazigb-release canary \*/);
  assert.match(sudoers, /bazigb-release preflight \*/);
  assert.doesNotMatch(sudoers, /systemctl|systemd-run|journalctl|\/bin\/cat|\.env|dev\.db/);
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
  const restartCount = join(root, 'restart-count');
  const backup = join(root, 'sqlite-backup');

  mkdirSync(join(candidate, 'apps/server/dist'), { recursive: true });
  mkdirSync(join(candidate, 'node_modules/.prisma/client'), { recursive: true });
  mkdirSync(join(candidate, 'apps/server/prisma'), { recursive: true });
  mkdirSync(join(candidate, 'apps/web/.next/standalone/apps/web'), { recursive: true });
  mkdirSync(previous, { recursive: true });
  mkdirSync(join(root, 'shared/data'), { recursive: true });
  mkdirSync(join(root, 'shared/backups'), { recursive: true });
  mkdirSync(bin);
  writeFileSync(join(candidate, 'package-lock.json'), lock);
  writeFileSync(join(candidate, 'release.manifest'), `release_id=${releaseId}\ngit_revision=${releaseId}\n`);
  writeFileSync(join(candidate, 'apps/server/dist/main.js'), '');
  writeFileSync(join(candidate, 'node_modules/.prisma/client/default.js'), 'generated client');
  writeFileSync(join(candidate, 'apps/web/.next/standalone/apps/web/server.js'), '');
  writeFileSync(join(root, 'shared/.env'), 'NODE_ENV=production\nTRUST_PROXY_HOPS=1\n');
  writeFileSync(join(root, 'shared/data/dev.db'), 'sqlite fixture');
  symlinkSync(previous, join(root, 'current'));

  writeFileSync(backup, '#!/bin/sh\ncp "$1" "$2"\n');
  writeFileSync(join(bin, 'systemctl'), `#!/bin/sh\nif [ "$1" = "restart" ]; then count=0; [ ! -f "${restartCount}" ] || count=$(cat "${restartCount}"); count=$((count + 1)); printf '%s' "$count" > "${restartCount}"; fi\nexit 0\n`);
  writeFileSync(join(bin, 'chown'), '#!/bin/sh\nexit 0\n');
  writeFileSync(
    join(bin, 'curl'),
    `#!/bin/sh\ncount=0\n[ ! -f "${curlCount}" ] || count=$(cat "${curlCount}")\ncount=$((count + 1))\nprintf '%s' "$count" > "${curlCount}"\nrestarts=$(cat "${restartCount}")\nif [ "$restarts" -gt 1 ]; then printf '200'; exit 0; fi\nexit 7\n`,
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
        BAZIGB_HEALTH_MAX_ATTEMPTS: '1',
      },
      encoding: 'utf8',
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /previous release restored/);
    assert.match(result.stderr, /connection_failure/);
    assert.equal(readlinkSync(join(root, 'current')), previous);
    assert.equal(readlinkSync(join(root, 'previous')), previous);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('failed first cutover restores legacy units and leaves no active release pointer', () => {
  const root = mkdtempSync(join(tmpdir(), 'bazigb-first-cutover-test-'));
  const bin = join(root, 'bin');
  const systemd = join(root, 'systemd');
  const legacy = join(root, 'legacy');
  const releaseId = 'abcdef1';
  const candidate = join(root, 'releases', releaseId);
  const lock = '{"lockfileVersion":3}\n';
  const checksum = createHash('sha256').update(lock).digest('hex');
  const curlCount = join(root, 'curl-count');
  const curlUrls = join(root, 'curl-urls');
  const restartCount = join(root, 'restart-count');
  const backup = join(root, 'sqlite-backup');
  const legacyServerUnit = '[Service]\nWorkingDirectory=/opt/bazigb/apps/server\n';
  const legacyWebUnit = '[Service]\nWorkingDirectory=/opt/bazigb/apps/web\n';

  mkdirSync(join(candidate, 'apps/server/dist'), { recursive: true });
  mkdirSync(join(candidate, 'node_modules/.prisma/client'), { recursive: true });
  mkdirSync(join(candidate, 'apps/server/prisma'), { recursive: true });
  mkdirSync(join(candidate, 'apps/web/.next/standalone/apps/web'), { recursive: true });
  mkdirSync(join(root, 'shared/data'), { recursive: true });
  mkdirSync(join(root, 'shared/backups'), { recursive: true });
  mkdirSync(systemd);
  mkdirSync(legacy);
  mkdirSync(bin);
  writeFileSync(join(candidate, 'package-lock.json'), lock);
  writeFileSync(join(candidate, 'release.manifest'), `release_id=${releaseId}\ngit_revision=${releaseId}\n`);
  writeFileSync(join(candidate, 'apps/server/dist/main.js'), '');
  writeFileSync(join(candidate, 'node_modules/.prisma/client/default.js'), 'generated client');
  writeFileSync(join(candidate, 'apps/web/.next/standalone/apps/web/server.js'), '');
  writeFileSync(join(root, 'shared/.env'), 'NODE_ENV=production\nTRUST_PROXY_HOPS=1\n');
  writeFileSync(join(root, 'shared/data/dev.db'), 'sqlite fixture');
  writeFileSync(join(systemd, 'bazigb-server.service'), legacyServerUnit);
  writeFileSync(join(systemd, 'bazigb-web.service'), legacyWebUnit);
  writeFileSync(join(systemd, 'bazigb-server.service.next'), '[Service]\nWorkingDirectory=/srv/bazigb/current/apps/server\n');
  writeFileSync(join(systemd, 'bazigb-web.service.next'), '[Service]\nWorkingDirectory=/srv/bazigb/current/apps/web\n');

  writeFileSync(backup, '#!/bin/sh\ncp "$1" "$2"\n');
  writeFileSync(join(bin, 'systemctl'), `#!/bin/sh\nif [ "$1" = "restart" ]; then count=0; [ ! -f "${restartCount}" ] || count=$(cat "${restartCount}"); count=$((count + 1)); printf '%s' "$count" > "${restartCount}"; fi\nexit 0\n`);
  writeFileSync(join(bin, 'chown'), '#!/bin/sh\nexit 0\n');
  writeFileSync(
    join(bin, 'install'),
    '#!/bin/sh\nif [ "$1" = "-d" ]; then shift; while [ "${1#-}" != "$1" ]; do case "$1" in -m|-o|-g) shift 2;; *) shift;; esac; done; mkdir -p "$1"; else while [ "${1#-}" != "$1" ]; do case "$1" in -m|-o|-g) shift 2;; *) shift;; esac; done; cp "$1" "$2"; fi\n',
  );
  writeFileSync(
    join(bin, 'curl'),
    `#!/bin/sh\nfor arg in "$@"; do case "$arg" in http*) printf '%s\\n' "$arg" >> "${curlUrls}";; esac; done\ncount=0\n[ ! -f "${curlCount}" ] || count=$(cat "${curlCount}")\ncount=$((count + 1))\nprintf '%s' "$count" > "${curlCount}"\nrestarts=$(cat "${restartCount}")\nif [ "$restarts" -gt 1 ]; then printf '200'; exit 0; fi\nexit 7\n`,
  );
  writeFileSync(join(bin, 'mv'), '#!/bin/sh\n[ "$1" = "-Tf" ] && shift\n/bin/mv -f "$1" "$2"\n');
  for (const executable of [
    backup,
    join(bin, 'systemctl'),
    join(bin, 'chown'),
    join(bin, 'install'),
    join(bin, 'curl'),
    join(bin, 'mv'),
  ]) {
    chmodSync(executable, 0o755);
  }

  try {
    const missingEnvironment = spawnSync('bash', [controllerPath.pathname, 'activate', releaseId, checksum], {
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        BAZIGB_RELEASE_ROOT: root,
        BAZIGB_SQLITE_BACKUP: backup,
        BAZIGB_SYSTEMD_ROOT: systemd,
        BAZIGB_LEGACY_ROOT: legacy,
        BAZIGB_HEALTH_MAX_ATTEMPTS: '1',
      },
      encoding: 'utf8',
    });
    assert.notEqual(missingEnvironment.status, 0);
    assert.match(missingEnvironment.stderr, /must load the shared environment file/);
    assert.throws(() => readFileSync(restartCount));

    writeFileSync(join(systemd, 'bazigb-server.service.next'), '[Service]\nWorkingDirectory=/srv/bazigb/current/apps/server\nEnvironmentFile=/srv/bazigb/shared/.env\nEnvironment=PATH=/opt/bazigb-runtime/current/bin:/usr/bin:/bin\nSupplementaryGroups=bazigb-runtime\n');
    const result = spawnSync('bash', [controllerPath.pathname, 'activate', releaseId, checksum], {
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        BAZIGB_RELEASE_ROOT: root,
        BAZIGB_SQLITE_BACKUP: backup,
        BAZIGB_SYSTEMD_ROOT: systemd,
        BAZIGB_LEGACY_ROOT: legacy,
        BAZIGB_HEALTH_MAX_ATTEMPTS: '1',
      },
      encoding: 'utf8',
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /previous release restored/);
    assert.match(result.stderr, /connection_failure/);
    assert.equal(readFileSync(join(systemd, 'bazigb-server.service'), 'utf8'), legacyServerUnit);
    assert.equal(readFileSync(join(systemd, 'bazigb-web.service'), 'utf8'), legacyWebUnit);
    assert.equal(readlinkSync(join(root, `.failed-${releaseId}`)), candidate);
    assert.throws(() => readlinkSync(join(root, 'current')));
    const probedUrls = readFileSync(curlUrls, 'utf8');
    assert.match(probedUrls, /http:\/\/127\.0\.0\.1:3000\/fa\/lobby/);
    assert.match(probedUrls, /http:\/\/127\.0\.0\.1:3000\/lobby/);
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
  mkdirSync(join(candidate, 'node_modules/.prisma/client'), { recursive: true });
  mkdirSync(join(candidate, 'apps/web/.next/standalone/apps/web'), { recursive: true });
  writeFileSync(join(candidate, 'package-lock.json'), lock);
  writeFileSync(join(candidate, 'release.manifest'), `release_id=${releaseId}\ngit_revision=${releaseId}\n`);
  writeFileSync(join(candidate, 'apps/server/dist/main.js'), '');
  writeFileSync(join(candidate, 'node_modules/.prisma/client/default.js'), 'generated client');
  writeFileSync(join(candidate, 'apps/web/.next/standalone/apps/web/server.js'), '');

  try {
    const valid = spawnSync('bash', [controllerPath.pathname, 'verify', releaseId, checksum], {
      env: { ...process.env, BAZIGB_RELEASE_ROOT: root },
      encoding: 'utf8',
    });
    assert.equal(valid.status, 0, valid.stderr);

    writeFileSync(
      join(candidate, 'node_modules/.prisma/client/default.js'),
      'throw new Error("@prisma/client did not initialize yet")',
    );
    const missingPrisma = spawnSync('bash', [controllerPath.pathname, 'verify', releaseId, checksum], {
      env: { ...process.env, BAZIGB_RELEASE_ROOT: root },
      encoding: 'utf8',
    });
    assert.notEqual(missingPrisma.status, 0);
    assert.match(missingPrisma.stderr, /Generated Prisma client is missing/);
    writeFileSync(join(candidate, 'node_modules/.prisma/client/default.js'), 'generated client');

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
  assert.match(source, /NODE_VERSION="24\.20\.0"/);
  assert.match(source, /NODE_ARCHIVE="node-v\$\{NODE_VERSION\}-linux-x64\.tar\.xz"/);
  assert.match(source, /Node\.js archive checksum mismatch/);
  assert.match(source, /pre-cutover-/);
  assert.match(source, /bazigb-sqlite-backup.*checkpoint.*dev\.db/);
  assert.match(source, /\/opt\/bazigb-runtime\/current\/bin\/node/);
  assert.match(source, /EnvironmentFile=\/srv\/bazigb\/shared\/\.env/);
  assert.match(source, /Environment=PATH=\/opt\/bazigb-runtime\/current\/bin:\/usr\/bin:\/bin/);
  assert.match(source, /SupplementaryGroups=bazigb-runtime/);
  assert.match(source, /NoNewPrivileges=true/);
});

test('first cutover rejects a staged server unit without its environment contract', () => {
  const source = readFileSync(controllerPath, 'utf8');
  assert.match(source, /grep -Fxq 'EnvironmentFile=\/srv\/bazigb\/shared\/\.env'/);
  assert.match(source, /Staged server unit must load the shared environment file/);
  assert.match(source, /grep -Fxq 'Environment=PATH=\/opt\/bazigb-runtime\/current\/bin:\/usr\/bin:\/bin'/);
  assert.match(source, /grep -Fxq 'SupplementaryGroups=bazigb-runtime'/);
  assert.match(source, /retain access to the protected runtime group/);
});
