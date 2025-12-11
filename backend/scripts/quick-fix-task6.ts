/**
 * 快速修复 task 6
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const taskId = '6';
  
  // 检查是否存在
  const task = await prisma.task.findUnique({ where: { taskId } });
  
  if (task) {
    console.log('✅ Task 6 exists:', task.title);
    
    // 检查 ContactKey
    const contactKey = await prisma.contactKey.findUnique({ where: { taskId } });
    
    if (!contactKey) {
      await prisma.contactKey.create({
        data: {
          taskId,
          creatorWrappedDEK: task.contactsPlaintext || '@serena_369y',
          helperWrappedDEK: '',
        },
      });
      console.log('✅ ContactKey created');
    } else {
      console.log('✅ ContactKey already exists');
    }
  } else {
    console.log('❌ Task 6 not found in database');
    console.log('Creating placeholder...');
    
    await prisma.task.create({
      data: {
        taskId,
        title: 'Task 6',
        description: 'Auto-created',
        contactsEncryptedPayload: '0x',
        contactsPlaintext: '@serena_369y',
        createdAt: Date.now().toString(),
      },
    });
    
    await prisma.contactKey.create({
      data: {
        taskId,
        creatorWrappedDEK: '@serena_369y',
        helperWrappedDEK: '',
      },
    });
    
    console.log('✅ Task 6 created');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
