/**
 * Seed کاربر اصلی (مدیر/صاحب پلتفرم) در دیتابیس محلی.
 * اجرا با ورودی صریح:
 * SEED_EMAIL=... SEED_USERNAME=... SEED_PASSWORD=... node scripts/seed-user.js
 * اگر کاربر با همین ایمیل وجود داشته باشد فقط رمز را به‌روز می‌کند.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const REQUIRED_SEED_VARIABLES = ['SEED_EMAIL', 'SEED_USERNAME', 'SEED_PASSWORD'];

function readSeedConfig(environment) {
  const missing = REQUIRED_SEED_VARIABLES.filter((name) => {
    const value = environment[name];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(`Missing required seed environment variables: ${missing.join(', ')}`);
  }

  return {
    email: environment.SEED_EMAIL,
    username: environment.SEED_USERNAME,
    password: environment.SEED_PASSWORD,
  };
}

async function seedUser({ environment = process.env, prismaClient, hashPassword = bcrypt.hash } = {}) {
  const { email, username, password } = readSeedConfig(environment);
  const prisma = prismaClient || new PrismaClient();
  try {
    const hashed = await hashPassword(password, 10);
    const user = await prisma.user.upsert({
      where: { email },
      update: { password: hashed },
      create: { email, username, password: hashed, role: 'ADMIN' },
    });
    console.log('User ready:', { email: user.email, username: user.username, role: user.role });
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedUser().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { readSeedConfig, seedUser };
