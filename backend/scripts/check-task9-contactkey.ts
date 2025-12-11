import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const contactKey = await prisma.contactKey.findUnique({
    where: { taskId: '9' },
  });
  
  console.log('ContactKey for Task 9:', JSON.stringify(contactKey, null, 2));
  
  await prisma.$disconnect();
}

check();
