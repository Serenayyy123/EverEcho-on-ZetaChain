/**
 * 检查所有任务的映射关系
 * 搞清楚哪个 Task 对应哪个 taskId
 */

import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

async function checkAllTasksMapping() {
  console.log('=== 检查所有任务的映射关系 ===\n');

  try {
    // 1. 连接到链上
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const taskEscrowAddress = process.env.TASK_ESCROW_ADDRESS;
    
    if (!taskEscrowAddress) {
      console.log('❌ TASK_ESCROW_ADDRESS 未配置');
      return;
    }

    const contract = new ethers.Contract(
      taskEscrowAddress,
      [
        'function taskCounter() view returns (uint256)',
        'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
      ],
      provider
    );

    // 2. 获取链上任务总数
    const taskCounter = await contract.taskCounter();
    const totalTasks = Number(taskCounter);
    
    console.log(`链上任务总数: ${totalTasks}\n`);

    // 3. 逐个检查
    for (let i = 1; i <= totalTasks; i++) {
      console.log(`\n=== 链上 Task ${i} ===`);
      
      const taskOnChain = await contract.tasks(i);
      const taskURI = taskOnChain[4];
      
      console.log(`taskURI: ${taskURI}`);
      
      // 解析 taskURI
      const match = taskURI.match(/\/task\/(\d+)\.json$/);
      if (match) {
        const originalTaskId = match[1];
        console.log(`指向数据库 taskId: ${originalTaskId}`);
        
        // 检查数据库中的任务
        const dbTask = await prisma.task.findUnique({
          where: { taskId: originalTaskId },
        });
        
        if (dbTask) {
          console.log(`数据库中的 Task ${originalTaskId}:`);
          console.log(`  title: ${dbTask.title}`);
        } else {
          console.log(`❌ 数据库中不存在 Task ${originalTaskId}`);
        }
      } else {
        console.log('❌ 无法解析 taskURI');
      }
    }

    console.log('\n\n=== 数据库中的所有任务 ===\n');
    const allDbTasks = await prisma.task.findMany({
      orderBy: { taskId: 'asc' },
    });

    for (const task of allDbTasks) {
      console.log(`Task ${task.taskId}: ${task.title}`);
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllTasksMapping();
