#!/usr/bin/env tsx

/**
 * 检查用户encryptionPubKey状态
 * 分析哪些用户缺少加密公钥，以及原因
 */

import { PrismaClient } from '@prisma/client';

async function checkEncryptionPubKeyStatus() {
  console.log('🔍 检查用户encryptionPubKey状态');
  console.log('================================');

  const prisma = new PrismaClient();

  try {
    // 1. 获取所有Profile数据
    console.log('\n1. 数据库Profile统计');
    console.log('-------------------');
    
    const allProfiles = await prisma.profile.findMany({
      select: {
        address: true,
        nickname: true,
        encryptionPubKey: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`总Profile数量: ${allProfiles.length}`);

    if (allProfiles.length === 0) {
      console.log('❌ 数据库中没有Profile数据');
      console.log('💡 这可能是因为：');
      console.log('   - 用户还没有创建Profile');
      console.log('   - 数据库连接问题');
      console.log('   - 数据被清空了');
      return;
    }

    // 2. 分析encryptionPubKey状态
    console.log('\n2. encryptionPubKey状态分析');
    console.log('---------------------------');

    const profilesWithKey = allProfiles.filter(p => p.encryptionPubKey && p.encryptionPubKey.length > 0);
    const profilesWithoutKey = allProfiles.filter(p => !p.encryptionPubKey || p.encryptionPubKey.length === 0);

    console.log(`✅ 有encryptionPubKey的用户: ${profilesWithKey.length}`);
    console.log(`❌ 缺少encryptionPubKey的用户: ${profilesWithoutKey.length}`);

    // 3. 显示缺少encryptionPubKey的用户详情
    if (profilesWithoutKey.length > 0) {
      console.log('\n3. 缺少encryptionPubKey的用户详情');
      console.log('--------------------------------');
      
      profilesWithoutKey.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.nickname} (${profile.address})`);
        console.log(`   创建时间: ${profile.createdAt.toISOString()}`);
        console.log(`   更新时间: ${profile.updatedAt.toISOString()}`);
        console.log(`   encryptionPubKey: ${profile.encryptionPubKey || '(空)'}`);
        console.log('');
      });

      console.log('🚨 问题分析:');
      console.log('这些用户在创建Profile时没有生成encryptionPubKey');
      console.log('可能的原因:');
      console.log('1. 使用了旧版本的前端代码（没有密钥生成逻辑）');
      console.log('2. Profile创建过程中出现错误，密钥生成被跳过');
      console.log('3. 直接通过API创建Profile，没有包含encryptionPubKey');
    }

    // 4. 显示有encryptionPubKey的用户详情
    if (profilesWithKey.length > 0) {
      console.log('\n4. 有encryptionPubKey的用户详情');
      console.log('------------------------------');
      
      profilesWithKey.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.nickname} (${profile.address})`);
        console.log(`   创建时间: ${profile.createdAt.toISOString()}`);
        console.log(`   encryptionPubKey: ${profile.encryptionPubKey.slice(0, 16)}...`);
        console.log('');
      });
    }

    // 5. 检查Task数据中的加密状态
    console.log('\n5. Task加密状态检查');
    console.log('------------------');

    const allTasks = await prisma.task.findMany({
      select: {
        chainId: true,
        taskId: true,
        creator: true,
        contactsEncryptedPayload: true,
        contactsPlaintext: true,
      },
    });

    console.log(`总Task数量: ${allTasks.length}`);

    if (allTasks.length > 0) {
      const tasksWithEncryption = allTasks.filter(t => t.contactsEncryptedPayload);
      const tasksWithoutEncryption = allTasks.filter(t => !t.contactsEncryptedPayload);

      console.log(`✅ 有加密联系方式的Task: ${tasksWithEncryption.length}`);
      console.log(`❌ 缺少加密联系方式的Task: ${tasksWithoutEncryption.length}`);

      // 检查ContactKey数据
      const allContactKeys = await prisma.contactKey.findMany({
        select: {
          chainId: true,
          taskId: true,
          creatorWrappedDEK: true,
          helperWrappedDEK: true,
        },
      });

      console.log(`ContactKey记录数量: ${allContactKeys.length}`);

      if (tasksWithoutEncryption.length > 0) {
        console.log('\n缺少加密数据的Task详情:');
        tasksWithoutEncryption.forEach((task, index) => {
          console.log(`${index + 1}. Task ${task.taskId} (Chain: ${task.chainId})`);
          console.log(`   Creator: ${task.creator}`);
          console.log(`   contactsEncryptedPayload: ${task.contactsEncryptedPayload ? '有' : '无'}`);
          console.log(`   contactsPlaintext: ${task.contactsPlaintext ? '有' : '无'}`);
          
          // 查找对应的ContactKey
          const contactKey = allContactKeys.find(ck => 
            ck.chainId === task.chainId && ck.taskId === task.taskId
          );
          
          if (contactKey) {
            console.log(`   creatorWrappedDEK: ${contactKey.creatorWrappedDEK ? '有' : '无'}`);
            console.log(`   helperWrappedDEK: ${contactKey.helperWrappedDEK ? '有' : '无'}`);
          } else {
            console.log(`   ContactKey记录: 无`);
          }
          console.log('');
        });
      }
    }

    // 6. 提供修复建议
    console.log('\n6. 修复建议');
    console.log('-----------');

    if (profilesWithoutKey.length > 0) {
      console.log('🔧 对于缺少encryptionPubKey的用户:');
      console.log('');
      console.log('方案A: 前端自动修复 (推荐)');
      console.log('   - 修改useProfile hook');
      console.log('   - 检测到encryptionPubKey缺失时自动生成');
      console.log('   - 更新Profile数据');
      console.log('');
      console.log('方案B: 后端批量修复');
      console.log('   - 创建migration脚本');
      console.log('   - 为所有缺失的用户生成encryptionPubKey');
      console.log('   - 注意：无法生成对应的私钥给用户');
      console.log('');
      console.log('方案C: 用户手动修复');
      console.log('   - 在Profile页面添加"重新生成加密密钥"按钮');
      console.log('   - 用户主动触发密钥生成');
      console.log('   - 更新Profile数据');
    }

    if (allTasks.length > 0) {
      const tasksWithoutEncryption = allTasks.filter(t => !t.contactsEncryptedPayload);
      if (tasksWithoutEncryption.length > 0) {
        console.log('');
        console.log('🔧 对于缺少加密数据的Task:');
        console.log('   - 这些Task的联系方式解密将会失败');
        console.log('   - 需要重新加密联系方式数据');
        console.log('   - 或者使用简化的访问控制方案');
      }
    }

    // 7. 检查前端localStorage中的私钥
    console.log('\n7. 前端私钥存储检查');
    console.log('--------------------');
    console.log('💡 无法从后端检查前端localStorage');
    console.log('请在浏览器中手动检查:');
    console.log('');
    console.log('1. 打开浏览器开发者工具');
    console.log('2. 切换到Application/Storage标签');
    console.log('3. 查看localStorage');
    console.log('4. 寻找以"encryption_key_"开头的项目');
    console.log('');
    console.log('如果用户有Profile但没有对应的私钥，需要重新生成密钥对。');

  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行检查
checkEncryptionPubKeyStatus().catch(console.error);