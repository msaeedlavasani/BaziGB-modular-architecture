import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const taskId = process.argv[2];
if (!taskId) throw new Error('Usage: generate-task-passport.mjs <TASK-ID>');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'ai/work-registry-v1.json'), 'utf8'));
const task = registry.tasks.find(({ id }) => id === taskId);
if (!task) throw new Error(`Unknown Work Registry task: ${taskId}`);
if (!task.execution) throw new Error(`PASSPORT_INCOMPLETE: ${taskId} has no execution contract; route it through the Control Tower first`);

const passport = {
  schemaVersion: '1.0.0',
  taskId: task.id,
  objective: task.outcome,
  route: task.execution.route,
  dependencyGate: task.execution.dependencyGate,
  scopeLock: task.execution.scopeLock,
  resource: { ...task.resource, stopWhen: task.execution.stopWhen },
  git: task.execution.git,
  permissionEnvelope: task.execution.permissionEnvelope,
  acceptance: task.acceptance,
  validation: task.execution.validation,
  evidenceInputs: task.execution.evidenceInputs ?? [],
  expectedOutputs: task.artifact,
  humanGate: task.approvalGate,
  stopConditions: task.execution.stopConditions,
  closure: task.execution.closure,
};
const target = path.join(root, 'ai/exchange/runtime/active', taskId, 'task-passport.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${JSON.stringify(passport, null, 2)}\n`);
console.log(path.relative(root, target));
