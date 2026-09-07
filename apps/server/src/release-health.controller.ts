import {
  Controller,
  Get,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { realpath } from 'node:fs/promises';
import { PrismaService } from './prisma/prisma.service';

type DatabaseEntry = { name: string; file: string };

@Controller('release-health')
export class ReleaseHealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async verifyDatabaseTarget() {
    const expected = process.env.RELEASE_EXPECTED_DATABASE_PATH;
    if (!expected) throw new NotFoundException();

    const databases = await this.prisma.$queryRawUnsafe<DatabaseEntry[]>(
      'PRAGMA database_list',
    );
    const actual = databases.find((entry) => entry.name === 'main')?.file;
    if (!actual || (await realpath(actual)) !== (await realpath(expected))) {
      throw new ServiceUnavailableException('database_target_mismatch');
    }
    return { status: 'ok', databaseTarget: 'isolated_snapshot' };
  }
}
