/**
 * 重拉链上历史任务的 metadata 并覆盖 DB 中占位数据
 * 
 * 用途：
 * - 当 staging DB 中存在 fallback 占位数据时（title: "Task X (synced from chain)"）
 * - 手动执行此脚本，从链上 taskURI 重新拉取真实 metadata 并覆盖
 * 
 * 约束：
 * - 只更新 metadata 相关字段（title/description/category/contactsEncryptedPayload/creator/createdAt）
 * - 幂等操作，可重复执行
 * - metadata 拉取失败时跳过，不写入 fallback
 * - 不影响任何现有同步流程
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { getCurrentChainId } from '../src/config/chainConfig';
import { upsertTask } from '../src/services/taskService';

const prisma = new PrismaClient();

async function main() {
  console.log('[ResyncMetadata] 🔄 Starting metadata resync...\n');

  const chainId = getCurrentChainId();
  const rpcUrl = process.env.RPC_URL;
  const taskEscrowAddress = process.env.TASK_ESCROW_ADDRESS;

  if (!rpcUrl || !taskEscrowAddress) {
    throw new Error('[ResyncMetadata] Missing RPC_URL or TASK_ESCROW_ADDRESS');
  }

  console.log(`[ResyncMetadata] Chain ID: ${chainId}`);
  console.log(`[ResyncMetadata] RPC URL: ${rpcUrl}`);
  console.log(`[ResyncMetadata] TaskEscrow: ${taskEscrowAddress}\n`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(
    taskEscrowAddress,
    [
      'function taskCounter() view returns (uint256)',
      'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
    ],
    provider
  );

  // 1. 获取链上任务总数
  const taskCounter = await contract.taskCounter();
  const totalTasks = Number(taskCounter);
  console.log(`[ResyncMetadata] 📊 Total tasks on chain: ${totalTasks}\n`);

  if (totalTasks === 0) {
    console.log('[ResyncMetadata] ✅ No tasks to resync');
    return;
  }

  let updated = 0;
  let fallbackUpdated = 0;
  let skipped = 0;
  let failed = 0;

  // 2. 遍历所有任务
  for (let i = 1; i <= totalTasks; i++) {
    try {
      console.log(`[ResyncMetadata] [Task ${i}/${totalTasks}]`);

      // 2.1 从链上读取任务数据
      const taskData = await contract.tasks(i);
      const taskId = String(i);
      const creator = taskData[1];
      const taskURI = taskData[4];
      const createdAt = Number(taskData[6]);

      if (!taskURI || taskURI === '') {
        console.log(`[ResyncMetadata]   ⚠️  Empty taskURI, skipping`);
        skipped++;
        continue;
      }

      console.log(`[ResyncMetadata]   📥 Fetching metadata from: ${taskURI}`);

      // 2.2 拉取 metadata
      let metadata: any = null;
      let fetchFailed = false;
      try {
        const response = await fetch(taskURI);
        if (response.ok) {
          metadata = await response.json();
        } else {
          console.log(`[ResyncMetadata]   ⚠️  HTTP ${response.status}, using fallback`);
          fetchFailed = true;
        }
      } catch (fetchError: any) {
        console.log(`[ResyncMetadata]   ⚠️  Fetch failed: ${fetchError.message}, using fallback`);
        fetchFailed = true;
      }

      // 2.3 metadata 成功，覆盖 DB
      if (metadata) {
        await upsertTask(
          {
            taskId,
            title: metadata.title || `Task ${taskId}`,
            description: metadata.description || '',
            contactsEncryptedPayload: metadata.contactsEncryptedPayload || '',
            createdAt: metadata.createdAt || createdAt,
          },
          metadata.contactsPlaintext,
          metadata.category,
          metadata.creator || creator
        );

        console.log(`[ResyncMetadata]   ✅ Updated: ${metadata.title}`);
        updated++;
      } else if (fetchFailed) {
        // 2.4 fetch 失败，写入 fallback（不覆盖已有真实值）
        const existing = await prisma.task.findUnique({
          where: {
            chainId_taskId: {
              chainId,
              taskId,
            },
          },
        });

        const fallbackTitle = `Task ${taskId} (synced from chain)`;
        const fallbackDescription = `Metadata unavailable (taskURI unreachable). Using fallback.`;

        // 只在没有真实值时才写 fallback
        const shouldUseFallbackTitle = !existing?.title || existing.title.includes('(synced from chain)');
        const shouldUseFallbackDesc = !existing?.description || 
          existing.description === '' || 
          existing.description.includes('automatically synced from blockchain');

        await upsertTask(
          {
            taskId,
            title: shouldUseFallbackTitle ? fallbackTitle : existing!.title,
            description: shouldUseFallbackDesc ? fallbackDescription : existing!.description,
            contactsEncryptedPayload: existing?.contactsEncryptedPayload || '',
            createdAt: existing?.createdAt || String(createdAt),
          },
          existing?.contactsPlaintext || undefined,
          existing?.category || undefined,
          existing?.creator || creator
        );

        console.log(`[ResyncMetadata]   🔄 Fallback updated: ${fallbackTitle}`);
        fallbackUpdated++;
      }
    } catch (error: any) {
      console.error(`[ResyncMetadata]   ❌ Error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('[ResyncMetadata] 📊 Resync Summary:');
  console.log(`[ResyncMetadata]   ✅ Updated (real metadata): ${updated}`);
  console.log(`[ResyncMetadata]   🔄 Fallback updated: ${fallbackUpdated}`);
  console.log(`[ResyncMetadata]   ⏭️  Skipped: ${skipped}`);
  console.log(`[ResyncMetadata]   ❌ Failed: ${failed}`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('\n[ResyncMetadata] ❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
