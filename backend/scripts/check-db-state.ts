/**
 * 检查数据库状态
 * 验证 chainId 隔离是否正确
 */

import { PrismaClient } from '@prisma/client';
import { getCurrentChainId } from '../src/config/chainConfig';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const CURRENT_CHAIN_ID = getCurrentChainId();

async function checkDbState() {
  console.log('='.repeat(60));
  console.log('💾 Database State Check');
  console.log('='.repeat(60));

  try {
    console.log('\n📋 Configuration:');
    console.log(`  CURRENT_CHAIN_ID: ${CURRENT_CHAIN_ID}`);

    // 1. 检查所有任务（按 chainId 分组）
    console.log('\n📊 Tasks by chainId:');
    
    const tasksByChain = await prisma.task.groupBy({
      by: ['chainId'],
      _count: true,
    });
    
    for (const group of tasksByChain) {
      console.log(`  Chain ${group.chainId}: ${group._count} tasks`);
    }

    // 2. 检查当前链的任务
    console.log(`\n📋 Tasks on current chain (${CURRENT_CHAIN_ID}):`);
    
    const currentChainTasks = await prisma.task.findMany({
      where: { chainId: CURRENT_CHAIN_ID },
      select: {
        taskId: true,
        title: true,
        creator: true,
      },
      orderBy: { taskId: 'asc' },
    });
    
    console.log(`  Total: ${currentChainTasks.length} tasks`);
    currentChainTasks.forEach(task => {
      console.log(`    Task ${task.taskId}: "${task.title}" (creator: ${task.creator || 'null'})`);
    });

    // 3. 检查其他链的任务
    const otherChainTasks = await prisma.task.findMany({
      where: { chainId: { not: CURRENT_CHAIN_ID } },
      select: {
        chainId: true,
        taskId: true,
        title: true,
      },
      orderBy: [{ chainId: 'asc' }, { taskId: 'asc' }],
    });
    
    if (otherChainTasks.length > 0) {
      console.log(`\n📋 Tasks on other chains:`);
      otherChainTasks.forEach(task => {
        console.log(`    Chain ${task.chainId}, Task ${task.taskId}: "${task.title}"`);
      });
    } else {
      console.log(`\n✅ No tasks on other chains`);
    }

    // 4. 检查 ContactKey
    console.log(`\n🔑 ContactKeys on current chain (${CURRENT_CHAIN_ID}):`);
    
    const contactKeys = await prisma.contactKey.findMany({
      where: { chainId: CURRENT_CHAIN_ID },
      select: {
        taskId: true,
        creatorWrappedDEK: true,
        helperWrappedDEK: true,
      },
      orderBy: { taskId: 'asc' },
    });
    
    console.log(`  Total: ${contactKeys.length} contact keys`);
    const keysByTask = contactKeys.reduce((acc, key) => {
      if (!acc[key.taskId]) acc[key.taskId] = [];
      if (key.creatorWrappedDEK) acc[key.taskId].push('creator');
      if (key.helperWrappedDEK) acc[key.taskId].push('helper');
      return acc;
    }, {} as Record<string, string[]>);
    
    Object.entries(keysByTask).forEach(([taskId, roles]) => {
      console.log(`    Task ${taskId}: ${roles.join(', ')}`);
    });

    // 5. 分析
    console.log('\n🔍 Analysis:');
    
    if (currentChainTasks.length === 0) {
      console.log('  ⚠️  No tasks found on current chain');
      console.log('     This might indicate:');
      console.log('     1. Database was reset');
      console.log('     2. Wrong chainId configuration');
      console.log('     3. Tasks exist on a different chainId');
    } else {
      const maxTaskId = Math.max(...currentChainTasks.map(t => parseInt(t.taskId)));
      console.log(`  Max taskId on current chain: ${maxTaskId}`);
      console.log(`  Next taskId should be: ${maxTaskId + 1}`);
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Check Complete');
  console.log('='.repeat(60));
}

checkDbState();
