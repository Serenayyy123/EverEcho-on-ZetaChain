/**
 * 修复所有缺失 helperWrappedDEK 的任务
 * 自动检测链上已接受但数据库缺少 helperWrappedDEK 的任务
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import { generateDEK, wrapDEK, encryptContacts } from '../src/services/encryptionService';

dotenv.config();

const prisma = new PrismaClient();

async function fixMissingHelperDEK() {
  console.log('=== 修复缺失的 helperWrappedDEK ===\n');

  try {
    // 1. 连接到链上
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
    console.log(`链上任务总数: ${taskCounter}\n`);

    let fixed = 0;
    let skipped = 0;

    // 2. 遍历所有链上任务
    for (let i = 1; i <= Number(taskCounter); i++) {
      const taskOnChain = await contract.tasks(i);
      const helper = taskOnChain[2];
      const status = Number(taskOnChain[5]);
      const taskURI = taskOnChain[4];

      // 跳过未接受的任务
      if (helper === ethers.ZeroAddress || status === 0) {
        continue;
      }

      // 解析 taskURI 获取数据库 taskId
      const match = taskURI.match(/\/task\/(\d+)\.json$/);
      if (!match) {
        console.log(`⚠️  链上 Task ${i}: 无法解析 taskURI`);
        continue;
      }

      const dbTaskId = match[1];

      // 检查数据库中的 ContactKey
      const contactKey = await prisma.contactKey.findUnique({
        where: { taskId: dbTaskId },
      });

      if (!contactKey) {
        console.log(`⚠️  Task ${dbTaskId}: ContactKey 不存在`);
        continue;
      }

      if (contactKey.helperWrappedDEK) {
        skipped++;
        continue; // 已有 helperWrappedDEK，跳过
      }

      // 需要修复
      console.log(`\n修复 Task ${dbTaskId} (链上 Task ${i})...`);

      // 获取任务信息
      const task = await prisma.task.findUnique({
        where: { taskId: dbTaskId },
      });

      if (!task || !task.contactsPlaintext) {
        console.log(`  ❌ 任务不存在或缺少 contactsPlaintext`);
        continue;
      }

      // 获取 creator 和 helper 的公钥
      const creator = taskOnChain[1];
      const creatorProfile = await prisma.profile.findUnique({
        where: { address: creator },
      });

      const helperProfile = await prisma.profile.findUnique({
        where: { address: helper },
      });

      if (!creatorProfile?.encryptionPubKey || !helperProfile?.encryptionPubKey) {
        console.log(`  ❌ 缺少公钥`);
        continue;
      }

      // 验证公钥长度
      const creatorKeyClean = creatorProfile.encryptionPubKey.startsWith('0x')
        ? creatorProfile.encryptionPubKey.slice(2)
        : creatorProfile.encryptionPubKey;
      const helperKeyClean = helperProfile.encryptionPubKey.startsWith('0x')
        ? helperProfile.encryptionPubKey.slice(2)
        : helperProfile.encryptionPubKey;

      if (creatorKeyClean.length / 2 !== 32 || helperKeyClean.length / 2 !== 32) {
        console.log(`  ❌ 公钥长度不正确 (creator: ${creatorKeyClean.length / 2}, helper: ${helperKeyClean.length / 2})`);
        continue;
      }

      // 重新生成 DEK 并包裹
      const dek = generateDEK();
      const encryptedPayload = encryptContacts(task.contactsPlaintext, dek);
      const creatorWrappedDEK = wrapDEK(dek, creatorProfile.encryptionPubKey);
      const helperWrappedDEK = wrapDEK(dek, helperProfile.encryptionPubKey);

      // 更新数据库
      await prisma.$transaction(async (tx) => {
        await tx.contactKey.update({
          where: { taskId: dbTaskId },
          data: {
            creatorWrappedDEK,
            helperWrappedDEK,
          },
        });

        await tx.task.update({
          where: { taskId: dbTaskId },
          data: {
            contactsEncryptedPayload: encryptedPayload,
          },
        });
      });

      console.log(`  ✅ 已修复`);
      fixed++;
    }

    console.log(`\n=== 修复完成 ===`);
    console.log(`✅ 修复: ${fixed}`);
    console.log(`⏭️  跳过: ${skipped}`);

  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingHelperDEK();
