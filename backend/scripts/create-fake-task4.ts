/**
 * 创建假的 task 4 用于测试
 * 注意：这只是临时方案，链上数据仍然是损坏的
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const taskId = '4';
  const creatorAddress = '0xA088268e7dBEF49feb03f74e54Cd2EB5F56495db'; // 当前用户
  
  console.log('Creating fake task 4 for testing...\n');
  
  // 获取 creator profile
  const profile = await prisma.profile.findUnique({
    where: { address: creatorAddress },
  });
  
  if (!profile) {
    console.log('❌ Profile not found for', creatorAddress);
    console.log('Please register first');
    return;
  }
  
  console.log('✅ Profile found:', profile.nickname);
  console.log('   Contacts:', profile.contacts);
  
  // 创建 Task
  await prisma.task.upsert({
    where: { taskId },
    update: {},
    create: {
      taskId,
      title: 'Test Task 4 (Fake)',
      description: 'This is a fake task for testing purposes',
      contactsEncryptedPayload: '0x',
      contactsPlaintext: profile.contacts || 'N/A',
      createdAt: Date.now().toString(),
    },
  });
  
  console.log('✅ Task 4 created');
  
  // 创建 ContactKey
  await prisma.contactKey.upsert({
    where: { taskId },
    update: {},
    create: {
      taskId,
      creatorWrappedDEK: profile.contacts || 'N/A',
      helperWrappedDEK: profile.contacts || 'N/A',
    },
  });
  
  console.log('✅ ContactKey created');
  console.log('\n🎉 Fake task 4 created successfully!');
  console.log('Now you can test the decrypt endpoint.');
  console.log('\n⚠️  Note: This is only for testing. The on-chain data is still corrupted.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
