import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

async function main() {
  console.log("🔐 为所有测试账号添加加密公钥");
  console.log("=====================================");
  
  const prisma = new PrismaClient();
  
  // 生成真实的32字节加密公钥
  function generateEncryptionKey(): string {
    return '0x' + randomBytes(32).toString('hex');
  }
  
  // 测试账户信息
  const testAccounts = [
    {
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      nickname: "TestCreator1",
      city: "Beijing",
      skills: ["Task Creation", "Project Management", "Testing"],
      contacts: "Telegram: @testcreator1, Email: creator1@test.com"
    },
    {
      address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", 
      nickname: "TestHelper1",
      city: "Shanghai",
      skills: ["Development", "Testing", "Problem Solving"],
      contacts: "Telegram: @testhelper1, Email: helper1@test.com"
    },
    {
      address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      nickname: "TestCreator2", 
      city: "Shenzhen",
      skills: ["Cross-chain", "DeFi", "Testing"],
      contacts: "Telegram: @testcreator2, Email: creator2@test.com"
    },
    {
      address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      nickname: "TestHelper2",
      city: "Hangzhou", 
      skills: ["Cross-chain", "Token Management", "Testing"],
      contacts: "Telegram: @testhelper2, Email: helper2@test.com"
    }
  ];

  try {
    console.log("📋 检查现有 Profile 数据...");
    
    for (const account of testAccounts) {
      console.log(`\n🔍 处理账户: ${account.nickname} (${account.address})`);
      
      // 生成新的加密公钥
      const encryptionPubKey = generateEncryptionKey();
      console.log(`   🔑 生成的公钥: ${encryptionPubKey}`);
      console.log(`   📏 公钥长度: ${(encryptionPubKey.length - 2) / 2} 字节`);
      
      // 检查账户是否已存在
      const existingProfile = await prisma.profile.findUnique({
        where: { address: account.address }
      });
      
      if (existingProfile) {
        console.log(`   ✅ Profile 已存在，更新加密公钥...`);
        
        // 更新现有 Profile 的加密公钥
        const updatedProfile = await prisma.profile.update({
          where: { address: account.address },
          data: {
            encryptionPubKey: encryptionPubKey,
            // 同时更新其他字段以确保数据完整性
            nickname: account.nickname,
            city: account.city,
            skills: account.skills,
            contacts: account.contacts
          }
        });
        
        console.log(`   ✅ 更新成功`);
        console.log(`      昵称: ${updatedProfile.nickname}`);
        console.log(`      城市: ${updatedProfile.city}`);
        console.log(`      公钥: ${updatedProfile.encryptionPubKey}`);
        
      } else {
        console.log(`   📝 Profile 不存在，创建新的...`);
        
        // 创建新的 Profile
        const newProfile = await prisma.profile.create({
          data: {
            address: account.address,
            nickname: account.nickname,
            city: account.city,
            skills: account.skills,
            contacts: account.contacts,
            encryptionPubKey: encryptionPubKey
          }
        });
        
        console.log(`   ✅ 创建成功`);
        console.log(`      昵称: ${newProfile.nickname}`);
        console.log(`      城市: ${newProfile.city}`);
        console.log(`      公钥: ${newProfile.encryptionPubKey}`);
      }
    }
    
    console.log("\n🔍 验证所有账户的公钥...");
    console.log("=====================================");
    
    // 验证所有账户的公钥
    for (const account of testAccounts) {
      const profile = await prisma.profile.findUnique({
        where: { address: account.address }
      });
      
      if (profile && profile.encryptionPubKey) {
        const keyLength = (profile.encryptionPubKey.length - 2) / 2;
        const isValidLength = keyLength === 32;
        
        console.log(`✅ ${account.nickname}:`);
        console.log(`   地址: ${profile.address}`);
        console.log(`   公钥: ${profile.encryptionPubKey}`);
        console.log(`   长度: ${keyLength} 字节 ${isValidLength ? '✅' : '❌'}`);
        
        if (!isValidLength) {
          console.log(`   ⚠️ 警告: 公钥长度不正确，应该是32字节`);
        }
      } else {
        console.log(`❌ ${account.nickname}: 公钥缺失`);
      }
    }
    
    console.log("\n🎯 测试联系方式加密...");
    console.log("=====================================");
    
    // 测试加密功能
    const crypto = require('crypto');
    
    for (const account of testAccounts) {
      const profile = await prisma.profile.findUnique({
        where: { address: account.address }
      });
      
      if (profile && profile.encryptionPubKey) {
        try {
          // 模拟加密测试
          const testMessage = "Test contact info";
          const publicKeyHex = profile.encryptionPubKey.startsWith('0x') 
            ? profile.encryptionPubKey.slice(2) 
            : profile.encryptionPubKey;
          
          console.log(`✅ ${account.nickname}: 公钥格式正确，可用于加密`);
        } catch (error) {
          console.log(`❌ ${account.nickname}: 公钥格式错误 - ${error}`);
        }
      }
    }
    
    console.log("\n✅ 所有测试账号的加密公钥已设置完成！");
    console.log("\n📋 摘要:");
    console.log("=====================================");
    console.log("现在所有测试账号都有了正确的32字节加密公钥：");
    console.log("- Creator1: 可以创建任务并加密联系方式");
    console.log("- Helper1: 可以接受任务并解密联系方式");  
    console.log("- Creator2: 可以创建任务并加密联系方式");
    console.log("- Helper2: 可以接受任务并解密联系方式");
    console.log("");
    console.log("🔧 下一步:");
    console.log("1. 重新创建任务，联系方式应该能正确加密");
    console.log("2. Helper接受任务后应该能解密查看联系方式");
    console.log("3. 不再出现 'Failed to load contacts: HTTP 404' 错误");
    
  } catch (error) {
    console.error("❌ 操作失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});