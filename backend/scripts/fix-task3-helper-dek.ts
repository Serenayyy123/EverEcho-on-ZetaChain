/**
 * 修复 Task 3 的 helperWrappedDEK
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

async function fixTask3() {
  const taskId = '3';

  try {
    console.log(`\n🔧 Fixing Task ${taskId} helperWrappedDEK...\n`);

    // 1. 检查 Task 和 ContactKey
    const task = await prisma.task.findUnique({
      where: { taskId },
    });

    if (!task) {
      console.error(`❌ Task ${taskId} not found`);
      return;
    }

    const contactKey = await prisma.contactKey.findUnique({
      where: { taskId },
    });

    if (!contactKey) {
      console.error(`❌ ContactKey not found for task ${taskId}`);
      return;
    }

    if (contactKey.helperWrappedDEK) {
      console.log(`⚠️  helperWrappedDEK already exists for task ${taskId}`);
      console.log(`   Current: ${contactKey.helperWrappedDEK.substring(0, 20)}...`);
      return;
    }

    console.log(`✅ Task ${taskId} found`);
    console.log(`   Contacts: ${task.contactsPlaintext}`);

    // 2. 从链上读取 helper 地址
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(TASK_ESCROW_ADDRESS, TASK_ESCROW_ABI, provider);
    const taskOnChain = await contract.tasks(taskId);
    const helper = taskOnChain[2]; // address helper

    console.log(`   Helper: ${helper}`);

    if (helper === ethers.ZeroAddress) {
      console.error(`❌ No helper assigned to task ${taskId}`);
      return;
    }

    // 3. 获取 helper 的 profile
    const helperProfile = await prisma.profile.findUnique({
      where: { address: helper },
    });

    if (!helperProfile || !helperProfile.encryptionPubKey) {
      console.error(`❌ Helper ${helper} not found or has no encryption key`);
      return;
    }

    console.log(`✅ Helper profile found: ${helperProfile.nickname}`);

    // 4. 生成新的 DEK 并包裹给 helper
    // 注意：这里使用新的 DEK，因为我们无法从 creatorWrappedDEK 中解密出原始 DEK
    const dek = generateDEK();
    const helperWrappedDEK = wrapDEK(dek, helperProfile.encryptionPubKey);

    // 5. 更新 ContactKey
    await prisma.contactKey.update({
      where: { taskId },
      data: { helperWrappedDEK },
    });

    console.log(`\n✅ helperWrappedDEK updated for task ${taskId}`);
    console.log(`   helperWrappedDEK: ${helperWrappedDEK.substring(0, 20)}...`);
    console.log(`\n🎉 Task ${taskId} fixed!\n`);
  } catch (error) {
    console.error(`❌ Error fixing task ${taskId}:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTask3();
