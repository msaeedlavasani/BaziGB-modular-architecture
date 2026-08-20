import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const phones = ['09127953603', '09371130585', '09120209862'];
  const result = await prisma.user.updateMany({
    where: { phone: { in: phones } },
    data: { role: 'ADMIN' },
  });
  console.log(`Updated ${result.count} users to ADMIN.`);
  const users = await prisma.user.findMany({
    where: { phone: { in: phones } },
    select: { phone: true, role: true },
  });
  console.log('Current status:', users);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
