#!/usr/bin/env node

import { closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtimeDirectory = join(repositoryRoot, '.local-runtime');
const statePath = join(runtimeDirectory, 'state.json');
const nodeExecutable = process.execPath;
const isWindows = process.platform === 'win32';

const services = {
  server: {
    cwd: join(repositoryRoot, 'apps/server'),
    script: join(repositoryRoot, 'node_modules/@nestjs/cli/bin/nest.js'),
    args: ['start', '--watch'],
    healthUrl: 'http://127.0.0.1:3001/api/rooms',
    publicUrl: 'http://localhost:3001/api/rooms',
    logPath: join(runtimeDirectory, 'server.log'),
    env: {
      PORT: '3001',
      NODE_OPTIONS: appendNodeOption(process.env.NODE_OPTIONS, '--experimental-require-module'),
    },
  },
  web: {
    cwd: join(repositoryRoot, 'apps/web'),
    script: join(repositoryRoot, 'node_modules/next/dist/bin/next'),
    args: ['dev', '-p', '3000'],
    healthUrl: 'http://127.0.0.1:3000/fa/lobby',
    publicUrl: 'http://localhost:3000/fa/lobby',
    logPath: join(runtimeDirectory, 'web.log'),
    env: {},
  },
};

function appendNodeOption(current, option) {
  const options = (current ?? '').split(/\s+/).filter(Boolean);
  if (!options.includes(option)) options.push(option);
  return options.join(' ');
}

function readState() {
  if (!existsSync(statePath)) return { version: 1, services: {} };
  try {
    return JSON.parse(readFileSync(statePath, 'utf8'));
  } catch {
    return { version: 1, services: {} };
  }
}

function writeState(state) {
  mkdirSync(runtimeDirectory, { recursive: true });
  const temporaryPath = `${statePath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`);
  renameSync(temporaryPath, statePath);
}

function isAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function processMatches(pid, expectedScript) {
  if (!isAlive(pid)) return false;
  if (isWindows) return true;
  const result = spawnSync('ps', ['-p', String(pid), '-o', 'command='], { encoding: 'utf8' });
  return result.status === 0 && result.stdout.includes(expectedScript);
}

async function healthy(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    return response.ok;
  } catch {
    return false;
  }
}

function runPreflight() {
  const steps = [
    ['Building shared game packages', ['run', 'build:packages']],
    ['Generating the local Prisma client', ['run', 'prisma:generate', '-w', '@bazigb/server']],
  ];

  for (const [label, args] of steps) {
    process.stdout.write(`${label}…\n`);
    const result = spawnSync('npm', args, {
      cwd: repositoryRoot,
      env: process.env,
      stdio: 'inherit',
    });
    if (result.status !== 0) throw new Error(`${label} failed.`);
  }
}

function spawnService(name, definition) {
  if (!existsSync(definition.script)) {
    throw new Error(`${name} runtime is missing. Run npm install first.`);
  }

  mkdirSync(runtimeDirectory, { recursive: true });
  const log = openSync(definition.logPath, 'a');
  const child = spawn(nodeExecutable, [definition.script, ...definition.args], {
    cwd: definition.cwd,
    detached: !isWindows,
    env: { ...process.env, ...definition.env },
    stdio: ['ignore', log, log],
  });
  child.unref();
  closeSync(log);
  return child.pid;
}

async function waitForHealth(name, definition, pid, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await healthy(definition.healthUrl)) return;
    if (!isAlive(pid)) throw new Error(`${name} stopped during startup. See ${definition.logPath}`);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
  }
  throw new Error(`${name} did not become healthy. See ${definition.logPath}`);
}

async function stopRecordedService(name, record) {
  const definition = services[name];
  if (!definition || !record?.pid || !isAlive(record.pid)) return;
  if (!processMatches(record.pid, definition.script)) {
    process.stderr.write(`Refusing to stop PID ${record.pid}: it is not the recorded ${name} runtime.\n`);
    return;
  }

  const target = isWindows ? record.pid : -record.pid;
  try {
    process.kill(target, 'SIGTERM');
  } catch {
    return;
  }

  const deadline = Date.now() + 8000;
  while (Date.now() < deadline && isAlive(record.pid)) {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 200));
  }
  if (isAlive(record.pid)) {
    try {
      process.kill(target, 'SIGKILL');
    } catch {
      // The process exited between the liveness check and the signal.
    }
  }
}

async function stop() {
  const state = readState();
  await Promise.all(Object.entries(state.services ?? {}).map(([name, record]) => stopRecordedService(name, record)));
  if (existsSync(statePath)) unlinkSync(statePath);
  process.stdout.write('Local BaziGB runtime stopped.\n');
}

async function status({ quiet = false } = {}) {
  const state = readState();
  const result = {};
  for (const [name, definition] of Object.entries(services)) {
    const record = state.services?.[name];
    result[name] = {
      alive: Boolean(record?.pid && processMatches(record.pid, definition.script)),
      healthy: await healthy(definition.healthUrl),
      url: definition.publicUrl,
      log: definition.logPath,
    };
  }

  if (!quiet) {
    for (const [name, serviceStatus] of Object.entries(result)) {
      process.stdout.write(`${name}: ${serviceStatus.healthy ? 'healthy' : serviceStatus.alive ? 'starting' : 'stopped'} — ${serviceStatus.url}\n`);
    }
  }
  return result;
}

async function start() {
  mkdirSync(runtimeDirectory, { recursive: true });
  const before = await status({ quiet: true });
  if (Object.values(before).every((serviceStatus) => serviceStatus.healthy)) {
    process.stdout.write('Local BaziGB runtime is already healthy.\n');
    await status();
    return;
  }

  const staleState = readState();
  await Promise.all(Object.entries(staleState.services ?? {}).map(([name, record]) => stopRecordedService(name, record)));
  runPreflight();

  const state = { version: 1, repositoryRoot, startedAt: new Date().toISOString(), services: {} };
  try {
    for (const [name, definition] of Object.entries(services)) {
      const pid = spawnService(name, definition);
      state.services[name] = { pid, script: definition.script, startedAt: new Date().toISOString() };
      writeState(state);
    }
    await Promise.all(Object.entries(services).map(([name, definition]) => waitForHealth(name, definition, state.services[name].pid)));
  } catch (error) {
    await Promise.all(Object.entries(state.services).map(([name, record]) => stopRecordedService(name, record)));
    if (existsSync(statePath)) unlinkSync(statePath);
    throw error;
  }

  process.stdout.write('Local BaziGB runtime is ready and detached from this terminal.\n');
  await status();
}

const command = process.argv[2] ?? 'start';
try {
  if (command === 'start') await start();
  else if (command === 'stop') await stop();
  else if (command === 'restart') {
    await stop();
    await start();
  } else if (command === 'status') {
    const result = await status();
    if (Object.values(result).some((serviceStatus) => !serviceStatus.healthy)) process.exitCode = 1;
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
