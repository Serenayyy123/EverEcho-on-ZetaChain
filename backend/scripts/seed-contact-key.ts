/**
 * 为 task 3 创建测试 ContactKey 数据
 * 这是临时脚本，用于测试联系方式解密功能
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const taskId = '2';
  
  // 检查 task 是否存在
  const task = await prisma.task.findUnique({
    where: { taskId },
  });
  
  if (!task) {
    console.log(`Task ${taskId} not found in database`);
    return;
  }
  
  console.log('Task found:', task.title);
  
  // 创建测试 ContactKey
  // 注意：这里使用假的 wrappedDEK，实际应该是加密后的数据
  // 为了测试，我们直接存储明文联系方式
  const contactKey = await prisma.contactKey.upsert({
    where: { taskId },
    update: {
      creatorWrappedDEK: task.contactsPlaintext || 'telegram: @creator_test',
      helperWrappedDEK: task.contactsPlaintext || 'telegram: @creator_test',
    },
    create: {
      taskId,
      creatorWrappedDEK: task.contactsPlaintext || 'telegram: @creator_test',
      helperWrappedDEK: task.contactsPlaintext || 'telegram: @creator_test',
    },
  });
  
  console.log('ContactKey created/updated:', contactKey);
  console.log('\n✅ Test data seeded successfully!');
  console.log('You can now test the decrypt endpoint.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
