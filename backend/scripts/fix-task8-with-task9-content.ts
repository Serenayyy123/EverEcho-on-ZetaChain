/**
 * 修复 Task 8：使用 Task 9 的内容
 * 因为链上 Task 9 的 taskURI 指向 /task/8.json
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTask8() {
  console.log('=== 修复 Task 8 ===\n');

  try {
    // 1. 获取 Task 9 的内容
    const task9 = await prisma.task.findUnique({
      where: { taskId: '9' },
    });

    if (!task9) {
      console.log('❌ Task 9 不存在');
      return;
    }

    console.log('Task 9 的内容:');
    console.log(`  title: ${task9.title}`);
    console.log(`  description: ${task9.description}`);
    console.log(`  contactsPlaintext: ${task9.contactsPlaintext}`);
    console.log('');

    // 2. 更新 Task 8
    await prisma.task.update({
      where: { taskId: '8' },
      data: {
        title: task9.title,
        description: task9.description,
        // contactsPlaintext 保持不变（已经是正确的）
      },
    });

    console.log('✅ Task 8 已更新为 Task 9 的内容');
    console.log('');

    // 3. 验证
    const task8 = await prisma.task.findUnique({
      where: { taskId: '8' },
    });

    console.log('更新后的 Task 8:');
    console.log(`  title: ${task8?.title}`);
    console.log(`  description: ${task8?.description}`);
    console.log('');

    console.log('=== 修复完成 ===');
    console.log('现在链上 Task 9 (taskURI=/task/8.json) 会显示正确的内容：');
    console.log(`  "${task9.title}"`);

  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTask8();
