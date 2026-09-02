import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const supplied = process.env.BAZIGB_CHANGED_FILES;
const base = process.env.BAZIGB_DIFF_BASE ?? 'origin/main';
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

if (sensitive.length > 0 && process.env.BAZIGB_ALLOW_SENSITIVE_CHANGE !== 'true') {
  console.error('Sensitive diff requires an explicitly approved Task Passport:');
  for (const file of sensitive) console.error(`- ${file}`);
  process.exit(1);
}
console.log(`Sensitive-diff check passed: ${sensitive.length} sensitive file(s), authority=${process.env.BAZIGB_ALLOW_SENSITIVE_CHANGE === 'true' ? 'granted' : 'not-needed'}.`);
