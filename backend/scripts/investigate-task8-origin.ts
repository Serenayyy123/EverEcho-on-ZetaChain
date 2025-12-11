/**
 * 调查 Task 8 的来源
 * 它是通过前端创建的还是通过链上同步的？
 */

import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

async function investigateTask8() {
  console.log('=== 调查 Task 8 的来源 ===\n');

  try {
    // 1. 检查数据库 Task 8
    const task8 = await prisma.task.findUnique({
      where: { taskId: '8' },
    });

    if (!task8) {
      console.log('❌ 数据库中不存在 Task 8');
      return;
    }

    console.log('数据库 Task 8:');
    console.log(`  taskId: ${task8.taskId}`);
    console.log(`  title: ${task8.title}`);
    console.log(`  description: ${task8.description}`);
    console.log(`  contactsPlaintext: ${task8.contactsPlaintext}`);
    console.log(`  createdAt: ${task8.createdAt}`);
    console.log('');

    // 2. 检查链上是否有对应的任务
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

    const taskCounter = await contract.taskCounter();
    console.log(`链上任务总数: ${taskCounter}\n`);

    // 3. 查找哪个链上任务指向数据库 Task 8
    console.log('查找指向数据库 Task 8 的链上任务...\n');
    
    for (let i = 1; i <= Number(taskCounter); i++) {
      const taskOnChain = await contract.tasks(i);
      const taskURI = taskOnChain[4];
      
      const match = taskURI.match(/\/task\/(\d+)\.json$/);
      if (match && match[1] === '8') {
        console.log(`✅ 找到！链上 Task ${i} 指向数据库 Task 8`);
        console.log(`  taskURI: ${taskURI}`);
        console.log(`  creator: ${taskOnChain[1]}`);
        console.log(`  helper: ${taskOnChain[2]}`);
        console.log(`  reward: ${ethers.formatEther(taskOnChain[3])} EOCHO`);
        console.log(`  status: ${taskOnChain[5]}`);
        console.log('');
      }
    }

    // 4. 判断 Task 8 的来源
    console.log('=== 判断 Task 8 的来源 ===');
    
    if (task8.title.includes('synced from chain')) {
      console.log('❌ Task 8 是通过链上同步创建的（没有真实的元数据）');
      console.log('   这意味着：');
      console.log('   1. Task 8 不是通过前端创建的');
      console.log('   2. 它是 EventListener 或 ChainSync 自动创建的');
      console.log('   3. 它的 taskURI 可能指向另一个任务');
      console.log('');
      console.log('💡 解决方案：');
      console.log('   需要找到 Task 8 原本应该对应的任务内容');
      console.log('   或者删除 Task 8，让系统重新同步');
    } else {
      console.log('✅ Task 8 是通过前端创建的（有真实的元数据）');
      console.log(`   title: ${task8.title}`);
      console.log(`   description: ${task8.description}`);
    }

  } catch (error) {
    console.error('❌ 调查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateTask8();
