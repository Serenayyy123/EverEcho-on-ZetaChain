/**
 * 检查 Task 8 的详细信息
 */

import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

async function checkTask8() {
  console.log('=== 检查 Task 8 详细信息 ===\n');

  try {
    // 1. 检查数据库中的 Task 8
    const task8 = await prisma.task.findUnique({
      where: { taskId: '8' },
    });

    if (!task8) {
      console.log('❌ Task 8 不存在于数据库');
      return;
    }

    console.log('📋 数据库中的 Task 8:');
    console.log(`  taskId: ${task8.taskId}`);
    console.log(`  title: ${task8.title}`);
    console.log(`  description: ${task8.description}`);
    console.log(`  contactsPlaintext: ${task8.contactsPlaintext}`);
    console.log(`  contactsEncryptedPayload: ${task8.contactsEncryptedPayload ? '存在' : '不存在'}`);
    console.log('');

    // 2. 检查链上的 Task 8
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

    const taskOnChain = await contract.tasks(8);
    console.log('⛓️  链上的 Task 8:');
    console.log(`  taskId: ${taskOnChain[0]}`);
    console.log(`  creator: ${taskOnChain[1]}`);
    console.log(`  helper: ${taskOnChain[2]}`);
    console.log(`  reward: ${ethers.formatEther(taskOnChain[3])} EOCHO`);
    console.log(`  taskURI: ${taskOnChain[4]}`);
    console.log(`  status: ${taskOnChain[5]}`);
    console.log('');

    // 3. 解析 taskURI
    const taskURI = taskOnChain[4];
    console.log('🔍 解析 taskURI:');
    console.log(`  taskURI: ${taskURI}`);
    
    const match = taskURI.match(/\/task\/(\d+)\.json$/);
    if (match) {
      const originalTaskId = match[1];
      console.log(`  指向的原始 taskId: ${originalTaskId}`);
      
      // 4. 检查原始任务
      const originalTask = await prisma.task.findUnique({
        where: { taskId: originalTaskId },
      });
      
      if (originalTask) {
        console.log(`\n📋 原始任务 (Task ${originalTaskId}):`);
        console.log(`  title: ${originalTask.title}`);
        console.log(`  description: ${originalTask.description}`);
        console.log('');
        
        console.log('💡 问题分析:');
        console.log(`  Task 8 的 taskURI 指向 Task ${originalTaskId}`);
        console.log(`  但数据库中 Task 8 的 title 是: "${task8.title}"`);
        console.log(`  应该显示的 title 是: "${originalTask.title}"`);
        console.log('');
        
        console.log('🔧 解决方案:');
        console.log(`  需要更新 Task 8 的 title 和 description`);
        console.log(`  从 Task ${originalTaskId} 复制真实的元数据`);
      }
    } else {
      console.log('  ❌ 无法解析 taskURI');
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTask8();
