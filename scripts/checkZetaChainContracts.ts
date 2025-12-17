import { ethers } from "hardhat";

/**
 * 检查ZetaChain Athens测试网上的合约部署状态
 */

async function main() {
  console.log("🔍 检查ZetaChain Athens测试网合约状态...");
  console.log("");

  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  if (chainId !== 7001) {
    console.error("❌ 请使用ZetaChain Athens测试网 (chainId: 7001)");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("网络:", chainId);
  console.log("");

  // 从deployment.json读取的地址
  const contracts = {
    EOCHOToken: "0xE0e8CD2F3a8bd6241B09798DEe98f1c777537b4D",
    Register: "0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA", 
    TaskEscrow: "0xE442Eb737983986153E42C9ad28530676d8C1f55", // 修复后的地址
    UniversalReward: "0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3" // 前端实际使用
  };

  console.log("📋 检查合约部署状态:");
  console.log("-".repeat(60));

  for (const [name, address] of Object.entries(contracts)) {
    try {
      const code = await ethers.provider.getCode(address);
      if (code !== '0x') {
        console.log(`✅ ${name.padEnd(15)}: ${address} (已部署)`);
        
        // 对于TaskEscrow，检查是否是修复后的版本
        if (name === 'TaskEscrow') {
          try {
            const taskEscrow = await ethers.getContractAt('TaskEscrow', address);
            const fragment = taskEscrow.interface.getFunction('createTaskWithCrossChainReward');
            console.log(`   - payable: ${fragment.payable ? '是' : '否'} (修复后应该是"否")`);
          } catch (error) {
            console.log(`   - 无法检查函数签名: ${error}`);
          }
        }
        
        // 对于UniversalReward，检查基本功能
        if (name === 'UniversalReward') {
          try {
            const universalReward = await ethers.getContractAt('EverEchoUniversalReward', address);
            const rewardCounter = await universalReward.rewardCounter();
            console.log(`   - rewardCounter: ${rewardCounter} (前端实际使用此合约)`);
          } catch (error) {
            console.log(`   - 无法检查UniversalReward: ${error}`);
          }
        }
        
      } else {
        console.log(`❌ ${name.padEnd(15)}: ${address} (未部署)`);
      }
    } catch (error) {
      console.log(`❌ ${name.padEnd(15)}: ${address} (检查失败: ${error})`);
    }
  }

  console.log("");
  console.log("🎯 前端配置验证:");
  console.log("-".repeat(60));
  console.log("ZetaChain Athens配置应该使用:");
  console.log(`taskEscrow: '${contracts.TaskEscrow}',`);
  console.log(`echoToken: '${contracts.EOCHOToken}',`);
  console.log(`register: '${contracts.Register}',`);
  console.log(`universalReward: '${contracts.UniversalReward}', // 前端实际使用`);
  
  console.log("");
  console.log("✅ ZetaChain合约检查完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 检查失败:", error);
    process.exit(1);
  });