import { describe, expect, it } from 'vitest';

// The production script is CommonJS so it can run directly with Node.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { readSeedConfig, seedUser } = require('../scripts/seed-user.js') as {
  readSeedConfig: (environment: Record<string, string | undefined>) => {
    email: string;
    username: string;
    password: string;
  };
  seedUser: (options: {
    environment: Record<string, string>;
    prismaClient: {
      user: { upsert: (input: unknown) => Promise<{ email: string; username: string; role: string }> };
      $disconnect: () => Promise<void>;
    };
    hashPassword: (password: string, rounds: number) => Promise<string>;
  }) => Promise<void>;
};

describe('seed user configuration', () => {
  const validEnvironment = {
    SEED_EMAIL: 'owner@example.test',
    SEED_USERNAME: 'platform-owner',
    SEED_PASSWORD: 'explicit-test-password',
  };

  it.each(['SEED_EMAIL', 'SEED_USERNAME', 'SEED_PASSWORD'])('fails closed when %s is missing', (name) => {
    const environment = { ...validEnvironment, [name]: undefined };

    expect(() => readSeedConfig(environment)).toThrow(`Missing required seed environment variables: ${name}`);
  });

  it('rejects whitespace-only values instead of treating them as explicit credentials', () => {
    expect(() => readSeedConfig({ ...validEnvironment, SEED_PASSWORD: '   ' })).toThrow(
      'Missing required seed environment variables: SEED_PASSWORD',
    );
  });

  it('preserves explicitly supplied credentials for the existing seed workflow', () => {
    expect(readSeedConfig(validEnvironment)).toEqual({
      email: validEnvironment.SEED_EMAIL,
      username: validEnvironment.SEED_USERNAME,
      password: validEnvironment.SEED_PASSWORD,
    });
  });

  it('preserves the existing upsert behavior when every credential is explicit', async () => {
    const upsertCalls: unknown[] = [];
    const hashedInputs: Array<[string, number]> = [];
    let disconnected = false;
    const prismaClient = {
      user: {
        upsert: async (input: unknown) => {
          upsertCalls.push(input);
          return { email: validEnvironment.SEED_EMAIL, username: validEnvironment.SEED_USERNAME, role: 'ADMIN' };
        },
      },
      $disconnect: async () => {
        disconnected = true;
      },
    };
    const hashPassword = async (password: string, rounds: number) => {
      hashedInputs.push([password, rounds]);
      return 'hashed-explicit-password';
    };

    await seedUser({ environment: validEnvironment, prismaClient, hashPassword });

    expect(hashedInputs).toEqual([[validEnvironment.SEED_PASSWORD, 10]]);
    expect(upsertCalls).toEqual([
      {
        where: { email: validEnvironment.SEED_EMAIL },
        update: { password: 'hashed-explicit-password' },
        create: {
          email: validEnvironment.SEED_EMAIL,
          username: validEnvironment.SEED_USERNAME,
          password: 'hashed-explicit-password',
          role: 'ADMIN',
        },
      },
    ]);
    expect(disconnected).toBe(true);
  });
});
