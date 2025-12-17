#!/usr/bin/env tsx

/**
 * 修复缺少加密数据的Task
 * 为有contactsPlaintext但缺少contactsEncryptedPayload的Task重新加密
 */

import { PrismaClient } from '@prisma/client';
import { encryptAndStoreContacts } from '../src/services/encryptionService';

async function fixTaskEncryption() {
  console.log('🔧 修复Task加密数据');
  console.log('==================');

  const prisma = new PrismaClient();

  try {
    // 1. 找到需要修复的Task
    console.log('\n1. 查找需要修复的Task');
    console.log('---------------------');
    
    const tasksNeedingFix = await prisma.task.findMany({
      where: {
        contactsEncryptedPayload: '',
        contactsPlaintext: {
          not: null
        }
      },
      select: {
        chainId: true,
        taskId: true,
        creator: true,
        contactsPlaintext: true,
      },
    });

    console.log(`找到需要修复的Task: ${tasksNeedingFix.length}个`);

    if (tasksNeedingFix.length === 0) {
      console.log('✅ 没有需要修复的Task');
      return;
    }

    // 2. 为每个Task重新加密联系方式
    console.log('\n2. 重新加密联系方式');
    console.log('------------------');

    for (const task of tasksNeedingFix) {
      console.log(`\n处理Task ${task.taskId} (Chain: ${task.chainId})`);
      console.log(`Creator: ${task.creator}`);
      console.log(`联系方式: ${task.contactsPlaintext}`);

      try {
        // 获取Creator的Profile
        const creatorProfile = await prisma.profile.findUnique({
          where: { address: task.creator! },
          select: { encryptionPubKey: true }
        });

        if (!creatorProfile || !creatorProfile.encryptionPubKey) {
          console.log(`❌ Creator ${task.creator} 没有有效的encryptionPubKey，跳过`);
          continue;
        }

        console.log(`✅ Creator有有效的encryptionPubKey: ${creatorProfile.encryptionPubKey.slice(0, 16)}...`);

        // 重新加密联系方式
        const result = await encryptAndStoreContacts(
          task.chainId,
          task.taskId,
          task.contactsPlaintext!,
          creatorProfile.encryptionPubKey,
          null // 没有helper
        );

        if (result) {
          console.log('✅ 加密成功，更新Task数据');
          
          // 更新Task的contactsEncryptedPayload
          await prisma.task.update({
            where: {
              chainId_taskId: {
                chainId: task.chainId,
                taskId: task.taskId
              }
            },
            data: {
              contactsEncryptedPayload: result.contactsEncryptedPayload
            }
          });

          console.log('✅ Task数据更新完成');
        } else {
          console.log('❌ 加密失败');
        }

      } catch (error) {
        console.error(`❌ 处理Task ${task.taskId}时出错:`, error);
      }
    }

    // 3. 验证修复结果
    console.log('\n3. 验证修复结果');
    console.log('---------------');

    const allTasks = await prisma.task.findMany({
      select: {
        chainId: true,
        taskId: true,
        contactsEncryptedPayload: true,
        contactsPlaintext: true,
      },
    });

    const tasksWithEncryption = allTasks.filter(t => t.contactsEncryptedPayload);
    const tasksWithoutEncryption = allTasks.filter(t => !t.contactsEncryptedPayload);

    console.log(`总Task数量: ${allTasks.length}`);
    console.log(`✅ 有加密数据的Task: ${tasksWithEncryption.length}`);
    console.log(`❌ 仍缺少加密数据的Task: ${tasksWithoutEncryption.length}`);

    if (tasksWithoutEncryption.length > 0) {
      console.log('\n仍需要修复的Task:');
      tasksWithoutEncryption.forEach((task, index) => {
        console.log(`${index + 1}. Task ${task.taskId} (Chain: ${task.chainId})`);
        console.log(`   contactsPlaintext: ${task.contactsPlaintext ? '有' : '无'}`);
      });
    }

    // 4. 检查ContactKey记录
    console.log('\n4. ContactKey记录状态');
    console.log('--------------------');

    const allContactKeys = await prisma.contactKey.findMany();
    console.log(`ContactKey记录数量: ${allContactKeys.length}`);

    console.log('\n✅ 修复完成！');

  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行修复
fixTaskEncryption().catch(console.error);