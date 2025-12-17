#!/usr/bin/env tsx

/**
 * 检查Profile数据的详细内容
 */

import { PrismaClient } from '@prisma/client';

async function inspectProfileData() {
  console.log('🔍 检查Profile数据详情');
  console.log('=====================');

  const prisma = new PrismaClient();

  try {
    const allProfiles = await prisma.profile.findMany();
    
    console.log(`总Profile数量: ${allProfiles.length}\n`);

    allProfiles.forEach((profile, index) => {
      console.log(`${index + 1}. Profile详情:`);
      console.log(`   地址: ${profile.address}`);
      console.log(`   昵称: ${profile.nickname}`);
      console.log(`   城市: ${profile.city}`);
      console.log(`   技能: ${profile.skills}`);
      console.log(`   联系方式: ${profile.contacts || '(无)'}`);
      console.log(`   encryptionPubKey: "${profile.encryptionPubKey}"`);
      console.log(`   encryptionPubKey长度: ${profile.encryptionPubKey.length} 字符`);
      console.log(`   是否为有效hex: ${/^[0-9a-fA-F]+$/.test(profile.encryptionPubKey)}`);
      console.log(`   创建时间: ${profile.createdAt.toISOString()}`);
      console.log(`   更新时间: ${profile.updatedAt.toISOString()}`);
      console.log('');
    });

    // 检查是否是测试数据
    const testProfiles = allProfiles.filter(p => 
      p.encryptionPubKey.startsWith('test_') || 
      p.nickname.startsWith('Test')
    );

    if (testProfiles.length > 0) {
      console.log('🚨 发现测试数据:');
      console.log(`测试Profile数量: ${testProfiles.length}`);
      console.log('这些Profile的encryptionPubKey不是有效的hex格式');
      console.log('');
      console.log('解决方案:');
      console.log('1. 清除测试数据');
      console.log('2. 或者为测试Profile生成有效的encryptionPubKey');
    }

  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectProfileData().catch(console.error);