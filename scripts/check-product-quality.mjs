#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifestPath = resolve(root, 'product-quality-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const failures = [];
const report = {
  schemaVersion: manifest.schemaVersion,
  gate: 'PRODUCT_QUALITY',
  component: 'inventory-and-release-contract',
  commit: process.env.GITHUB_SHA ?? 'local',
  checks: [],
  failures,
  nextSafeAction: 'inspect the first failed check and its evidence before changing code',
};

function check(id, ok, details, nextSafeAction = report.nextSafeAction) {
  const result = { id, status: ok ? 'PASS' : 'FAIL', ...details };
  report.checks.push(result);
  if (!ok) failures.push({ ...result, nextSafeAction });
}

assert.ok(Array.isArray(manifest.routes) && manifest.routes.length > 0);
for (const route of manifest.routes) {
  check(`route:${route.id}`, existsSync(resolve(root, route.source)), {
    gate: 'PRODUCT_INVENTORY', component: 'frontend-route', route: route.path,
    source: route.source, errorCode: 'ROUTE_SOURCE_MISSING',
  });
}
for (const api of manifest.api) {
  check(`api:${api.id}`, existsSync(resolve(root, api.source)), {
    gate: 'PRODUCT_INVENTORY', component: 'backend-api', route: `${api.method} ${api.path}`,
    source: api.source, errorCode: 'API_SOURCE_MISSING',
  });
}
for (const game of manifest.games) {
  check(`game:${game.id}`, existsSync(resolve(root, game.source)), {
    gate: 'PRODUCT_INVENTORY', component: 'game-package', route: game.id,
    source: game.source, errorCode: 'GAME_SOURCE_MISSING',
  });
}
const schemaPath = resolve(root, manifest.database.schema);
check('database:schema', existsSync(schemaPath), {
  gate: 'DATABASE_CONTRACT', component: 'prisma-schema', source: manifest.database.schema,
  errorCode: 'SCHEMA_SOURCE_MISSING',
});
for (const journey of manifest.journeys) {
  const allowed = String(journey.status).split('|');
  check(`journey:${journey.id}`, allowed.length >= 2 && allowed.includes('PASS') && allowed.includes('FAIL'), {
    gate: 'PRODUCT_CONTRACT', component: 'journey-definition', route: journey.id,
    errorCode: 'JOURNEY_STATUS_CONTRACT_INVALID',
    limitation: allowed.includes('NOT_RUN') ? 'NOT_RUN is visible and must block required acceptance' : undefined,
  });
}
const reportPath = process.env.BAZIGB_PRODUCT_REPORT ?? '';
const browserReportPath = process.env.BAZIGB_BROWSER_CANARY_REPORT ?? '';
if (browserReportPath) {
  check('browser:report', existsSync(browserReportPath), {
    gate: 'PRODUCT_ACCEPTANCE', component: 'browser-canary-report',
    source: browserReportPath, errorCode: 'BROWSER_REPORT_MISSING',
  });
  if (existsSync(browserReportPath)) {
    const browserReport = JSON.parse(readFileSync(browserReportPath, 'utf8'));
    for (const route of manifest.routes.filter((item) => item.required === 'html' || item.required === 'hydration')) {
      const status = browserReport.routeChecks?.[route.path] ?? 'NOT_RUN';
      check(`browser:route:${route.id}`, status === 'PASS', {
        gate: 'PRODUCT_ACCEPTANCE', component: 'browser-route', route: route.path,
        status, errorCode: status === 'NOT_RUN' ? 'REQUIRED_ROUTE_NOT_RUN' : 'REQUIRED_ROUTE_NOT_PASS',
        nextSafeAction: `run or repair ${route.path}; do not treat ${status} as release success`,
      });
    }
    const results = browserReport.results ?? {};
    for (const journey of manifest.journeys.filter((item) => item.required)) {
      const status = results[journey.id] ?? results[journey.id.replaceAll('-', '')] ?? 'NOT_RUN';
      check(`runtime:${journey.id}`, status === 'PASS', {
        gate: 'PRODUCT_ACCEPTANCE', component: 'required-journey', route: journey.id,
        status, errorCode: status === 'NOT_RUN' ? 'REQUIRED_JOURNEY_NOT_RUN' : 'REQUIRED_JOURNEY_NOT_PASS',
        nextSafeAction: `run or repair the ${journey.id} journey; do not treat ${status} as release success`,
      });
    }
  }
}

if (reportPath) {
  mkdirSync(resolve(reportPath, '..'), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
