/**
 * 回滚 Task 8 的错误修复
 * Task 8 应该保持原样，不应该被修改成 Task 7 的内容
 */

import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

async function rollbackTask8() {
  console.log('=== 回滚 Task 8 的错误修复 ===\n');

  try {
    // 1. 检查链上 Task 9 的信息
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

    console.log('检查链上 Task 9...');
    const task9OnChain = await contract.tasks(9);
    const taskURI = task9OnChain[4];
    
    console.log(`链上 Task 9 的 taskURI: ${taskURI}`);
    
    // 解析 taskURI
    const match = taskURI.match(/\/task\/(\d+)\.json$/);
    if (!match) {
      console.log('❌ 无法解析 taskURI');
      return;
    }
    
    const dbTaskId = match[1];
    console.log(`链上 Task 9 指向数据库 Task ${dbTaskId}\n`);

    // 2. 检查数据库 Task 8 的当前状态
    const task8 = await prisma.task.findUnique({
      where: { taskId: '8' },
    });

    if (!task8) {
      console.log('❌ 数据库中不存在 Task 8');
      return;
    }

    console.log('数据库 Task 8 的当前状态:');
    console.log(`  title: ${task8.title}`);
    console.log(`  description: ${task8.description}`);
    console.log('');

    // 3. 判断是否需要回滚
    if (task8.title === '有姐妹在成都能帮我带一天小猫吗？会有礼物相送') {
      console.log('⚠️  Task 8 的内容被错误地修改成了 Task 7 的内容');
      console.log('需要回滚到原始状态\n');
      
      // 回滚到默认状态
      await prisma.task.update({
        where: { taskId: '8' },
        data: {
          title: 'Task 8 (synced from chain)',
          description: 'This task was automatically synced from blockchain',
        },
      });
      
      console.log('✅ 已回滚 Task 8 到默认状态');
      console.log('  title: Task 8 (synced from chain)');
      console.log('  description: This task was automatically synced from blockchain');
    } else {
      console.log('✅ Task 8 的内容正确，无需回滚');
    }

  } catch (error) {
    console.error('❌ 回滚失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

rollbackTask8();
