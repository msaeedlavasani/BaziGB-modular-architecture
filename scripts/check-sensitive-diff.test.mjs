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
const newBranchPush = spawnSync(process.execPath, [checker], {
  encoding: 'utf8',
  env: { ...process.env, BAZIGB_CHANGED_FILES: undefined, BAZIGB_DIFF_BASE: '0000000000000000000000000000000000000000' },
});
if (newBranchPush.status !== 0) throw new Error(`New-branch push base was not normalized: ${newBranchPush.stderr}`);
console.log('Sensitive-diff tests passed: ordinary changes pass; schema/generated changes require explicit authority.');
