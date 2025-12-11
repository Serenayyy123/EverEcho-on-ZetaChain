/**
 * 一键检测和修复缺失的任务
 * 用法: npx ts-node backend/scripts/check-missing-tasks.ts [--fix]
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { syncMissingTasks } from '../src/services/taskSyncCoordinator';

const prisma = new PrismaClient();

const TASK_ESCROW_ABI = [
  'function taskCounter() view returns (uint256)',
  'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
];

async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  
  console.log('='.repeat(60));
  console.log('Task Sync Health Check');
  console.log('='.repeat(60));
  console.log('');
  
  // 1. 检查环境变量
  const RPC_URL = process.env.RPC_URL;
  const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS;
  
  if (!RPC_URL || !TASK_ESCROW_ADDRESS) {
    console.error('❌ Missing environment variables:');
    if (!RPC_URL) console.error('  - RPC_URL');
    if (!TASK_ESCROW_ADDRESS) console.error('  - TASK_ESCROW_ADDRESS');
    process.exit(1);
  }
  
  console.log(`✓ RPC URL: ${RPC_URL}`);
  console.log(`✓ TaskEscrow: ${TASK_ESCROW_ADDRESS}`);
  console.log('');
  
  // 2. 连接到链
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(
    TASK_ESCROW_ADDRESS,
    TASK_ESCROW_ABI,
    provider
  );
  
  try {
    // 3. 获取链上任务数量
    const taskCounter = await contract.taskCounter();
    const totalTasks = Number(taskCounter);
    
    console.log(`📊 Chain Status:`);
    console.log(`  Total tasks on chain: ${totalTasks}`);
    console.log('');
    
    if (totalTasks === 0) {
      console.log('✓ No tasks on chain yet');
      return;
    }
    
    // 4. 获取数据库中的任务
    const dbTasks = await prisma.task.findMany({
      select: { taskId: true },
    });
    const dbTaskIds = new Set(dbTasks.map(t => t.taskId));
    
    console.log(`💾 Database Status:`);
    console.log(`  Total tasks in database: ${dbTasks.length}`);
    console.log('');
    
    // 5. 找出缺失的任务
    const missingTaskIds: string[] = [];
    for (let i = 1; i <= totalTasks; i++) {
      if (!dbTaskIds.has(i.toString())) {
        missingTaskIds.push(i.toString());
      }
    }
    
    // 6. 检查缺失的 ContactKey
    const tasksWithoutContactKey: string[] = [];
    for (const task of dbTasks) {
      const contactKey = await prisma.contactKey.findUnique({
        where: { taskId: task.taskId },
      });
      if (!contactKey) {
        tasksWithoutContactKey.push(task.taskId);
      }
    }
    
    // 7. 报告结果
    console.log(`🔍 Health Check Results:`);
    console.log('');
    
    if (missingTaskIds.length === 0 && tasksWithoutContactKey.length === 0) {
      console.log('✅ All tasks are synced correctly!');
      console.log('  - All chain tasks exist in database');
      console.log('  - All tasks have ContactKey');
      return;
    }
    
    // 有问题
    let hasIssues = false;
    
    if (missingTaskIds.length > 0) {
      hasIssues = true;
      console.log(`❌ Missing Tasks (${missingTaskIds.length}):`);
      console.log(`  Task IDs: ${missingTaskIds.join(', ')}`);
      console.log('  These tasks exist on chain but not in database');
      console.log('');
    }
    
    if (tasksWithoutContactKey.length > 0) {
      hasIssues = true;
      console.log(`⚠️  Tasks Without ContactKey (${tasksWithoutContactKey.length}):`);
      console.log(`  Task IDs: ${tasksWithoutContactKey.join(', ')}`);
      console.log('  These tasks exist but cannot decrypt contacts');
      console.log('');
    }
    
    // 8. 修复（如果指定了 --fix）
    if (shouldFix) {
      console.log('🔧 Fixing issues...');
      console.log('');
      
      const result = await syncMissingTasks(contract, 'manual');
      
      console.log('');
      console.log(`✅ Fix completed:`);
      console.log(`  - Synced: ${result.synced}`);
      console.log(`  - Failed: ${result.failed}`);
      
      if (result.failed > 0) {
        console.log('');
        console.log('⚠️  Some tasks failed to sync. Check logs above for details.');
      }
    } else {
      console.log('💡 To fix these issues, run:');
      console.log('   npx ts-node backend/scripts/check-missing-tasks.ts --fix');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
