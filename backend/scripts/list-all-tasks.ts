import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task.findMany({
    select: { taskId: true, title: true, description: true },
    orderBy: { taskId: 'asc' },
  });
  
  console.log('All tasks in database:\n');
  tasks.forEach(t => {
    console.log(`Task ${t.taskId}:`);
    console.log(`  Title: ${t.title}`);
    console.log(`  Description: ${t.description.substring(0, 50)}...`);
    console.log('');
  });
  
  await prisma.$disconnect();
}

main().catch(console.error);
