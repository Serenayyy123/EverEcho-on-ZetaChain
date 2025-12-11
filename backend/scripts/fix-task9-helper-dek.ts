/**
 * 修复 Task 9 的 helperWrappedDEK
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { generateDEK, wrapDEK, encryptContacts } from '../src/services/encryptionService';

dotenv.config();

const prisma = new PrismaClient();

async function fixTask9HelperDEK() {
  console.log('=== 修复 Task 9 的 helperWrappedDEK ===\n');

  try {
    const taskId = '9';
    const helperAddress = '0x2bF490F5a7Be8e8AC83020d77d240c4E39165C30';
    const creatorAddress = '0x18D5eeDd85Caf7E96eEcB5c0a50514f810f98541';

    // 1. 获取 Task 9
    const task = await prisma.task.findUnique({
      where: { taskId },
    });

    if (!task) {
      console.log('❌ Task 9 不存在');
      return;
    }

    console.log('Task 9:');
    console.log(`  title: ${task.title}`);
    console.log(`  contactsPlaintext: ${task.contactsPlaintext}`);
    console.log('');

    // 2. 获取 Creator 和 Helper 的公钥
    const creatorProfile = await prisma.profile.findUnique({
      where: { address: creatorAddress },
    });

    const helperProfile = await prisma.profile.findUnique({
      where: { address: helperAddress },
    });

    if (!creatorProfile || !creatorProfile.encryptionPubKey) {
      console.log('❌ Creator 公钥不存在');
      return;
    }

    if (!helperProfile || !helperProfile.encryptionPubKey) {
      console.log('❌ Helper 公钥不存在');
      return;
    }

    console.log('公钥:');
    console.log(`  Creator: ${creatorProfile.encryptionPubKey}`);
    console.log(`  Helper: ${helperProfile.encryptionPubKey}`);
    console.log('');

    // 3. 重新生成 DEK 并包裹
    const dek = generateDEK();
    const encryptedPayload = encryptContacts(task.contactsPlaintext!, dek);
    const creatorWrappedDEK = wrapDEK(dek, creatorProfile.encryptionPubKey);
    const helperWrappedDEK = wrapDEK(dek, helperProfile.encryptionPubKey);

    console.log('生成的 DEK:');
    console.log(`  creatorWrappedDEK: ${creatorWrappedDEK.slice(0, 40)}...`);
    console.log(`  helperWrappedDEK: ${helperWrappedDEK.slice(0, 40)}...`);
    console.log('');

    // 4. 更新数据库
    await prisma.$transaction(async (tx) => {
      // 更新 ContactKey
      await tx.contactKey.update({
        where: { taskId },
        data: {
          creatorWrappedDEK,
          helperWrappedDEK,
        },
      });

      // 更新 Task 的加密 payload
      await tx.task.update({
        where: { taskId },
        data: {
          contactsEncryptedPayload: encryptedPayload,
        },
      });
    });

    console.log('✅ Task 9 的 helperWrappedDEK 已修复');
    console.log('');

    // 5. 验证
    const updatedContactKey = await prisma.contactKey.findUnique({
      where: { taskId },
    });

    console.log('验证结果:');
    console.log(`  creatorWrappedDEK: ${updatedContactKey?.creatorWrappedDEK ? '存在' : '不存在'}`);
    console.log(`  helperWrappedDEK: ${updatedContactKey?.helperWrappedDEK ? '存在' : '不存在'}`);

  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTask9HelperDEK();
