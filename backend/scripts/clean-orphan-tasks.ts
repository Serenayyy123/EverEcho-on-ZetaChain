/**
 * 清理数据库中的"孤儿任务"
 * 删除链上不存在的任务（taskId > taskCounter）
 */

import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { getCurrentChainId } from '../src/config/chainConfig';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const CURRENT_CHAIN_ID = getCurrentChainId();

async function cleanOrphanTasks() {
  console.log('='.repeat(60));
  console.log('🧹 Clean Orphan Tasks');
  console.log('='.repeat(60));

  try {
    // 1. 读取链上 taskCounter
    const RPC_URL = process.env.RPC_URL;
    const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS;
    
    console.log('\n📋 Configuration:');
    console.log(`  CURRENT_CHAIN_ID: ${CURRENT_CHAIN_ID}`);
    console.log(`  TASK_ESCROW_ADDRESS: ${TASK_ESCROW_ADDRESS}`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      TASK_ESCROW_ADDRESS!,
      ['function taskCounter() view returns (uint256)'],
      provider
    );
    
    const taskCounter = await contract.taskCounter();
    console.log(`\n📊 Chain taskCounter: ${taskCounter}`);
    console.log(`  Tasks 1-${taskCounter} should exist on chain`);
    console.log(`  Tasks > ${taskCounter} are orphans (only in database)`);

    // 2. 查找数据库中的所有任务
    const dbTasks = await prisma.task.findMany({
      where: { chainId: CURRENT_CHAIN_ID },
      select: { taskId: true, title: true },
      orderBy: { taskId: 'asc' },
    });
    
    console.log(`\n💾 Database has ${dbTasks.length} tasks`);

    // 3. 找出孤儿任务（taskId > taskCounter）
    const orphanTasks = dbTasks.filter(task => parseInt(task.taskId) > Number(taskCounter));
    
    if (orphanTasks.length === 0) {
      console.log('\n✅ No orphan tasks found. Database is clean!');
      return;
    }

    console.log(`\n🗑️  Found ${orphanTasks.length} orphan tasks:`);
    orphanTasks.forEach(task => {
      console.log(`    Task ${task.taskId}: "${task.title}"`);
    });

    console.log('\n⚠️  These tasks will be DELETED from database');
    console.log('    (They don\'t exist on chain)');
    console.log('\nWaiting 5 seconds... Press Ctrl+C to cancel');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. 删除孤儿任务
    console.log('\n🗑️  Deleting orphan tasks...');
    
    for (const task of orphanTasks) {
      console.log(`  Deleting Task ${task.taskId}...`);
      
      // 删除 ContactKey
      await prisma.contactKey.deleteMany({
        where: {
          chainId: CURRENT_CHAIN_ID,
          taskId: task.taskId,
        },
      });
      
      // 删除 Task
      await prisma.task.delete({
        where: {
          chainId_taskId: {
            chainId: CURRENT_CHAIN_ID,
            taskId: task.taskId,
          },
        },
      });
      
      console.log(`    ✅ Deleted Task ${task.taskId}`);
    }

    // 5. 验证结果
    const remainingTasks = await prisma.task.findMany({
      where: { chainId: CURRENT_CHAIN_ID },
      select: { taskId: true },
      orderBy: { taskId: 'asc' },
    });
    
    console.log(`\n✅ Cleanup complete!`);
    console.log(`  Remaining tasks: ${remainingTasks.length}`);
    console.log(`  TaskIds: ${remainingTasks.map(t => t.taskId).join(', ')}`);
    console.log(`\n  Next task creation will use taskId: ${Number(taskCounter) + 1}`);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Cleanup Complete');
  console.log('='.repeat(60));
}

cleanOrphanTasks();
