/**
 * 修复所有任务的元数据
 * 对于 title 包含 "synced from chain" 的任务，从 taskURI 获取真实的元数据
 */

import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

async function fixAllTaskMetadata() {
  console.log('=== 修复所有任务的元数据 ===\n');

  try {
    // 1. 获取所有需要修复的任务
    const tasksToFix = await prisma.task.findMany({
      where: {
        title: {
          contains: 'synced from chain',
        },
      },
    });

    if (tasksToFix.length === 0) {
      console.log('✅ 没有需要修复的任务');
      return;
    }

    console.log(`找到 ${tasksToFix.length} 个需要修复的任务\n`);

    // 2. 连接到链上
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const taskEscrowAddress = process.env.TASK_ESCROW_ADDRESS;
    
    if (!taskEscrowAddress) {
      console.log('❌ TASK_ESCROW_ADDRESS 未配置');
      return;
    }

    const contract = new ethers.Contract(
      taskEscrowAddress,
      [
        'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
      ],
      provider
    );

    let fixed = 0;
    let failed = 0;

    // 3. 逐个修复
    for (const task of tasksToFix) {
      try {
        console.log(`\n处理 Task ${task.taskId}...`);
        
        // 从链上获取 taskURI
        const taskOnChain = await contract.tasks(task.taskId);
        const taskURI = taskOnChain[4];
        
        console.log(`  taskURI: ${taskURI}`);
        
        // 解析 taskURI
        const match = taskURI.match(/\/task\/(\d+)\.json$/);
        if (!match) {
          console.log(`  ❌ 无法解析 taskURI`);
          failed++;
          continue;
        }
        
        const originalTaskId = match[1];
        console.log(`  指向原始 Task ${originalTaskId}`);
        
        // 获取原始任务的元数据
        const originalTask = await prisma.task.findUnique({
          where: { taskId: originalTaskId },
          select: { title: true, description: true },
        });
        
        if (!originalTask) {
          console.log(`  ❌ 原始任务不存在`);
          failed++;
          continue;
        }
        
        if (originalTask.title.includes('synced from chain')) {
          console.log(`  ⚠️  原始任务也是同步的，跳过`);
          failed++;
          continue;
        }
        
        // 更新任务元数据
        await prisma.task.update({
          where: { taskId: task.taskId },
          data: {
            title: originalTask.title,
            description: originalTask.description,
          },
        });
        
        console.log(`  ✅ 已更新:`);
        console.log(`     title: ${originalTask.title}`);
        console.log(`     description: ${originalTask.description.substring(0, 50)}...`);
        
        fixed++;
      } catch (error) {
        console.error(`  ❌ 修复失败:`, error);
        failed++;
      }
    }

    console.log(`\n=== 修复完成 ===`);
    console.log(`✅ 成功: ${fixed}`);
    console.log(`❌ 失败: ${failed}`);

  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllTaskMetadata();
