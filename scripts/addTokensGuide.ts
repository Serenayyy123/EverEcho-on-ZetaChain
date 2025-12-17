import { ethers } from "hardhat";

async function main() {
  console.log("🪙 MetaMask 代币添加指南");
  console.log("=====================================");
  console.log("");
  
  console.log("📋 合约地址信息：");
  console.log(`ECHO 代币地址: 0x1c85638e118b37167e9298c2268758e058DdfDA0`);
  console.log(`MockZRC20 地址: 0x86A2EE8FAf9A840F7a2c64CA3d51209F9A02081D`);
  console.log("");
  
  console.log("🦊 MetaMask 添加步骤：");
  console.log("1. 在 MetaMask 主界面点击 '导入代币'");
  console.log("2. 选择 '自定义代币'");
  console.log("3. 输入代币合约地址");
  console.log("4. 符号和小数位数会自动填充");
  console.log("5. 点击 '添加自定义代币'");
  console.log("");
  
  // 验证合约是否正常工作
  try {
    const EOCHOToken = await ethers.getContractAt("EOCHOToken", "0x1c85638e118b37167e9298c2268758e058DdfDA0");
    const MockZRC20 = await ethers.getContractAt("MockZRC20", "0x86A2EE8FAf9A840F7a2c64CA3d51209F9A02081D");
    
    const echoName = await EOCHOToken.name();
    const echoSymbol = await EOCHOToken.symbol();
    const echoDecimals = await EOCHOToken.decimals();
    
    const zrc20Name = await MockZRC20.name();
    const zrc20Symbol = await MockZRC20.symbol();
    const zrc20Decimals = await MockZRC20.decimals();
    
    console.log("✅ 代币合约验证成功：");
    console.log(`ECHO: ${echoName} (${echoSymbol}) - ${echoDecimals} decimals`);
    console.log(`MockZRC20: ${zrc20Name} (${zrc20Symbol}) - ${zrc20Decimals} decimals`);
    console.log("");
    
    // 检查测试账户余额
    const creator1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const helper1 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    
    const creator1Echo = await EOCHOToken.balanceOf(creator1);
    const helper1Echo = await EOCHOToken.balanceOf(helper1);
    
    console.log("💰 测试账户余额确认：");
    console.log(`Creator1 ECHO: ${ethers.formatEther(creator1Echo)} ECHO`);
    console.log(`Helper1 ECHO: ${ethers.formatEther(helper1Echo)} ECHO`);
    console.log("");
    
    console.log("🎯 添加代币后，你应该能在 MetaMask 中看到：");
    console.log("- Creator1: 20.0 ECHO");
    console.log("- Helper1: 179.2 ECHO");
    console.log("- Creator2: 60.0 ECHO + 2900.0 ZRC20");
    console.log("- Helper2: 139.6 ECHO + 100.0 ZRC20");
    
  } catch (error) {
    console.error("❌ 合约验证失败:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});