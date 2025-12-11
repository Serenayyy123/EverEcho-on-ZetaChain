/**
 * 手动触发 Task 8 的同步（模拟 TaskAccepted 事件）
 */

import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { generateDEK, wrapDEK, encryptContacts } from '../src/services/encryptionService';

const prisma = new PrismaClient();

const RPC_URL = process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/y7anxz3Urn0udDBD6u8TU';
const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS || '0xC71040C8916E145f937Da3D094323C8f136c2E2F';

const TASK_ESCROW_ABI = [
  'function tasks(uint256) view returns (address creator, address helper, uint8 status, uint256 reward, string taskURI)',
];

async function syncTask8() {
  const taskId = '8';

  try {
    console.log(`\n🔄 Syncing Task ${taskId} from chain...\n`);

    // 1. 连接到链上
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(TASK_ESCROW_ADDRESS, TASK_ESCROW_ABI, provider);

    // 2. 从链上读取任务信息
    console.log('📖 Reading task from chain...');
    const taskOnChain = await contract.tasks(taskId);
    
    const creator = taskOnChain.creator;
    const helper = taskOnChain.helper;
    const status = taskOnChain.status;
    const taskURI = taskOnChain.taskURI;

    console.log(`   Creator: ${creator}`);
    console.log(`   Helper: ${helper}`);
    console.log(`   Status: ${status}`);
    console.log(`   TaskURI: ${taskURI}`);

    // 3. 检查 Task 是否已存在
    let task = await prisma.task.findUnique({
      where: { taskId },
    });

    if (!task) {
      console.log('\n📝 Task not found in database, creating...');

      // 获取 creator 的 profile
      const creatorProfile = await prisma.profile.findUnique({
        where: { address: creator },
      });

      if (!creatorProfile || !creatorProfile.encryptionPubKey) {
        console.error(`❌ Creator ${creator} not found or has no encryption key`);
        return;
      }

      console.log(`✅ Creator profile found: ${creatorProfile.nickname}`);

      // 创建任务记录
      const contactsPlaintext = creatorProfile.contacts || 'N/A';
      
      task = await prisma.task.create({
        data: {
          taskId,
          title: `Task ${taskId} (synced from chain)`,
          description: 'This task was automatically synced from blockchain',
          contactsEncryptedPayload: '', // 稍后加密
          contactsPlaintext,
          createdAt: Date.now().toString(),
        },
      });

      console.log(`✅ Task ${taskId} created`);
    } else {
      console.log(`✅ Task ${taskId} already exists`);
    }

    // 4. 检查 ContactKey 是否已存在
    let contactKey = await prisma.contactKey.findUnique({
      where: { taskId },
    });

    if (contactKey) {
      console.log(`\n⚠️  ContactKey already exists for task ${taskId}`);
      
      // 检查是否需要更新 helperWrappedDEK
      if (!contactKey.helperWrappedDEK && helper !== ethers.ZeroAddress) {
        console.log('📝 Updating helperWrappedDEK...');
        
        const helperProfile = await prisma.profile.findUnique({
          where: { address: helper },
        });

        if (!helperProfile || !helperProfile.encryptionPubKey) {
          console.error(`❌ Helper ${helper} not found or has no encryption key`);
          return;
        }

        const dek = generateDEK();
        const helperWrappedDEK = wrapDEK(dek, helperProfile.encryptionPubKey);

        await prisma.contactKey.update({
          where: { taskId },
          data: { helperWrappedDEK },
        });

        console.log(`✅ helperWrappedDEK updated`);
      }
      
      return;
    }

    // 5. 创建 ContactKey
    console.log('\n📝 Creating ContactKey...');

    // 获取 creator 的 profile
    const creatorProfile = await prisma.profile.findUnique({
      where: { address: creator },
    });

    if (!creatorProfile || !creatorProfile.encryptionPubKey) {
      console.error(`❌ Creator ${creator} not found or has no encryption key`);
      return;
    }

    // 生成 DEK 和加密
    const contactsPlaintext = task.contactsPlaintext || 'N/A';
    const dek = generateDEK();
    const encryptedPayload = encryptContacts(contactsPlaintext, dek);
    const creatorWrappedDEK = wrapDEK(dek, creatorProfile.encryptionPubKey);

    // 如果有 helper，也为 helper 生成 wrappedDEK
    let helperWrappedDEK = '';
    if (helper !== ethers.ZeroAddress) {
      const helperProfile = await prisma.profile.findUnique({
        where: { address: helper },
      });

      if (helperProfile && helperProfile.encryptionPubKey) {
        helperWrappedDEK = wrapDEK(dek, helperProfile.encryptionPubKey);
        console.log(`✅ Helper profile found: ${helperProfile.nickname}`);
      }
    }

    // 创建 ContactKey
    await prisma.contactKey.create({
      data: {
        taskId,
        creatorWrappedDEK,
        helperWrappedDEK,
      },
    });

    // 更新 Task 的加密 payload
    await prisma.task.update({
      where: { taskId },
      data: { contactsEncryptedPayload: encryptedPayload },
    });

    console.log(`\n✅ ContactKey created for task ${taskId}`);
    console.log(`   creatorWrappedDEK: ${creatorWrappedDEK.substring(0, 30)}...`);
    console.log(`   helperWrappedDEK: ${helperWrappedDEK ? helperWrappedDEK.substring(0, 30) + '...' : 'N/A'}`);
    console.log(`\n🎉 Task ${taskId} synced successfully!`);
  } catch (error) {
    console.error(`❌ Error syncing task ${taskId}:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

syncTask8();
