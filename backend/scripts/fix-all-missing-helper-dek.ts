/**
 * 批量修复所有缺失 helperWrappedDEK 的任务
 */

import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { generateDEK, wrapDEK } from '../src/services/encryptionService';

const prisma = new PrismaClient();

const RPC_URL = process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/y7anxz3Urn0udDBD6u8TU';
const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS || '0xC71040C8916E145f937Da3D094323C8f136c2E2F';

const TASK_ESCROW_ABI = [
  'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
];

async function fixAllMissingHelperDEK() {
  try {
    console.log('\n🔧 Checking for tasks with missing helperWrappedDEK...\n');

    // 1. 查找所有 helperWrappedDEK 为空的 ContactKey
    const contactKeys = await prisma.contactKey.findMany({
      where: {
        helperWrappedDEK: '',
      },
    });

    if (contactKeys.length === 0) {
      console.log('✅ No tasks with missing helperWrappedDEK found\n');
      return;
    }

    console.log(`Found ${contactKeys.length} tasks with missing helperWrappedDEK:`);
    console.log(contactKeys.map(k => k.taskId).join(', '));
    console.log('');

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(TASK_ESCROW_ADDRESS, TASK_ESCROW_ABI, provider);

    let fixedCount = 0;
    let skippedCount = 0;

    // 2. 逐个修复
    for (const contactKey of contactKeys) {
      const taskId = contactKey.taskId;
      console.log(`\n📝 Processing Task ${taskId}...`);

      try {
        // 从链上读取 helper 地址
        const taskOnChain = await contract.tasks(taskId);
        const helper = taskOnChain[2]; // address helper

        if (helper === ethers.ZeroAddress) {
          console.log(`   ⚠️  No helper assigned, skipping`);
          skippedCount++;
          continue;
        }

        console.log(`   Helper: ${helper}`);

        // 获取 helper 的 profile
        const helperProfile = await prisma.profile.findUnique({
          where: { address: helper },
        });

        if (!helperProfile || !helperProfile.encryptionPubKey) {
          console.log(`   ❌ Helper profile not found or has no encryption key, skipping`);
          skippedCount++;
          continue;
        }

        console.log(`   Helper: ${helperProfile.nickname}`);

        // 获取 task 的明文联系方式
        const task = await prisma.task.findUnique({
          where: { taskId },
        });

        if (!task || !task.contactsPlaintext) {
          console.log(`   ❌ Task not found or has no plaintext contacts, skipping`);
          skippedCount++;
          continue;
        }

        // 生成新的 DEK 并包裹给 helper
        const dek = generateDEK();
        const helperWrappedDEK = wrapDEK(dek, helperProfile.encryptionPubKey);

        // 更新 ContactKey
        await prisma.contactKey.update({
          where: { taskId },
          data: { helperWrappedDEK },
        });

        console.log(`   ✅ helperWrappedDEK updated`);
        fixedCount++;
      } catch (error) {
        console.error(`   ❌ Error processing task ${taskId}:`, error);
        skippedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${contactKeys.length}`);
    console.log('\n🎉 Done!\n');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllMissingHelperDEK();
