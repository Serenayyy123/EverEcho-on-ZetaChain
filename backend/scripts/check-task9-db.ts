import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTask9() {
  const task9 = await prisma.task.findUnique({
    where: { taskId: '9' },
  });
  
  console.log('数据库 Task 9:');
  console.log(JSON.stringify(task9, null, 2));
  
  await prisma.$disconnect();
}

checkTask9();
