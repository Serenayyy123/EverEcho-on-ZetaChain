import { ethers } from "hardhat";

async function main() {
  console.log("🔍 验证前端连接状态");
  console.log("=====================================");
  
  // 检查合约地址
  const addresses = {
    EOCHOToken: "0x18E317A7D70d8fBf8e6E893616b52390EbBdb629",
    Register: "0x4b6aB5F819A515382B0dEB6935D793817bB4af28",
    TaskEscrow: "0xD5ac451B0c50B9476107823Af206eD814a2e2580",
    Gateway: "0xc0F115A19107322cFBf1cDBC7ea011C19EbDB4F8",
    MockZRC20: "0xc96304e3c037f81dA488ed9dEa1D8F2a48278a75"
  };

  console.log("📋 当前合约地址:");
  for (const [name, address] of Object.entries(addresses)) {
    console.log(`${name}: ${address}`);
  }
  console.log("");

  // 检查测试账户注册状态
  const testAccount = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Creator1
  
  try {
    const Register = await ethers.getContractAt("Register", addresses.Register);
    const EOCHOToken = await ethers.getContractAt("EOCHOToken", addresses.EOCHOToken);
    
    const isRegistered = await Register.isRegistered(testAccount);
    const profileURI = await Register.profileURI(testAccount);
    const echoBalance = await EOCHOToken.balanceOf(testAccount);
    
    console.log("👤 Creator1 账户状态:");
    console.log(`地址: ${testAccount}`);
    console.log(`已注册: ${isRegistered}`);
    console.log(`ProfileURI: ${profileURI}`);
    console.log(`ECHO 余额: ${ethers.formatEther(echoBalance)} ECHO`);
    console.log("");
    
    if (isRegistered) {
      console.log("✅ 账户已正确注册，前端应该能正常显示");
    } else {
      console.log("❌ 账户未注册，需要重新运行 setupTestAccounts.ts");
    }
    
  } catch (error) {
    console.log("❌ 合约连接失败:", error.message);
  }

  console.log("");
  console.log("🔧 故障排除步骤:");
  console.log("1. 刷新浏览器页面 (Ctrl+F5 强制刷新)");
  console.log("2. 确认 MetaMask 网络是 localhost (ChainId: 31337)");
  console.log("3. 确认已导入 Creator1 私钥:");
  console.log("   0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
  console.log("4. 在 MetaMask 中切换到 Creator1 账户");
  console.log("5. 重新连接钱包到前端");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});