import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkContactKeys() {
  console.log('=== Checking ContactKey Status ===\n');

  const chainId = process.env.CHAIN_ID || '84532';

  // 1. 统计 ContactKey 总数
  const totalKeys = await prisma.contactKey.count();
  console.log(`Total ContactKeys in DB: ${totalKeys}`);

  // 2. 按 taskId 分组统计
  const keysByTask = await prisma.contactKey.groupBy({
    by: ['chainId', 'taskId'],
    _count: true,
  });

  console.log(`\nContactKeys by Task:`);
  keysByTask.forEach(item => {
    console.log(`  Task ${item.taskId} (chain ${item.chainId}): ${item._count} keys`);
  });

  // 3. 从链上读取所有任务，检查哪些缺少 ContactKey
  console.log('\n--- Checking Missing ContactKeys ---');
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(
    process.env.TASK_ESCROW_ADDRESS!,
    [
      'function taskCounter() view returns (uint256)',
      'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
    ],
    provider
  );

  const taskCounter = await contract.taskCounter();
  console.log(`Chain has ${taskCounter} tasks\n`);

  const missingKeys: any[] = [];

  for (let i = 1; i <= Number(taskCounter); i++) {
    const task = await contract.tasks(i);
    const helper = task[2];
    const status = Number(task[5]);

    // 检查 ContactKey 是否存在
    const key = await prisma.contactKey.findUnique({
      where: {
        chainId_taskId: {
          chainId,
          taskId: i.toString(),
        },
      },
    });

    if (!key) {
      missingKeys.push({
        taskId: i,
        helper,
        status,
      });
      console.log(`✗ Task ${i}: Missing ContactKey (helper: ${helper === ethers.ZeroAddress ? 'none' : helper.slice(0, 10) + '...'}, status: ${status})`);
    } else {
      console.log(`✓ Task ${i}: ContactKey exists (creator: ${key.creatorWrappedDEK ? 'Y' : 'N'}, helper: ${key.helperWrappedDEK ? 'Y' : 'N'})`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total tasks on chain: ${taskCounter}`);
  console.log(`Tasks with helpers: ${Number(taskCounter) - missingKeys.length}`);
  console.log(`Missing ContactKeys: ${missingKeys.length}`);

  if (missingKeys.length > 0) {
    console.log('\nTasks needing ContactKey fix:');
    missingKeys.forEach(item => {
      console.log(`  - Task ${item.taskId} (helper: ${item.helper.slice(0, 10)}...)`);
    });
  }

  await prisma.$disconnect();
}

checkContactKeys().catch(console.error);
