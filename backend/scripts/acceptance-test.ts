/**
 * 验收测试：检查所有链上任务是否都已同步到数据库
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RPC_URL = process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/y7anxz3Urn0udDBD6u8TU';
const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS || '0xC71040C8916E145f937Da3D094323C8f136c2E2F';

const TASK_ESCROW_ABI = [
  'function taskCounter() view returns (uint256)',
];

async function acceptanceTest() {
  try {
    console.log('\n📋 Acceptance Test: Task Sync Verification\n');
    console.log('='.repeat(60));

    // 1. 获取链上任务总数
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(TASK_ESCROW_ADDRESS, TASK_ESCROW_ABI, provider);
    const taskCounter = await contract.taskCounter();
    const totalTasks = Number(taskCounter);

    console.log(`\n✅ Chain has ${totalTasks} tasks (taskCounter = ${totalTasks})`);

    // 2. 获取数据库中的任务
    const dbTasks = await prisma.task.findMany({
      orderBy: { taskId: 'asc' },
    });

    console.log(`✅ Database has ${dbTasks.length} tasks`);

    // 3. 检查每个链上任务是否都在数据库中
    const missingTasks: string[] = [];
    const tasksWithoutContactKey: string[] = [];

    for (let i = 1; i <= totalTasks; i++) {
      const taskId = i.toString();
      const dbTask = dbTasks.find(t => t.taskId === taskId);

      if (!dbTask) {
        missingTasks.push(taskId);
      } else {
        // 检查 ContactKey
        const contactKey = await prisma.contactKey.findUnique({
          where: { taskId },
        });

        if (!contactKey) {
          tasksWithoutContactKey.push(taskId);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Results:\n');

    // 4. 输出结果
    if (missingTasks.length === 0) {
      console.log('✅ All chain tasks are synced to database');
    } else {
      console.log(`❌ Missing tasks: ${missingTasks.join(', ')}`);
    }

    if (tasksWithoutContactKey.length === 0) {
      console.log('✅ All tasks have ContactKey');
    } else {
      console.log(`❌ Tasks without ContactKey: ${tasksWithoutContactKey.join(', ')}`);
    }

    // 5. 详细列表
    console.log('\n' + '='.repeat(60));
    console.log('\n📝 Task Details:\n');

    for (let i = 1; i <= totalTasks; i++) {
      const taskId = i.toString();
      const dbTask = dbTasks.find(t => t.taskId === taskId);
      const contactKey = await prisma.contactKey.findUnique({
        where: { taskId },
      });

      const taskStatus = dbTask ? '✅' : '❌';
      const keyStatus = contactKey ? '✅' : '❌';
      const helperKeyStatus = contactKey?.helperWrappedDEK ? '✅' : '⚠️ ';

      console.log(`Task ${taskId}: ${taskStatus} Task | ${keyStatus} ContactKey | ${helperKeyStatus} HelperDEK`);
    }

    console.log('\n' + '='.repeat(60));

    // 6. 最终判定
    const allPassed = missingTasks.length === 0 && tasksWithoutContactKey.length === 0;

    if (allPassed) {
      console.log('\n🎉 ACCEPTANCE TEST PASSED\n');
      console.log('✅ Goal 1: All chain tasks synced to database');
      console.log('✅ Goal 2: All tasks have ContactKey');
      console.log('✅ Goal 3: /api/contacts/decrypt will not return 404\n');
    } else {
      console.log('\n❌ ACCEPTANCE TEST FAILED\n');
      console.log('Please run: npx ts-node backend/scripts/sync-all-missing-tasks.ts\n');
    }

    await prisma.$disconnect();
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Test error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

acceptanceTest();
