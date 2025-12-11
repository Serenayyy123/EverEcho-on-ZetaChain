/**
 * 测试 chainId 过滤是否正常工作
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const CURRENT_CHAIN_ID = process.env.CHAIN_ID || '84532';

async function testChainIdFiltering() {
  console.log('='.repeat(60));
  console.log('🧪 Testing ChainId Filtering');
  console.log('='.repeat(60));
  console.log(`\nCurrent ChainId: ${CURRENT_CHAIN_ID}`);

  try {
    // 1. 查询所有任务（不过滤 chainId）
    const allTasks = await prisma.task.findMany({
      select: {
        chainId: true,
        taskId: true,
        title: true,
      },
      orderBy: { taskId: 'asc' },
    });
    
    console.log(`\n📊 All Tasks in Database (${allTasks.length}):`)
    allTasks.forEach(task => {
      console.log(`  - Task ${task.taskId} (chainId: ${task.chainId}): "${task.title}"`);
    });

    // 2. 查询当前链的任务（过滤 chainId）
    const currentChainTasks = await prisma.task.findMany({
      where: { chainId: CURRENT_CHAIN_ID },
      select: {
        chainId: true,
        taskId: true,
        title: true,
      },
      orderBy: { taskId: 'asc' },
    });
    
    console.log(`\n🎯 Current Chain Tasks (${currentChainTasks.length}):`)
    currentChainTasks.forEach(task => {
      console.log(`  - Task ${task.taskId} (chainId: ${task.chainId}): "${task.title}"`);
    });

    // 3. 测试单个任务查询
    console.log(`\n🔍 Testing Single Task Query:`);
    const task3 = await prisma.task.findUnique({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId: '3' }
      },
      select: {
        chainId: true,
        taskId: true,
        title: true,
        category: true,
      },
    });
    
    if (task3) {
      console.log(`  ✅ Task 3 found: "${task3.title}" (category: ${task3.category || 'N/A'})`);
    } else {
      console.log(`  ❌ Task 3 not found for chainId ${CURRENT_CHAIN_ID}`);
    }

    // 4. 统计不同链的任务数量
    const chainStats = await prisma.task.groupBy({
      by: ['chainId'],
      _count: {
        taskId: true,
      },
    });
    
    console.log(`\n📈 Tasks by Chain:`);
    chainStats.forEach(stat => {
      const chainName = stat.chainId === '84532' ? 'Base Sepolia' : 
                       stat.chainId === '11155111' ? 'Sepolia' : 
                       `Chain ${stat.chainId}`;
      console.log(`  - ${chainName} (${stat.chainId}): ${stat._count.taskId} tasks`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test Complete');
  console.log('='.repeat(60));
}

testChainIdFiltering();
