import { ethers } from "hardhat";

async function main() {
  console.log("👤 通过后端 API 设置测试账户个人资料");
  console.log("=====================================");
  
  // 测试账户信息
  const testAccounts = [
    {
      name: "Creator1",
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
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
      address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
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
      address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
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
      address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
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

  console.log("🔧 设置方法：");
  console.log("=====================================");
  console.log("由于 Register 合约只存储 profileURI，个人资料需要通过以下方式设置：");
  console.log("");
  console.log("方法 1: 前端手动设置");
  console.log("1. 使用测试账户登录前端 http://localhost:5173/");
  console.log("2. 点击个人资料/设置");
  console.log("3. 填写个人信息并保存");
  console.log("");
  console.log("方法 2: 直接发布任务");
  console.log("1. 在发布任务页面会提示填写联系信息");
  console.log("2. 填写后即可发布任务");
  console.log("");

  console.log("📋 建议的测试账户信息：");
  console.log("=====================================");
  
  for (const account of testAccounts) {
    console.log(`\n${account.name} (${account.address}):`);
    console.log(`  用户名: ${account.profile.username}`);
    console.log(`  邮箱: ${account.profile.email}`);
    console.log(`  Telegram: ${account.profile.telegram}`);
    console.log(`  联系信息: ${account.profile.contactInfo}`);
    console.log(`  个人简介: ${account.profile.bio}`);
    console.log(`  技能: ${account.profile.skills.join(", ")}`);
  }

  console.log("\n🎯 快速测试流程：");
  console.log("=====================================");
  console.log("1. 使用 Creator1 账户登录前端");
  console.log("2. 点击 '发布任务'");
  console.log("3. 如果提示需要联系信息，填写:");
  console.log("   联系信息: Telegram: @testcreator1, Email: creator1@test.com");
  console.log("4. 设置任务奖励: 10 ECHO");
  console.log("5. 发布任务");
  console.log("6. 切换到 Helper1 账户接受任务");
  console.log("");
  console.log("✅ 现在可以开始测试了！");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});