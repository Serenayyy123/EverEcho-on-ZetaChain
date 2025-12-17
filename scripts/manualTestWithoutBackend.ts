import { ethers } from "hardhat";

async function main() {
  console.log("🎯 EverEcho 手动测试 - 无后端依赖版本");
  console.log("=====================================");
  
  // 合约地址
  const addresses = {
    EOCHOToken: "0x18E317A7D70d8fBf8e6E893616b52390EbBdb629",
    Register: "0x4b6aB5F819A515382B0dEB6935D793817bB4af28",
    TaskEscrow: "0xD5ac451B0c50B9476107823Af206eD814a2e2580",
    Gateway: "0xc0F115A19107322cFBf1cDBC7ea011C19EbDB4F8",
    MockZRC20: "0xc96304e3c037f81dA488ed9dEa1D8F2a48278a75"
  };

  // 测试账户
  const creator1Key = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
  const helper1Key = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
  
  const creator1 = new ethers.Wallet(creator1Key, ethers.provider);
  const helper1 = new ethers.Wallet(helper1Key, ethers.provider);

  console.log("👥 测试账户:");
  console.log(`Creator1: ${creator1.address}`);
  console.log(`Helper1: ${helper1.address}`);
  console.log("");

  // 获取合约实例
  const EOCHOToken = await ethers.getContractAt("EOCHOToken", addresses.EOCHOToken);
  const TaskEscrow = await ethers.getContractAt("TaskEscrow", addresses.TaskEscrow);

  // 检查余额
  const creator1Balance = await EOCHOToken.balanceOf(creator1.address);
  const helper1Balance = await EOCHOToken.balanceOf(helper1.address);
  
  console.log("💰 初始余额:");
  console.log(`Creator1: ${ethers.formatEther(creator1Balance)} ECHO`);
  console.log(`Helper1: ${ethers.formatEther(helper1Balance)} ECHO`);
  console.log("");

  console.log("🎯 测试指南 - 无需后端:");
  console.log("=====================================");
  console.log("");
  
  console.log("📋 方法 1: 直接使用前端 (推荐)");
  console.log("1. 访问: http://localhost:5173/");
  console.log("2. 连接 MetaMask (localhost, ChainId: 31337)");
  console.log("3. 导入 Creator1 私钥:");
  console.log(`   ${creator1Key}`);
  console.log("4. 前端会显示 ECHO 余额，忽略个人资料错误");
  console.log("5. 直接点击 '发布任务' 或 '浏览任务'");
  console.log("6. 在任务发布页面填写联系信息:");
  console.log("   联系方式: Telegram: @testcreator1, Email: creator1@test.com");
  console.log("7. 设置奖励 10 ECHO，发布任务");
  console.log("8. 切换到 Helper1 账户接受任务");
  console.log("");

  console.log("📋 方法 2: 纯合约交互测试");
  console.log("如果前端有问题，可以运行:");
  console.log("npx hardhat run scripts/verifyStage4_7.local.ts --network localhost");
  console.log("这会完整测试 ECHO 结算和跨链奖励功能");
  console.log("");

  console.log("🔧 前端故障排除:");
  console.log("- 如果看到 '500 Internal Server Error'，忽略它");
  console.log("- 个人资料页面可能显示错误，但任务功能正常");
  console.log("- 重点测试: 创建任务 → 接受任务 → 完成任务");
  console.log("- ECHO 余额和交易功能都会正常工作");
  console.log("");

  console.log("✅ 核心测试目标:");
  console.log("1. 验证 ECHO 代币余额显示正确");
  console.log("2. 验证任务创建和接受流程");
  console.log("3. 验证资金结算 (Helper 收到 29.8 ECHO)");
  console.log("4. 验证跨链奖励功能 (如果需要)");
  console.log("");
  
  console.log("🚀 现在可以开始测试了!");
  console.log("重点关注合约交互，忽略后端 API 错误。");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});