import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const task = await prisma.task.findUnique({
    where: { taskId: '1' },
  });

  console.log('Task 1:', JSON.stringify(task, null, 2));

  if (task) {
    const contactKey = await prisma.contactKey.findUnique({
      where: { taskId: '1' },
    });
    console.log('ContactKey:', JSON.stringify(contactKey, null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
