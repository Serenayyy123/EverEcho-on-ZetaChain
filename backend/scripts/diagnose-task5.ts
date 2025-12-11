/**
 * 诊断 Task 5 的 500 错误
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Diagnosing Task 5...\n');

  // 1. 检查所有 chainId 下的 task 5
  const allTask5s = await prisma.task.findMany({
    where: { taskId: '5' },
  });

  console.log(`Found ${allTask5s.length} task(s) with taskId=5:`);
  allTask5s.forEach((task) => {
    console.log(`  - chainId: ${task.chainId}, title: ${task.title}`);
  });

  // 2. 检查当前 CHAIN_ID
  const currentChainId = process.env.CHAIN_ID;
  console.log(`\nCurrent CHAIN_ID from env: ${currentChainId}`);

  // 3. 尝试用当前 chainId 查询 task 5
  const task5WithCurrentChain = await prisma.task.findUnique({
    where: {
      chainId_taskId: { chainId: currentChainId!, taskId: '5' },
    },
  });

  if (task5WithCurrentChain) {
    console.log('\n✅ Task 5 exists for current chainId');
    console.log(JSON.stringify(task5WithCurrentChain, null, 2));
  } else {
    console.log('\n❌ Task 5 does NOT exist for current chainId');
    console.log('This is why GET /api/task/5 returns 404 → frontend shows 500');
  }

  // 4. 列出所有 tasks
  const allTasks = await prisma.task.findMany({
    where: { chainId: currentChainId! },
    select: { taskId: true, title: true, chainId: true },
  });

  console.log(`\n📋 All tasks for chainId ${currentChainId}:`);
  allTasks.forEach((task) => {
    console.log(`  - Task ${task.taskId}: ${task.title}`);
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
