import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const checker = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'check-sensitive-diff.mjs');
const run = (files, approved = false) => spawnSync(process.execPath, [checker], {
  encoding: 'utf8',
  env: { ...process.env, BAZIGB_CHANGED_FILES: files.join('\n'), BAZIGB_ALLOW_SENSITIVE_CHANGE: approved ? 'true' : 'false' },
});
if (run(['apps/web/src/page.tsx']).status !== 0) throw new Error('Ordinary source diff was rejected');
if (run(['apps/server/prisma/schema.prisma']).status === 0) throw new Error('Unapproved schema diff was accepted');
if (run(['apps/server/prisma/schema.prisma'], true).status !== 0) throw new Error('Explicitly approved schema diff was rejected');
const scoped = (files, approvedFiles) => spawnSync(process.execPath, [checker], {
  encoding: 'utf8',
  env: {
    ...process.env,
    BAZIGB_CHANGED_FILES: files.join('\n'),
    BAZIGB_ALLOW_SENSITIVE_CHANGE: 'false',
    BAZIGB_APPROVED_SENSITIVE_FILES: approvedFiles.join('\n'),
  },
});
if (scoped(['apps/server/src/prisma/prisma.service.ts'], ['apps/server/src/prisma/prisma.service.ts']).status !== 0) {
  throw new Error('Exact scoped sensitive authority was rejected');
}
if (scoped(['apps/server/prisma/schema.prisma'], ['apps/server/src/prisma/prisma.service.ts']).status === 0) {
  throw new Error('Scoped sensitive authority widened to another file');
}
const newBranchPush = spawnSync(process.execPath, [checker], {
  encoding: 'utf8',
  env: {
    ...process.env,
    BAZIGB_CHANGED_FILES: undefined,
    BAZIGB_DIFF_BASE: '0000000000000000000000000000000000000000',
    // This fixture verifies zero-SHA base normalization only. Sensitive-change
    // rejection is covered independently above and must not couple this case
    // to the repository diff of the branch running the test.
    BAZIGB_ALLOW_SENSITIVE_CHANGE: 'true',
  },
});
if (newBranchPush.status !== 0) throw new Error(`New-branch push base was not normalized: ${newBranchPush.stderr}`);
console.log('Sensitive-diff tests passed: ordinary changes pass; sensitive authority remains exact-file scoped.');
