/**
 * 检查 Task 3 的数据
 * 用于诊断新任务显示旧数据的问题
 */

import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkTask3() {
  console.log('=== Checking Task 3 Data ===\n');

  try {
    // 1. 检查链上数据
    console.log('1. Checking on-chain data...');
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(
      process.env.TASK_ESCROW_ADDRESS!,
      [
        'function tasks(uint256) view returns (address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
        'function taskCounter() view returns (uint256)',
      ],
      provider
    );

    const taskCounter = await contract.taskCounter();
    console.log(`   Task Counter: ${taskCounter}`);

    if (Number(taskCounter) >= 3) {
      const taskData = await contract.tasks(3);
      console.log(`   Task 3 on-chain:`);
      console.log(`   - Creator: ${taskData.creator}`);
      console.log(`   - Helper: ${taskData.helper}`);
      console.log(`   - Reward: ${ethers.formatEther(taskData.reward)} ECHO`);
      console.log(`   - TaskURI: ${taskData.taskURI}`);
      console.log(`   - Status: ${taskData.status}`);
      console.log(`   - CreatedAt: ${new Date(Number(taskData.createdAt) * 1000).toISOString()}`);
    } else {
      console.log(`   Task 3 does not exist on-chain yet (counter: ${taskCounter})`);
      return;
    }

    // 2. 检查数据库数据
    console.log('\n2. Checking database data...');
    const dbTask = await prisma.task.findUnique({
      where: { taskId: '3' },
    });

    if (dbTask) {
      console.log(`   Task 3 in database:`);
      console.log(`   - TaskId: ${dbTask.taskId}`);
      console.log(`   - Title: ${dbTask.title}`);
      console.log(`   - Description: ${dbTask.description?.substring(0, 100)}...`);
      console.log(`   - Category: ${dbTask.category || 'N/A'}`);
      console.log(`   - Creator: ${dbTask.creator || 'N/A'}`);
      console.log(`   - CreatedAt: ${dbTask.createdAt ? new Date(dbTask.createdAt * 1000).toISOString() : 'N/A'}`);
      console.log(`   - ContactsEncryptedPayload length: ${dbTask.contactsEncryptedPayload?.length || 0}`);
    } else {
      console.log(`   Task 3 NOT FOUND in database!`);
    }

    // 3. 检查所有任务，看是否有重复或错误
    console.log('\n3. Checking all tasks in database...');
    const allTasks = await prisma.task.findMany({
      orderBy: { taskId: 'asc' },
      select: {
        taskId: true,
        title: true,
        category: true,
        creator: true,
        createdAt: true,
      },
    });

    console.log(`   Total tasks in database: ${allTasks.length}`);
    allTasks.forEach(task => {
      console.log(`   - Task ${task.taskId}: "${task.title}" (${task.category || 'no category'}) by ${task.creator?.substring(0, 10)}...`);
    });

    // 4. 检查是否有 taskId 不匹配的情况
    console.log('\n4. Checking for taskId mismatches...');
    const taskIdMismatches = allTasks.filter(task => {
      const numericId = parseInt(task.taskId);
      return isNaN(numericId) || numericId <= 0;
    });

    if (taskIdMismatches.length > 0) {
      console.log(`   ⚠️  Found ${taskIdMismatches.length} tasks with invalid taskId:`);
      taskIdMismatches.forEach(task => {
        console.log(`   - Task ${task.taskId}: "${task.title}"`);
      });
    } else {
      console.log(`   ✅ All taskIds are valid`);
    }

  } catch (error) {
    console.error('Error checking task 3:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTask3();
