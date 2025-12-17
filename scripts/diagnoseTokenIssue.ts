import { ethers } from "hardhat";

async function main() {
  console.log("🔍 MetaMask 代币导入问题诊断");
  console.log("=====================================");
  
  // 检查网络连接
  try {
    const network = await ethers.provider.getNetwork();
    console.log(`✅ 网络连接正常:`);
    console.log(`   ChainId: ${network.chainId}`);
    console.log(`   Name: ${network.name}`);
    console.log("");
  } catch (error) {
    console.log("❌ 网络连接失败:", error);
    return;
  }

  // 检查合约地址
  const addresses = {
    ECHO: "0x18E317A7D70d8fBf8e6E893616b52390EbBdb629",
    MockZRC20: "0xc96304e3c037f81dA488ed9dEa1D8F2a48278a75"
  };

  console.log("🔍 检查合约部署状态:");
  
  for (const [name, address] of Object.entries(addresses)) {
    try {
      const code = await ethers.provider.getCode(address);
      if (code === "0x") {
        console.log(`❌ ${name}: 合约未部署在地址 ${address}`);
      } else {
        console.log(`✅ ${name}: 合约已部署 (${address})`);
        console.log(`   字节码长度: ${code.length} 字符`);
        
        // 尝试调用合约方法
        try {
          if (name === "ECHO") {
            const contract = await ethers.getContractAt("EOCHOToken", address);
            const symbol = await contract.symbol();
            const decimals = await contract.decimals();
            console.log(`   符号: ${symbol}, 小数位: ${decimals}`);
          } else if (name === "MockZRC20") {
            const contract = await ethers.getContractAt("MockZRC20", address);
            const symbol = await contract.symbol();
            const decimals = await contract.decimals();
            console.log(`   符号: ${symbol}, 小数位: ${decimals}`);
          }
        } catch (contractError) {
          console.log(`   ⚠️ 合约调用失败: ${contractError.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${name}: 检查失败 - ${error.message}`);
    }
    console.log("");
  }

  // 检查测试账户
  console.log("👤 检查测试账户状态:");
  const testAccounts = [
    { name: "Creator1", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
    { name: "Helper1", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" }
  ];

  for (const account of testAccounts) {
    try {
      const balance = await ethers.provider.getBalance(account.address);
      console.log(`${account.name}: ${ethers.formatEther(balance)} ETH`);
      
      // 检查 ECHO 余额
      try {
        const echoContract = await ethers.getContractAt("EOCHOToken", addresses.ECHO);
        const echoBalance = await echoContract.balanceOf(account.address);
        console.log(`   ECHO: ${ethers.formatEther(echoBalance)}`);
      } catch (error) {
        console.log(`   ECHO: 查询失败`);
      }
    } catch (error) {
      console.log(`${account.name}: 查询失败`);
    }
  }

  console.log("");
  console.log("📋 MetaMask 导入信息:");
  console.log("=====================================");
  console.log("网络配置:");
  console.log(`  RPC URL: http://localhost:8545`);
  console.log(`  Chain ID: 31337`);
  console.log("");
  console.log("ECHO 代币:");
  console.log(`  地址: ${addresses.ECHO}`);
  console.log(`  符号: ECHO`);
  console.log(`  小数位: 18`);
  console.log("");
  console.log("MockZRC20 代币:");
  console.log(`  地址: ${addresses.MockZRC20}`);
  console.log(`  符号: MZRC`);
  console.log(`  小数位: 18`);
  console.log("");
  
  console.log("🔧 故障排除建议:");
  console.log("1. 确认 MetaMask 网络是 localhost:8545 (ChainId: 31337)");
  console.log("2. 确认已导入测试账户私钥");
  console.log("3. 尝试刷新 MetaMask 或重启浏览器");
  console.log("4. 检查本地 Hardhat 节点是否在运行");
}

main().catch((error) => {
  console.error("诊断脚本执行失败:", error);
  process.exitCode = 1;
});