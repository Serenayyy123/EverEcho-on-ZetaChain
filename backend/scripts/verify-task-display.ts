/**
 * 验证任务显示逻辑
 * 前端访问 /task/8 时应该显示什么？
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTaskDisplay() {
  console.log('=== 验证任务显示逻辑 ===\n');

  try {
    console.log('场景 1: 前端访问链上 Task 8');
    console.log('  - 链上 Task 8 的 taskURI: https://api.everecho.io/task/7.json');
    console.log('  - 前端应该调用: GET /api/task/7');
    console.log('  - 应该显示: Task 7 的内容\n');

    const task7 = await prisma.task.findUnique({
      where: { taskId: '7' },
    });

    if (task7) {
      console.log('  数据库 Task 7:');
      console.log(`    title: ${task7.title}`);
      console.log(`    description: ${task7.description}`);
    }

    console.log('\n场景 2: 前端访问链上 Task 9');
    console.log('  - 链上 Task 9 的 taskURI: https://api.everecho.io/task/8.json');
    console.log('  - 前端应该调用: GET /api/task/8');
    console.log('  - 应该显示: Task 8 的内容\n');

    const task8 = await prisma.task.findUnique({
      where: { taskId: '8' },
    });

    if (task8) {
      console.log('  数据库 Task 8:');
      console.log(`    title: ${task8.title}`);
      console.log(`    description: ${task8.description}`);
    }

    console.log('\n场景 3: 前端访问数据库 Task 9');
    console.log('  - 前端调用: GET /api/task/9');
    console.log('  - 应该显示: Task 9 的内容\n');

    const task9 = await prisma.task.findUnique({
      where: { taskId: '9' },
    });

    if (task9) {
      console.log('  数据库 Task 9:');
      console.log(`    title: ${task9.title}`);
      console.log(`    description: ${task9.description}`);
    } else {
      console.log('  ❌ 数据库中不存在 Task 9');
    }

    console.log('\n=== 问题分析 ===');
    console.log('如果前端显示的是 "Task 8 (synced from chain)"，可能的原因：');
    console.log('1. 前端使用了错误的 taskId');
    console.log('2. 数据库中的 Task 8 被错误更新了');
    console.log('3. 前端缓存了旧数据');

  } catch (error) {
    console.error('❌ 验证失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTaskDisplay();
