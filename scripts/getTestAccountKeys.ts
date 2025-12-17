import { ethers } from "hardhat";

async function main() {
  console.log("🔑 EverEcho 测试账户私钥");
  console.log("=====================================");
  console.log("");
  
  // Hardhat 默认账户（前10个）
  const accounts = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Account #0 (Deployer)
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Account #1 (Creator1)
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Account #2 (Helper1)
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // Account #3 (Creator2)
    "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", // Account #4 (Helper2)
  ];

  const labels = [
    "Deployer (管理员)",
    "Creator1 (任务发布者1)",
    "Helper1 (任务执行者1)", 
    "Creator2 (任务发布者2)",
    "Helper2 (任务执行者2)"
  ];

  for (let i = 0; i < accounts.length; i++) {
    const wallet = new ethers.Wallet(accounts[i]);
    console.log(`📋 ${labels[i]}`);
    console.log(`   地址: ${wallet.address}`);
    console.log(`   私钥: ${accounts[i]}`);
    console.log("");
  }

  console.log("🦊 MetaMask 导入步骤：");
  console.log("1. 打开 MetaMask");
  console.log("2. 点击账户图标 → 导入账户");
  console.log("3. 选择 '私钥' 方式");
  console.log("4. 粘贴上述任一私钥");
  console.log("5. 确认网络已切换到 localhost:8545 (ChainId: 31337)");
  console.log("");
  console.log("💡 建议测试流程：");
  console.log("- 用 Creator1 创建任务");
  console.log("- 切换到 Helper1 接受任务");
  console.log("- 用 Creator2 创建跨链奖励任务");
  console.log("- 切换到 Helper2 测试跨链奖励领取");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});