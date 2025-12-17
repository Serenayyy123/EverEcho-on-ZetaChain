#!/usr/bin/env tsx

/**
 * 为测试用户生成真正的encryptionPubKey
 * 替换mock数据为有效的加密公钥
 */

import { PrismaClient } from '@prisma/client';
import * as nacl from 'tweetnacl';

function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateEncryptionKeyPair(): {
  publicKey: string;
  privateKey: string;
} {
  const keyPair = nacl.box.keyPair();
  
  return {
    publicKey: uint8ArrayToHex(keyPair.publicKey),
    privateKey: uint8ArrayToHex(keyPair.secretKey),
  };
}

async function generateRealEncryptionKeys() {
  console.log('🔑 为测试用户生成真正的encryptionPubKey');
  console.log('========================================');

  const prisma = new PrismaClient();

  try {
    // 1. 找到所有测试用户
    const testProfiles = await prisma.profile.findMany({
      where: {
        OR: [
          { encryptionPubKey: { startsWith: 'test_' } },
          { nickname: { startsWith: 'Test' } }
        ]
      }
    });

    console.log(`找到测试用户: ${testProfiles.length}个\n`);

    if (testProfiles.length === 0) {
      console.log('✅ 没有找到需要更新的测试用户');
      return;
    }

    // 2. 为每个测试用户生成真正的密钥对
    const keyPairs: Record<string, { publicKey: string; privateKey: string }> = {};

    for (const profile of testProfiles) {
      console.log(`为用户 ${profile.nickname} (${profile.address}) 生成密钥对...`);
      
      const keyPair = generateEncryptionKeyPair();
      keyPairs[profile.address] = keyPair;
      
      console.log(`✅ 生成成功:`);
      console.log(`   公钥: ${keyPair.publicKey}`);
      console.log(`   私钥: ${keyPair.privateKey.slice(0, 16)}... (已截断显示)`);
      console.log('');

      // 更新数据库中的encryptionPubKey
      await prisma.profile.update({
        where: { address: profile.address },
        data: { encryptionPubKey: keyPair.publicKey }
      });

      console.log(`✅ 数据库已更新\n`);
    }

    // 3. 验证更新结果
    console.log('3. 验证更新结果');
    console.log('---------------');

    const updatedProfiles = await prisma.profile.findMany({
      where: {
        address: { in: testProfiles.map(p => p.address) }
      },
      select: {
        address: true,
        nickname: true,
        encryptionPubKey: true
      }
    });

    updatedProfiles.forEach((profile, index) => {
      const isValidHex = /^[0-9a-fA-F]{64}$/.test(profile.encryptionPubKey);
      console.log(`${index + 1}. ${profile.nickname} (${profile.address})`);
      console.log(`   encryptionPubKey: ${profile.encryptionPubKey}`);
      console.log(`   长度: ${profile.encryptionPubKey.length} 字符`);
      console.log(`   有效性: ${isValidHex ? '✅ 有效' : '❌ 无效'}`);
      console.log('');
    });

    // 4. 保存私钥信息（仅用于测试）
    console.log('4. 私钥信息（仅用于测试环境）');
    console.log('-----------------------------');
    console.log('⚠️  注意：以下私钥仅用于测试环境，请勿在生产环境使用！');
    console.log('');

    Object.entries(keyPairs).forEach(([address, keyPair]) => {
      const profile = testProfiles.find(p => p.address === address);
      console.log(`${profile?.nickname} (${address}):`);
      console.log(`  私钥: ${keyPair.privateKey}`);
      console.log(`  localStorage key: encryption_key_31337_${address.toLowerCase()}`);
      console.log('');
    });

    console.log('💡 如果需要在前端测试联系方式解密，请将对应的私钥手动添加到浏览器localStorage中。');
    console.log('');
    console.log('✅ 所有测试用户的encryptionPubKey已更新为真正的加密公钥！');

  } catch (error) {
    console.error('❌ 生成过程中出现错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateRealEncryptionKeys().catch(console.error);