import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete ContactKey first (foreign key constraint)
  await prisma.contactKey.deleteMany({
    where: { taskId: '1' },
  });

  // Delete Task
  await prisma.task.delete({
    where: { taskId: '1' },
  });

  console.log('✅ Task 1 deleted');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
