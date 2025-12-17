import { ethers } from "hardhat";

async function main() {
  console.log("👤 设置测试账户完整个人资料");
  console.log("=====================================");
  
  // 获取合约实例
  const registerAddress = "0x4b6aB5F819A515382B0dEB6935D793817bB4af28";
  const Register = await ethers.getContractAt("Register", registerAddress);
  
  // 测试账户信息
  const testAccounts = [
    {
      name: "Creator1",
      privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
      profile: {
        username: "TestCreator1",
        email: "creator1@test.com",
        telegram: "@testcreator1",
        contactInfo: "Telegram: @testcreator1, Email: creator1@test.com",
        bio: "Test Creator for EverEcho manual testing",
        skills: ["Testing", "Task Creation", "Project Management"]
      }
    },
    {
      name: "Helper1", 
      privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
      profile: {
        username: "TestHelper1",
        email: "helper1@test.com", 
        telegram: "@testhelper1",
        contactInfo: "Telegram: @testhelper1, Email: helper1@test.com",
        bio: "Test Helper for EverEcho manual testing",
        skills: ["Development", "Testing", "Problem Solving"]
      }
    },
    {
      name: "Creator2",
      privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", 
      profile: {
        username: "TestCreator2",
        email: "creator2@test.com",
        telegram: "@testcreator2", 
        contactInfo: "Telegram: @testcreator2, Email: creator2@test.com",
        bio: "Test Creator for cross-chain reward testing",
        skills: ["Cross-chain", "DeFi", "Testing"]
      }
    },
    {
      name: "Helper2",
      privateKey: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
      profile: {
        username: "TestHelper2", 
        email: "helper2@test.com",
        telegram: "@testhelper2",
        contactInfo: "Telegram: @testhelper2, Email: helper2@test.com", 
        bio: "Test Helper for cross-chain reward testing",
        skills: ["Cross-chain", "Token Management", "Testing"]
      }
    }
  ];

  for (const account of testAccounts) {
    console.log(`\n🔧 设置 ${account.name} 个人资料...`);
    
    try {
      // 创建钱包实例
      const wallet = new ethers.Wallet(account.privateKey, ethers.provider);
      const registerWithSigner = Register.connect(wallet);
      
      // 检查是否已注册
      const isRegistered = await Register.isRegistered(wallet.address);
      if (!isRegistered) {
        console.log(`   ❌ ${account.name} 未注册，请先运行 setupTestAccounts.ts`);
        continue;
      }
      
      // 更新个人资料
      console.log(`   📝 更新用户名: ${account.profile.username}`);
      await registerWithSigner.updateUsername(account.profile.username);
      
      console.log(`   📧 更新邮箱: ${account.profile.email}`);
      await registerWithSigner.updateEmail(account.profile.email);
      
      console.log(`   💬 更新 Telegram: ${account.profile.telegram}`);
      await registerWithSigner.updateTelegram(account.profile.telegram);
      
      console.log(`   📞 更新联系信息: ${account.profile.contactInfo}`);
      await registerWithSigner.updateContactInfo(account.profile.contactInfo);
      
      console.log(`   📖 更新个人简介`);
      await registerWithSigner.updateBio(account.profile.bio);
      
      console.log(`   🛠️ 更新技能标签`);
      await registerWithSigner.updateSkills(account.profile.skills);
      
      // 验证更新结果
      const profile = await Register.getProfile(wallet.address);
      console.log(`   ✅ ${account.name} 个人资料设置完成`);
      console.log(`      用户名: ${profile.username}`);
      console.log(`      邮箱: ${profile.email}`);
      console.log(`      联系信息: ${profile.contactInfo}`);
      
    } catch (error) {
      console.log(`   ❌ ${account.name} 设置失败:`, error.message);
    }
  }
  
  console.log("\n✅ 测试账户个人资料设置完成！");
  console.log("\n🎯 现在你可以:");
  console.log("1. 使用任意测试账户登录前端");
  console.log("2. 直接发布任务 (无需再填写个人信息)");
  console.log("3. 联系信息已自动填充");
  console.log("4. 开始完整的任务测试流程");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});