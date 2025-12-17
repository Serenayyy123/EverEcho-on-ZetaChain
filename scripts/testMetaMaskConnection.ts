import { ethers } from "hardhat";

async function main() {
  console.log("🔗 MetaMask 连接测试指南");
  console.log("=====================================");
  
  const addresses = {
    ECHO: "0x18E317A7D70d8fBf8e6E893616b52390EbBdb629",
    MockZRC20: "0xc96304e3c037f81dA488ed9dEa1D8F2a48278a75"
  };

  console.log("📋 当前合约状态:");
  console.log(`ECHO 代币: ${addresses.ECHO}`);
  console.log(`MockZRC20: ${addresses.MockZRC20}`);
  console.log(`网络: localhost:8545 (ChainId: 31337)`);
  console.log("");

  console.log("🦊 MetaMask 故障排除步骤:");
  console.log("=====================================");
  console.log("1. 在 MetaMask 中点击 '设置' → '高级' → '重置账户'");
  console.log("   (这会清除交易历史，但不会删除账户)");
  console.log("");
  console.log("2. 或者尝试以下步骤:");
  console.log("   - 断开网站连接: 设置 → 已连接的网站 → localhost → 断开");
  console.log("   - 切换到其他网络，再切换回 localhost");
  console.log("   - 重启浏览器");
  console.log("");
  console.log("3. 如果仍然无法添加代币，可以跳过这一步:");
  console.log("   - 前端会自动读取 ECHO 余额");
  console.log("   - 你可以正常创建和接受任务");
  console.log("   - 只是在 MetaMask 中看不到代币余额显示");
  console.log("");

  console.log("🎯 测试建议:");
  console.log("=====================================");
  console.log("即使 MetaMask 中看不到代币，你仍然可以:");
  console.log("1. 访问 http://localhost:5173/");
  console.log("2. 连接钱包 (选择测试账户)");
  console.log("3. 前端会显示你的 ECHO 余额: 100.0 ECHO");
  console.log("4. 创建任务 (reward = 10 ECHO)");
  console.log("5. 切换账户接受任务");
  console.log("6. 完成整个测试流程");
  console.log("");

  // 验证测试账户余额
  const testAccount = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  try {
    const echoContract = await ethers.getContractAt("EOCHOToken", addresses.ECHO);
    const balance = await echoContract.balanceOf(testAccount);
    console.log("✅ 验证: Creator1 账户确实有", ethers.formatEther(balance), "ECHO");
    console.log("   前端会正确显示这个余额");
  } catch (error) {
    console.log("❌ 余额查询失败");
  }

  console.log("");
  console.log("🚀 立即开始测试:");
  console.log("1. 打开 http://localhost:5173/");
  console.log("2. 连接 MetaMask (使用 Creator1 账户)");
  console.log("3. 开始创建第一个任务!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});