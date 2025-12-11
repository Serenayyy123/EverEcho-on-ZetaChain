import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const task = await prisma.task.findUnique({
    where: { taskId: '9' },
  });
  
  const contactKey = await prisma.contactKey.findUnique({
    where: { taskId: '9' },
  });
  
  console.log('Task 9:');
  console.log(JSON.stringify(task, null, 2));
  console.log('\nContactKey 9:');
  console.log(JSON.stringify(contactKey, null, 2));
  
  await prisma.$disconnect();
}

main().catch(console.error);
