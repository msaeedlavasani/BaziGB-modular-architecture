import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const baseUrl = process.env.BAZIGB_BROWSER_CANARY_URL;
const reportPath = process.env.BAZIGB_BROWSER_CANARY_REPORT ?? '.local-runtime/browser-canary.json';
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(baseUrl ?? '')) {
  throw new Error('BAZIGB_BROWSER_CANARY_URL must be a loopback HTTP origin.');
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const failures = [];
const routeChecks = {};
const resourceFailures = [];
page.on('console', (message) => {
  if (message.type() === 'error') failures.push({ type: 'console', message: message.text().slice(0, 160) });
});
page.on('requestfailed', (request) => {
  const entry = { type: 'requestfailed', url: new URL(request.url()).pathname, resourceType: request.resourceType(), error: request.failure()?.errorText ?? 'unknown' };
  resourceFailures.push(entry);
  failures.push(entry);
});
page.on('response', (response) => {
  if (response.status() >= 400) {
    const entry = { type: 'http', url: new URL(response.url()).pathname, status: response.status(), resourceType: response.request().resourceType() };
    resourceFailures.push(entry);
    failures.push(entry);
  }
});

const results = {};
const routeTimings = {};
const report = { schemaVersion: '1.0.0', base: 'loopback', results, routeChecks, routeTimings, resourceFailures, failures };
async function checkRoute(path, key, bodyPredicate = (body) => body.trim().length > 0) {
  const started = Date.now();
  try {
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.locator('body').waitFor({ state: 'visible', timeout: 10_000 });
    const body = await page.locator('body').innerText();
    const status = response?.status() ?? 0;
    routeChecks[path] = status === 200 && bodyPredicate(body) ? 'PASS' : 'FAIL';
    routeTimings[path] = { status, elapsedMs: Date.now() - started, bodyBytes: body.length };
    if (status >= 400) failures.push({ type: 'route-http', route: path, status });
  } catch (error) {
    routeChecks[path] = 'FAIL';
    routeTimings[path] = { status: 0, elapsedMs: Date.now() - started };
    failures.push({ type: 'route', route: path, errorCode: error?.name ?? 'UNKNOWN', message: error instanceof Error ? error.message.slice(0, 160) : String(error).slice(0, 160) });
  }
}
try {
  await checkRoute('/fa/lobby', 'lobby');
  results.html = routeChecks['/fa/lobby'];
  results.hydration = routeChecks['/fa/lobby'];
  results.logo = (await page.request.get(`${baseUrl}/brand/logo.svg`)).status() === 200 ? 'PASS' : 'FAIL';
  results.rooms = (await page.request.get(`${baseUrl}/api/rooms`)).status() === 200 ? 'PASS' : 'FAIL';
  await checkRoute('/fa/leaderboard', 'leaderboard');
  results.leaderboard = routeChecks['/fa/leaderboard'];
  await checkRoute('/fa/login', 'login');
  results.login = routeChecks['/fa/login'];
  await checkRoute('/fa/profile', 'profile', (body) => body.trim().length > 0 && !body.includes('Loading...'));
  results.profile = routeChecks['/fa/profile'];
  results.bot = 'NOT_RUN';
  results.createRoom = 'NOT_RUN';
  results.joinRoom = 'NOT_RUN';
  results.realtime = 'NOT_RUN';
  results.consoleNetwork = resourceFailures.length === 0 && failures.filter((failure) => failure.type === 'console').length === 0 ? 'PASS' : 'FAIL';
} catch (error) {
  failures.push(`canary:${error instanceof Error ? error.message.slice(0, 160) : String(error).slice(0, 160)}`);
} finally {
  report.finishedAt = new Date().toISOString();
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report)}\n`);
  await browser.close();
}
if (Object.values(results).includes('FAIL') || failures.length > 0) process.exitCode = 1;
