import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = process.env.BAZIGB_TASK_ROOT
  ? path.resolve(process.env.BAZIGB_TASK_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [mode, input, baseArg] = process.argv.slice(2);

const fail = (messages) => {
  console.error(`Task package ${mode ?? 'check'} failed:`);
  for (const message of messages) console.error(`- ${message}`);
  process.exit(1);
};
const load = (file) => JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8'));
const requireFields = (object, fields, label, failures) => {
  for (const field of fields) if (object?.[field] === undefined || object?.[field] === '') failures.push(`${label} is missing ${field}`);
};
const matchesPath = (file, pattern) => pattern.endsWith('/**')
  ? file === pattern.slice(0, -3) || file.startsWith(pattern.slice(0, -2))
  : file === pattern || file.startsWith(`${pattern}/`);

if (!['passport', 'receipt', 'scope'].includes(mode) || !input) {
  fail(['Usage: check-task-package.mjs passport|receipt|scope <json> [base-revision]']);
}

let data;
try { data = load(input); } catch (error) { fail([`Invalid JSON or path: ${error.message}`]); }
const failures = [];

if (mode === 'passport' || mode === 'scope') {
  requireFields(data, ['schemaVersion', 'taskId', 'objective', 'route', 'dependencyGate', 'scopeLock', 'resource', 'git', 'permissionEnvelope', 'acceptance', 'validation', 'stopConditions', 'closure'], 'Passport', failures);
  if (data.schemaVersion !== '1.0.0') failures.push('Passport schemaVersion must be 1.0.0');
  if (!['internal-specialist', 'external-ai'].includes(data.route)) failures.push('Passport route is invalid');
  if (data.dependencyGate?.status !== 'READY') failures.push('Dependency gate must be READY before execution');
  for (const dependency of data.dependencyGate?.evidenceDependencies ?? []) {
    requireFields(dependency, ['taskId', 'artifact', 'path', 'checksum', 'requiredStatus'], 'Evidence dependency', failures);
    if (dependency.requiredStatus !== 'ACCEPTED') failures.push(`Evidence dependency ${dependency.taskId ?? 'unknown'} is not ACCEPTED`);
  }
  if (!(data.scopeLock?.allowedPaths?.length > 0)) failures.push('Scope lock needs allowedPaths');
  if (!['low', 'medium', 'high'].includes(data.resource?.band)) failures.push('Resource band is invalid');
  if (['medium', 'high'].includes(data.resource?.band) && data.resource?.approved !== true) failures.push('Medium/high Passport requires resource approval');
  requireFields(data.git, ['repository', 'branch', 'baseRevision', 'worktree', 'allowCommit', 'allowPush', 'allowMerge'], 'Git contract', failures);
  requireFields(data.permissionEnvelope, ['allowedActions', 'network', 'github', 'server', 'database', 'migration', 'dependencies', 'secrets', 'production', 'deploy'], 'Permission envelope', failures);
  if (data.route === 'external-ai') {
    if (data.git?.allowMerge) failures.push('External AI may not receive merge authority');
    if (data.permissionEnvelope?.production || data.permissionEnvelope?.deploy || data.permissionEnvelope?.secrets) failures.push('External AI Passport cannot grant production, deploy, or secret access');
  }
  if (!(data.acceptance?.length > 0) || !(data.validation?.length > 0) || !(data.stopConditions?.length > 0)) failures.push('Acceptance, validation, and stopConditions must be non-empty');
}

if (mode === 'receipt') {
  requireFields(data, ['schemaVersion', 'taskId', 'status', 'revision', 'executor', 'repository', 'git', 'changedFiles', 'validation', 'touches', 'rollback', 'artifacts', 'blockingQuestions'], 'Receipt', failures);
  if (!['IN_PROGRESS', 'INTERIM_BLOCKED', 'FINAL'].includes(data.status)) failures.push('Receipt status is invalid');
  requireFields(data.git, ['committed', 'pushed', 'merged', 'deployed'], 'Receipt Git evidence', failures);
  requireFields(data.touches, ['database', 'schema', 'environment', 'dependencies', 'secrets', 'server', 'github', 'production'], 'Receipt touch evidence', failures);
  if (data.git?.merged || data.git?.deployed) failures.push('External delivery receipt reports forbidden merge or deploy');
  if (data.touches?.production || data.touches?.secrets) failures.push('External delivery receipt reports forbidden production or secret access');
  if (data.status === 'FINAL' && (data.blockingQuestions ?? []).some(({ answer }) => !answer)) failures.push('FINAL receipt has unanswered blocking questions');
}

if (mode === 'scope' && failures.length === 0) {
  const branch = spawnSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).stdout.trim();
  if (branch !== data.git.branch) failures.push(`Active branch ${branch} does not match Passport branch ${data.git.branch}`);
  const base = baseArg ?? data.git.baseRevision;
  const result = spawnSync('git', ['diff', '--name-only', base], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) failures.push(result.stderr.trim() || `Cannot compare working state against ${base}`);
  else {
    const untracked = spawnSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' });
    if (untracked.status !== 0) failures.push(untracked.stderr.trim() || 'Cannot inventory untracked files');
    const files = [...new Set(`${result.stdout}\n${untracked.stdout}`.trim().split('\n').filter(Boolean))];
    for (const file of files) {
      if (!(data.scopeLock.allowedPaths ?? []).some((pattern) => matchesPath(file, pattern))) failures.push(`Changed file is outside allowedPaths: ${file}`);
      if ((data.scopeLock.forbiddenPaths ?? []).some((pattern) => matchesPath(file, pattern))) failures.push(`Changed file matches forbiddenPaths: ${file}`);
    }
  }
}

if (failures.length > 0) fail(failures);
console.log(`Task package ${mode} passed for ${data.taskId}.`);
