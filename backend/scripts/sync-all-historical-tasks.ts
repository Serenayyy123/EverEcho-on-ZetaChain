/**
 * 一次性同步所有历史任务
 * 用于 staging 环境初始化或数据库重置后恢复
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { getCurrentChainId } from '../src/config/chainConfig';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting historical task sync...\n');

  const chainId = getCurrentChainId();
  const rpcUrl = process.env.RPC_URL;
  const taskEscrowAddress = process.env.TASK_ESCROW_ADDRESS;

  if (!rpcUrl || !taskEscrowAddress) {
    throw new Error('Missing RPC_URL or TASK_ESCROW_ADDRESS');
  }

  console.log(`Chain ID: ${chainId}`);
  console.log(`RPC URL: ${rpcUrl}`);
  console.log(`TaskEscrow: ${taskEscrowAddress}\n`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(
    taskEscrowAddress,
    [
      'function taskCounter() view returns (uint256)',
      'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
      'event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 reward, string taskURI)',
    ],
    provider
  );

  // 1. 获取链上最新 taskId
  const taskCounter = await contract.taskCounter();
  const totalTasks = Number(taskCounter);
  console.log(`📊 Total tasks on chain: ${totalTasks}\n`);

  if (totalTasks === 0) {
    console.log('✅ No tasks to sync');
    return;
  }

  // 2. 遍历所有任务
  let synced = 0;
  let fallbackSynced = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 1; i <= totalTasks; i++) {
    try {
      console.log(`\n[Task ${i}/${totalTasks}]`);

      // 检查是否已存在
      const existing = await prisma.task.findUnique({
        where: { chainId_taskId: { chainId, taskId: String(i) } },
      });

      if (existing) {
        console.log(`  ⏭️  Already exists, skipping`);
        skipped++;
        continue;
      }

      // 从链上读取
      const taskData = await contract.tasks(i);
      const taskURI = taskData[4];

      if (!taskURI || taskURI === '') {
        console.log(`  ⚠️  Empty taskURI, skipping`);
        skipped++;
        continue;
      }

      console.log(`  📥 Fetching metadata from: ${taskURI}`);

      // 获取 metadata（如果失败则使用 fallback）
      let metadata: any = null;
      let fetchFailed = false;
      try {
        const response = await fetch(taskURI);
        if (response.ok) {
          metadata = await response.json();
        } else {
          console.log(`  ⚠️  Failed to fetch metadata: HTTP ${response.status}, using fallback`);
          fetchFailed = true;
        }
      } catch (fetchError: any) {
        console.log(`  ⚠️  Failed to fetch metadata: ${fetchError.message}, using fallback`);
        fetchFailed = true;
      }

      if (metadata) {
        // ✅ 成功路径：使用真实 metadata
        const title = metadata.title || `Task ${i}`;
        const description = metadata.description || '';
        const contactsEncryptedPayload = metadata.contactsEncryptedPayload || '';
        const createdAt = String(metadata.createdAt || Math.floor(Date.now() / 1000));
        const category = metadata.category || null;
        const creator = metadata.creator || taskData[1];

        await prisma.task.create({
          data: {
            chainId,
            taskId: String(i),
            title,
            description,
            contactsEncryptedPayload,
            createdAt,
            category,
            creator,
          },
        });

        console.log(`  ✅ Synced: ${title}`);
        synced++;
      } else if (fetchFailed) {
        // 🔄 失败路径：使用 fallback
        const fallbackTitle = `Task ${i} (synced from chain)`;
        const fallbackDescription = `Metadata unavailable (taskURI unreachable). Using fallback.`;

        await prisma.task.create({
          data: {
            chainId,
            taskId: String(i),
            title: fallbackTitle,
            description: fallbackDescription,
            contactsEncryptedPayload: '',
            createdAt: String(Math.floor(Date.now() / 1000)),
            category: null,
            creator: taskData[1],
          },
        });

        console.log(`  🔄 Fallback synced: ${fallbackTitle}`);
        fallbackSynced++;
      }
    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Sync Summary:');
  console.log(`  ✅ Synced (real metadata): ${synced}`);
  console.log(`  🔄 Fallback synced: ${fallbackSynced}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('\n❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
