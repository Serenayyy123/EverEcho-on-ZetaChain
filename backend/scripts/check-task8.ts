import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTask8() {
  try {
    const task = await prisma.task.findFirst({
      where: {
        taskId: '8',
        chainId: '84532'
      }
    });

    console.log('\n=== Task 8 in Database ===');
    if (task) {
      console.log('Found Task 8:');
      console.log('  taskId:', task.taskId);
      console.log('  chainId:', task.chainId);
      console.log('  title:', task.title);
      console.log('  description:', task.description);
      console.log('  category:', task.category);
      console.log('  creator:', task.creator);
      console.log('  createdAt:', task.createdAt);
      console.log('  contactsPlaintext:', task.contactsPlaintext ? 'Yes' : 'No');
    } else {
      console.log('❌ Task 8 NOT FOUND in database');
    }

    // 检查所有任务
    const allTasks = await prisma.task.findMany({
      where: { chainId: '84532' },
      orderBy: { taskId: 'asc' }
    });

    console.log('\n=== All Tasks in Database ===');
    console.log(`Total: ${allTasks.length} tasks`);
    allTasks.forEach(t => {
      console.log(`  Task ${t.taskId}: ${t.title || 'No title'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTask8();
