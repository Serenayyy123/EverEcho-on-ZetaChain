/**
 * 直接创建 task 3 的测试数据
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const taskId = '3';
  
  // 创建任务
  const task = await prisma.task.upsert({
    where: { taskId },
    update: {},
    create: {
      taskId,
      title: 'Test Task 3',
      description: 'This is a test task for contacts decryption',
      contactsEncryptedPayload: '0x',
      contactsPlaintext: 'telegram: @alice_web3',
      createdAt: Date.now().toString(),
    },
  });
  
  console.log('Task created:', task);
  
  // 创建 ContactKey
  const contactKey = await prisma.contactKey.upsert({
    where: { taskId },
    update: {
      creatorWrappedDEK: 'telegram: @alice_web3',
      helperWrappedDEK: 'telegram: @alice_web3',
    },
    create: {
      taskId,
      creatorWrappedDEK: 'telegram: @alice_web3',
      helperWrappedDEK: 'telegram: @alice_web3',
    },
  });
  
  console.log('ContactKey created:', contactKey);
  console.log('\n✅ Task 3 created successfully!');
  console.log('Now you can test the decrypt endpoint with task 3.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
