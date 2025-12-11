/**
 * 检查 task 4 的数据
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking task 4...\n');
  
  // 检查 Task
  const task = await prisma.task.findUnique({
    where: { taskId: '4' },
  });
  
  if (!task) {
    console.log('❌ Task 4 not found in database');
  } else {
    console.log('✅ Task 4 found:');
    console.log('  Title:', task.title);
    console.log('  Contacts (plaintext):', task.contactsPlaintext || 'N/A');
  }
  
  // 检查 ContactKey
  const contactKey = await prisma.contactKey.findUnique({
    where: { taskId: '4' },
  });
  
  if (!contactKey) {
    console.log('\n❌ ContactKey for task 4 not found');
    console.log('This is why the decrypt endpoint returns 404');
  } else {
    console.log('\n✅ ContactKey found:');
    console.log('  creatorWrappedDEK:', contactKey.creatorWrappedDEK.slice(0, 30) + '...');
    console.log('  helperWrappedDEK:', contactKey.helperWrappedDEK || 'N/A');
  }
  
  // 列出所有任务
  console.log('\n📋 All tasks in database:');
  const allTasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
  });
  allTasks.forEach(t => {
    console.log(`  - Task ${t.taskId}: ${t.title}`);
  });
  
  // 列出所有 ContactKeys
  console.log('\n🔑 All ContactKeys in database:');
  const allKeys = await prisma.contactKey.findMany();
  allKeys.forEach(k => {
    console.log(`  - Task ${k.taskId}`);
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
