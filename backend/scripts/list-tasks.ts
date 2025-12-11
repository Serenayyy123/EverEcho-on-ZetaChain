/**
 * 列出数据库中的所有任务
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
  });
  
  console.log(`Found ${tasks.length} tasks in database:\n`);
  
  tasks.forEach((task) => {
    console.log(`Task ID: ${task.taskId}`);
    console.log(`  Title: ${task.title}`);
    console.log(`  Contacts (plaintext): ${task.contactsPlaintext || 'N/A'}`);
    console.log(`  Created: ${task.createdAt}`);
    console.log('');
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
