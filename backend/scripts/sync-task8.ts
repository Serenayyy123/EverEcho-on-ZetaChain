/**
 * 手动同步 Task 8 的 ContactKey
 */

import { PrismaClient } from '@prisma/client';
import { generateDEK, wrapDEK, encryptContacts } from '../src/services/encryptionService';

const prisma = new PrismaClient();

async function syncTask8() {
  const taskId = '8';

  try {
    console.log(`\n🔄 Syncing Task ${taskId}...`);

    // 1. 检查任务是否存在
    const task = await prisma.task.findUnique({
      where: { taskId },
    });

    if (!task) {
      console.error(`❌ Task ${taskId} not found in database`);
      return;
    }

    console.log(`✅ Task ${taskId} found`);
    console.log(`   Title: ${task.title}`);
    console.log(`   Contacts: ${task.contactsPlaintext}`);

    // 2. 检查 ContactKey 是否已存在
    const existingKey = await prisma.contactKey.findUnique({
      where: { taskId },
    });

    if (existingKey) {
      console.log(`⚠️  ContactKey already exists for task ${taskId}`);
      console.log(`   creatorWrappedDEK: ${existingKey.creatorWrappedDEK.substring(0, 20)}...`);
      console.log(`   helperWrappedDEK: ${existingKey.helperWrappedDEK ? existingKey.helperWrappedDEK.substring(0, 20) + '...' : 'N/A'}`);
      return;
    }

    // 3. 获取 creator 的 profile
    // 从链上读取 creator 地址
    const creatorAddress = '0x2bF490F5a7Be8e8AC83020d77d240c4E39165C30'; // Task 8 的 creator

    const creatorProfile = await prisma.profile.findUnique({
      where: { address: creatorAddress },
    });

    if (!creatorProfile || !creatorProfile.encryptionPubKey) {
      console.error(`❌ Creator ${creatorAddress} not found or has no encryption key`);
      return;
    }

    console.log(`✅ Creator profile found: ${creatorProfile.username}`);

    // 4. 获取 helper 的 profile
    const helperAddress = '0xD68a76259d4100A2622D643d5e62F5F92C28C4fe'; // Task 8 的 helper

    const helperProfile = await prisma.profile.findUnique({
      where: { address: helperAddress },
    });

    if (!helperProfile || !helperProfile.encryptionPubKey) {
      console.error(`❌ Helper ${helperAddress} not found or has no encryption key`);
      return;
    }

    console.log(`✅ Helper profile found: ${helperProfile.username}`);

    // 5. 生成 DEK 和加密
    const contactsPlaintext = task.contactsPlaintext || 'N/A';
    const dek = generateDEK();

    // 包裹 DEK 给 creator 和 helper
    const creatorWrappedDEK = wrapDEK(dek, creatorProfile.encryptionPubKey);
    const helperWrappedDEK = wrapDEK(dek, helperProfile.encryptionPubKey);

    // 6. 创建 ContactKey
    await prisma.contactKey.create({
      data: {
        taskId,
        creatorWrappedDEK,
        helperWrappedDEK,
      },
    });

    console.log(`\n✅ ContactKey created for task ${taskId}`);
    console.log(`   creatorWrappedDEK: ${creatorWrappedDEK.substring(0, 20)}...`);
    console.log(`   helperWrappedDEK: ${helperWrappedDEK.substring(0, 20)}...`);
    console.log(`\n🎉 Task ${taskId} synced successfully!`);
  } catch (error) {
    console.error(`❌ Error syncing task ${taskId}:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

syncTask8();
