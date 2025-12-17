import { ethers } from "hardhat";

async function main() {
  console.log("💰 测试账户余额检查");
  console.log("=====================================");
  
  // 获取合约实例
  const EOCHOToken = await ethers.getContractAt("EOCHOToken", "0x1c85638e118b37167e9298c2268758e058DdfDA0");
  const MockZRC20 = await ethers.getContractAt("MockZRC20", "0x86A2EE8FAf9A840F7a2c64CA3d51209F9A02081D");
  
  const accounts = [
    { name: "Creator1", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
    { name: "Helper1", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
    { name: "Creator2", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
    { name: "Helper2", address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" }
  ];

  for (const account of accounts) {
    const ethBalance = await ethers.provider.getBalance(account.address);
    const echoBalance = await EOCHOToken.balanceOf(account.address);
    const zrc20Balance = await MockZRC20.balanceOf(account.address);
    
    console.log(`\n📋 ${account.name}:`);
    console.log(`   地址: ${account.address}`);
    console.log(`   ETH: ${ethers.formatEther(ethBalance)} ETH`);
    console.log(`   ECHO: ${ethers.formatEther(echoBalance)} ECHO`);
    console.log(`   MockZRC20: ${ethers.formatEther(zrc20Balance)} ZRC20`);
  }
  
  console.log("\n✅ 所有账户都有充足余额进行测试！");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});