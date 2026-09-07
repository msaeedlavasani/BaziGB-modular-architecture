import { chromium } from '@playwright/test';

const baseUrl = process.env.BAZIGB_BROWSER_CANARY_URL;
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(baseUrl ?? '')) {
  throw new Error('BAZIGB_BROWSER_CANARY_URL must be a loopback HTTP origin.');
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const failures = [];
page.on('console', (message) => {
  if (message.type() === 'error') failures.push(`console:${message.text().slice(0, 160)}`);
});
page.on('requestfailed', (request) => failures.push(`network:${new URL(request.url()).pathname}`));

const results = {};
try {
  const response = await page.goto(`${baseUrl}/fa/lobby`, { waitUntil: 'networkidle', timeout: 30_000 });
  results.html = response?.status() === 200 ? 'PASS' : 'FAIL';
  results.hydration = (await page.locator('body').innerText()).trim().length > 0 ? 'PASS' : 'FAIL';
  results.logo = (await page.request.get(`${baseUrl}/brand/logo.svg`)).status() === 200 ? 'PASS' : 'FAIL';
  results.rooms = (await page.request.get(`${baseUrl}/api/rooms`)).status() === 200 ? 'PASS' : 'FAIL';
  results.leaderboard = (await page.goto(`${baseUrl}/fa/leaderboard`, { waitUntil: 'networkidle', timeout: 30_000 }))?.status() === 200 ? 'PASS' : 'FAIL';
  results.login = (await page.goto(`${baseUrl}/fa/login`, { waitUntil: 'networkidle', timeout: 30_000 }))?.status() === 200 ? 'PASS' : 'FAIL';
  results.profile = (await page.goto(`${baseUrl}/fa/profile`, { waitUntil: 'networkidle', timeout: 30_000 }))?.status() === 200 ? 'PASS' : 'FAIL';
  results.bot = 'NOT_RUN';
  results.createRoom = 'NOT_RUN';
  results.joinRoom = 'NOT_RUN';
  results.realtime = 'NOT_RUN';
  results.consoleNetwork = failures.length === 0 ? 'PASS' : 'FAIL';
  process.stdout.write(`${JSON.stringify({ schemaVersion: '1.0.0', base: 'loopback', results, failures })}\n`);
  if (Object.values(results).includes('FAIL')) process.exitCode = 1;
} finally {
  await browser.close();
}
