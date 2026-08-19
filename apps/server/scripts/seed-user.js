/**
 * Seed کاربر اصلی (مدیر/صاحب پلتفرم) در دیتابیس محلی.
 * اجرا:  node scripts/seed-user.js
 * اگر کاربر با همین ایمیل وجود داشته باشد فقط رمز را به‌روز می‌کند.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const EMAIL = process.env.SEED_EMAIL || 'msaeedlavasani@gmail.com';
const USERNAME = process.env.SEED_USERNAME || 'msaeedlavasani';
const PASSWORD = process.env.SEED_PASSWORD || 'BaziGB@2026';

(async () => {
  const prisma = new PrismaClient();
  try {
    const hashed = await bcrypt.hash(PASSWORD, 10);
    const user = await prisma.user.upsert({
      where: { email: EMAIL },
      update: { password: hashed },
      create: { email: EMAIL, username: USERNAME, password: hashed, role: 'ADMIN' },
    });
    console.log('User ready:', { email: user.email, username: user.username, role: user.role });
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
