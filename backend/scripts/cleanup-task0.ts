/**
 * 清理 Task 0（不应该存在）
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  try {
    console.log('\n🧹 Cleaning up Task 0...\n');

    // 删除 Task 0
    const task0 = await prisma.task.findUnique({
      where: { taskId: '0' },
    });

    if (task0) {
      await prisma.task.delete({
        where: { taskId: '0' },
      });
      console.log('✅ Task 0 deleted');
    } else {
      console.log('⚠️  Task 0 not found');
    }

    // 删除 ContactKey 0
    const contactKey0 = await prisma.contactKey.findUnique({
      where: { taskId: '0' },
    });

    if (contactKey0) {
      await prisma.contactKey.delete({
        where: { taskId: '0' },
      });
      console.log('✅ ContactKey 0 deleted');
    } else {
      console.log('⚠️  ContactKey 0 not found');
    }

    console.log('\n✅ Cleanup completed\n');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
