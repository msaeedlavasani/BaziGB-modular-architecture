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
page.on('console', (message) => {
  if (message.type() === 'error') failures.push(`console:${message.text().slice(0, 160)}`);
});
page.on('requestfailed', (request) => failures.push(`network:${new URL(request.url()).pathname}`));

const results = {};
const report = { schemaVersion: '1.0.0', base: 'loopback', results, routeChecks, failures };
async function checkRoute(path, key, bodyPredicate = (body) => body.trim().length > 0) {
  try {
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle', timeout: 30_000 });
    const body = await page.locator('body').innerText();
    routeChecks[path] = response?.status() === 200 && bodyPredicate(body) ? 'PASS' : 'FAIL';
  } catch (error) {
    routeChecks[path] = 'FAIL';
    failures.push(`route:${key}:${error instanceof Error ? error.message.slice(0, 160) : String(error).slice(0, 160)}`);
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
  results.consoleNetwork = failures.length === 0 ? 'PASS' : 'FAIL';
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
