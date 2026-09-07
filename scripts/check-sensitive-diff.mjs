import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const supplied = process.env.BAZIGB_CHANGED_FILES;
const requestedBase = process.env.BAZIGB_DIFF_BASE ?? 'origin/main';
const base = /^0{40}$/.test(requestedBase) ? 'origin/main' : requestedBase;
const changed = supplied !== undefined
  ? supplied.split('\n').filter(Boolean)
  : (() => {
      const result = spawnSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: root, encoding: 'utf8' });
      if (result.status !== 0) throw new Error(result.stderr.trim() || `Cannot compare ${base}...HEAD`);
      return result.stdout.trim().split('\n').filter(Boolean);
    })();

const sensitive = changed.filter((file) =>
  /(^|\/)(prisma|migrations?)(\/|$)/i.test(file)
  || /(^|\/)(generated)(\/|$)/i.test(file)
  || /schema\.(prisma|sql|graphql)$/i.test(file));

const approvedSensitiveFiles = new Set(
  (process.env.BAZIGB_APPROVED_SENSITIVE_FILES ?? '').split('\n').filter(Boolean),
);
const scopedAuthority = sensitive.length > 0
  && sensitive.every((file) => approvedSensitiveFiles.has(file));
const authorityGranted = process.env.BAZIGB_ALLOW_SENSITIVE_CHANGE === 'true' || scopedAuthority;

if (sensitive.length > 0 && !authorityGranted) {
  console.error('Sensitive diff requires an explicitly approved Task Passport:');
  for (const file of sensitive) console.error(`- ${file}`);
  process.exit(1);
}
console.log(`Sensitive-diff check passed: ${sensitive.length} sensitive file(s), authority=${authorityGranted ? 'granted' : 'not-needed'}.`);
