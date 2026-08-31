import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const repositoryRoot = process.env.BAZIGB_BRANCH_HEALTH_ROOT
  ? path.resolve(process.env.BAZIGB_BRANCH_HEALTH_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonicalBranch = process.env.BAZIGB_CANONICAL_BRANCH ?? 'codex/release-candidate-preflight';
const mainBranch = process.env.BAZIGB_MAIN_BRANCH ?? 'main';
const staleDays = Number.parseInt(process.env.BAZIGB_STALE_BRANCH_DAYS ?? '30', 10);
const maxAhead = Number.parseInt(process.env.BAZIGB_MAX_MAIN_DIVERGENCE ?? '0', 10);
const asJson = process.argv.includes('--json');
const enforce = process.argv.includes('--enforce');
const inspectRemote = process.argv.includes('--remote');

const git = (args, { allowFailure = false } = {}) => {
  const result = spawnSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' });
  if (result.status !== 0 && !allowFailure) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`);
  }
  return { status: result.status, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
};

const refExists = (ref) => git(['show-ref', '--verify', '--quiet', ref], { allowFailure: true }).status === 0;
const canonicalRef = `refs/heads/${canonicalBranch}`;
const mainRef = `refs/heads/${mainBranch}`;
const remoteTrackingMainRef = `refs/remotes/origin/${mainBranch}`;
const violations = [];
const warnings = [];

if (!refExists(canonicalRef)) violations.push(`Canonical branch is missing: ${canonicalBranch}`);

const activeBranch = git(['symbolic-ref', '--quiet', '--short', 'HEAD'], { allowFailure: true }).stdout || null;
if (!activeBranch) violations.push('The inspected worktree has a detached HEAD');
else if (activeBranch !== canonicalBranch) violations.push(`Active branch ${activeBranch} is not canonical branch ${canonicalBranch}`);

const parseRefs = () => {
  const output = git([
    'for-each-ref',
    '--format=%(refname)\t%(refname:short)\t%(objectname)\t%(committerdate:unix)',
    'refs/heads',
    'refs/remotes',
  ]).stdout;
  if (!output) return [];
  return output.split('\n').map((line) => {
    const [ref, name, tip, committedAt] = line.split('\t');
    return { ref, name, tip, committedAt: Number.parseInt(committedAt, 10) || 0 };
  });
};

const refs = parseRefs();
const remoteResult = inspectRemote ? git(['ls-remote', '--heads', 'origin'], { allowFailure: true }) : null;
const remoteHeads = remoteResult?.status === 0
  ? remoteResult.stdout.split('\n').filter(Boolean).map((line) => {
      const [tip, ref] = line.split(/\s+/);
      return { ref, name: `origin/${ref.replace('refs/heads/', '')}`, tip };
    })
  : [];
if (inspectRemote && remoteResult?.status !== 0) warnings.push(`Remote inventory failed: ${remoteResult.stderr}`);
const remoteMain = remoteHeads.find(({ ref }) => ref === `refs/heads/${mainBranch}`);
const mainComparisonRef = refExists(mainRef)
  ? mainRef
  : refExists(remoteTrackingMainRef)
    ? remoteTrackingMainRef
    : remoteMain && git(['cat-file', '-e', `${remoteMain.tip}^{commit}`], { allowFailure: true }).status === 0
      ? remoteMain.tip
      : null;
if (!mainComparisonRef) violations.push(`Main history is unavailable locally: ${mainBranch}`);
const canonicalTip = refExists(canonicalRef) ? git(['rev-parse', canonicalRef]).stdout : null;
const identicalRemoteTips = canonicalTip
  ? refs.filter(({ ref, tip }) => ref.startsWith('refs/remotes/') && tip === canonicalTip).map(({ name }) => name)
  : [];
if (identicalRemoteTips.length > 1) warnings.push(`Multiple remote branches share the canonical tip: ${identicalRemoteTips.join(', ')}`);
const duplicateRemoteTipGroups = [...remoteHeads.reduce((groups, head) => {
  const names = groups.get(head.tip) ?? [];
  names.push(head.name);
  groups.set(head.tip, names);
  return groups;
}, new Map())]
  .filter(([, names]) => names.length > 1)
  .map(([tip, names]) => ({ tip, names }));
if (duplicateRemoteTipGroups.length > 0) warnings.push(`${duplicateRemoteTipGroups.length} duplicate remote tip group(s) detected`);

let mainDistance = null;
if (refExists(canonicalRef) && mainComparisonRef) {
  const [mainOnly, canonicalOnly] = git(['rev-list', '--left-right', '--count', `${mainComparisonRef}...${canonicalRef}`]).stdout
    .split(/\s+/)
    .map(Number);
  mainDistance = { canonicalBehindMain: mainOnly, canonicalAheadOfMain: canonicalOnly };
  if (mainOnly > 0) violations.push(`Canonical branch is ${mainOnly} commit(s) behind ${mainBranch}`);
  if (canonicalOnly > maxAhead) violations.push(`Canonical branch is ${canonicalOnly} commit(s) ahead of ${mainBranch}; allowed threshold is ${maxAhead}`);
}

const cutoff = Math.floor(Date.now() / 1000) - staleDays * 24 * 60 * 60;
const staleBranches = refs
  .filter(({ name, committedAt }) => name !== canonicalBranch && name !== mainBranch && !name.endsWith('/HEAD') && committedAt < cutoff)
  .map(({ name, tip, committedAt }) => ({ name, tip, committedAt }));
if (staleBranches.length > 0) warnings.push(`${staleBranches.length} branch ref(s) exceed the ${staleDays}-day stale threshold`);

const comparisonRefs = [refExists(canonicalRef) ? canonicalRef : null, mainComparisonRef].filter(Boolean);
const analysisRefs = [...new Map([...refs, ...remoteHeads].map((entry) => [entry.name, entry])).values()];
const excludedComparisonNames = new Set([
  canonicalBranch,
  mainBranch,
  `origin/${canonicalBranch}`,
  `origin/${mainBranch}`,
]);
const uniqueUnmergedCommits = analysisRefs
  .filter(({ name }) => !excludedComparisonNames.has(name) && !name.endsWith('/HEAD'))
  .filter(({ tip }) => git(['cat-file', '-e', `${tip}^{commit}`], { allowFailure: true }).status === 0)
  .map(({ name, ref, tip }) => {
    const args = ['rev-list', '--count', ref.startsWith('refs/remotes/') ? ref : tip];
    if (comparisonRefs.length > 0) args.push('--not', ...comparisonRefs);
    return { name, count: Number.parseInt(git(args).stdout, 10) || 0 };
  })
  .filter(({ count }) => count > 0);
if (uniqueUnmergedCommits.length > 0) warnings.push(`${uniqueUnmergedCommits.length} branch ref(s) contain commits outside canonical and main history`);
const unverifiableRemoteRefs = remoteHeads
  .filter(({ tip }) => git(['cat-file', '-e', `${tip}^{commit}`], { allowFailure: true }).status !== 0)
  .map(({ name, tip }) => ({ name, tip }));
if (unverifiableRemoteRefs.length > 0) warnings.push(`${unverifiableRemoteRefs.length} remote branch tip(s) require an authorized fetch before unique-commit proof`);

const parseWorktrees = () => {
  const blocks = git(['worktree', 'list', '--porcelain']).stdout.split('\n\n').filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split('\n');
    const value = (prefix) => lines.find((line) => line.startsWith(prefix))?.slice(prefix.length) ?? null;
    return {
      path: value('worktree '),
      head: value('HEAD '),
      branch: value('branch ')?.replace('refs/heads/', '') ?? null,
      detached: lines.includes('detached'),
    };
  });
};

const report = {
  status: violations.length === 0 ? 'PASS' : 'FAIL',
  repositoryRoot,
  canonicalBranch,
  activeBranch,
  mainBranch,
  mainComparisonRef,
  mainDistance,
  canonicalTip,
  identicalRemoteTips,
  remoteInventory: inspectRemote ? (remoteResult?.status === 0 ? 'live-ls-remote' : 'failed') : 'local-refs-only',
  duplicateRemoteTipGroups,
  unverifiableRemoteRefs,
  staleThresholdDays: staleDays,
  staleBranches,
  uniqueUnmergedCommits,
  worktrees: parseWorktrees(),
  violations,
  warnings,
  note: 'Remote data reflects locally available refs; run an authorized fetch before consequential cleanup or release decisions.',
};

if (asJson) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`Branch health ${report.status}: canonical=${canonicalBranch}; active=${activeBranch ?? 'detached'}; main=${mainBranch}`);
  if (mainDistance) console.log(`Main distance: ahead=${mainDistance.canonicalAheadOfMain}; behind=${mainDistance.canonicalBehindMain}`);
  console.log(`Identical remote tips: ${identicalRemoteTips.join(', ') || 'none'}`);
  console.log(`Stale refs: ${staleBranches.length}; refs with unique commits: ${uniqueUnmergedCommits.length}; worktrees: ${report.worktrees.length}`);
  for (const violation of violations) console.error(`VIOLATION: ${violation}`);
  for (const warning of warnings) console.warn(`WARNING: ${warning}`);
  console.log(report.note);
}

if (enforce && violations.length > 0) process.exit(1);
