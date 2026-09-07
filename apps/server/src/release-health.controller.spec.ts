import { describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ReleaseHealthController } from './release-health.controller';
import { PrismaService } from './prisma/prisma.service';

describe('ReleaseHealthController', () => {
  it('stays unavailable outside an explicitly scoped release probe', async () => {
    delete process.env.RELEASE_EXPECTED_DATABASE_PATH;
    const controller = new ReleaseHealthController({} as PrismaService);
    await expect(controller.verifyDatabaseTarget()).rejects.toMatchObject({ status: 404 });
  });

  it('reports only an isolated verdict when the effective Prisma target matches', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'release-health-'));
    const database = join(directory, 'snapshot.db');
    writeFileSync(database, '');
    process.env.RELEASE_EXPECTED_DATABASE_PATH = database;
    const prisma = {
      $queryRawUnsafe: vi.fn().mockResolvedValue([
        { name: 'main', file: database },
      ]),
    } as unknown as PrismaService;
    const controller = new ReleaseHealthController(prisma);
    await expect(controller.verifyDatabaseTarget()).resolves.toEqual({
      status: 'ok',
      databaseTarget: 'isolated_snapshot',
    });
    rmSync(directory, { recursive: true });
  });

  it('fails closed when Prisma resolved a different database file', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'release-health-mismatch-'));
    const expected = join(directory, 'snapshot.db');
    const actual = join(directory, 'other.db');
    writeFileSync(expected, '');
    writeFileSync(actual, '');
    process.env.RELEASE_EXPECTED_DATABASE_PATH = expected;
    const prisma = {
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ name: 'main', file: actual }]),
    } as unknown as PrismaService;
    const controller = new ReleaseHealthController(prisma);
    await expect(controller.verifyDatabaseTarget()).rejects.toMatchObject({ status: 503 });
    rmSync(directory, { recursive: true });
  });
});
