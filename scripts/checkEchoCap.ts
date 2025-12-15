import { ethers } from "hardhat";
import deploymentData from "../deployment.json";

async function main() {
  console.log("=".repeat(60));
  console.log("ZetaChain Athens - ECHO CAP 状态检查");
  console.log("=".repeat(60));

  const network = "zetachainAthens";
  const deployment = (deploymentData as any)[network];
  
  if (!deployment) {
    console.log("❌ 未找到 Athens 部署信息");
    return;
  }

  // 连接合约
  const echoToken = await ethers.getContractAt("EOCHOToken", deployment.contracts.EOCHOToken.address);
  const register = await ethers.getContractAt("Register", deployment.contracts.Register.address);
  const [deployer] = await ethers.getSigners();

  console.log("网络信息:");
  console.log("- Network:", network);
  console.log("- ChainId:", (await ethers.provider.getNetwork()).chainId);
  console.log("- Deployer:", deployer.address);
  console.log("");

  console.log("合约地址:");
  console.log("- EOCHOToken:", deployment.contracts.EOCHOToken.address);
  console.log("- Register:   ", deployment.contracts.Register.address);
  console.log("");

  // 检查 EOCHOToken 状态
  console.log("EOCHOToken 状态分析:");
  console.log("-".repeat(40));
  
  try {
    const totalSupply = await echoToken.totalSupply();
    console.log("✅ totalSupply():", ethers.formatUnits(totalSupply, 18), "ECHO");
    
    // 检查是否有 cap() 方法
    let cap;
    let hasCap = false;
    try {
      cap = await echoToken.cap();
      hasCap = true;
      console.log("✅ cap():", ethers.formatUnits(cap, 18), "ECHO");
      
      // 计算剩余可 mint 数量
      const remaining = cap - totalSupply;
      console.log("📊 剩余可 mint:", ethers.formatUnits(remaining, 18), "ECHO");
      
      if (remaining > 0n) {
        console.log("🎯 结论: CAP 未满，可以继续 mint");
      } else {
        console.log("🚫 结论: CAP 已满，无法继续 mint");
      }
    } catch (error) {
      console.log("⚠️  cap() 方法不存在或调用失败");
      hasCap = false;
    }

    // 检查关键账户余额
    console.log("");
    console.log("关键账户 ECHO 余额:");
    console.log("-".repeat(40));
    
    const deployerBalance = await echoToken.balanceOf(deployer.address);
    const registerBalance = await echoToken.balanceOf(deployment.contracts.Register.address);
    
    console.log("- Deployer:", ethers.formatUnits(deployerBalance, 18), "ECHO");
    console.log("- Register合约:", ethers.formatUnits(registerBalance, 18), "ECHO");

    // 检查 Register 合约状态
    console.log("");
    console.log("Register 合约状态:");
    console.log("-".repeat(40));
    
    const isDeployerRegistered = await register.isRegistered(deployer.address);
    console.log("- Deployer 已注册:", isDeployerRegistered ? "✅" : "❌");

    // 尝试找到有 ECHO 的地址（检查事件）
    console.log("");
    console.log("查找有 ECHO 的地址 (最近 1000 个区块):");
    console.log("-".repeat(40));
    
    const currentBlock = await ethers.provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 1000);
    
    try {
      const transferEvents = await echoToken.queryFilter(
        echoToken.filters.Transfer(),
        fromBlock,
        currentBlock
      );
      
      const uniqueAddresses = new Set<string>();
      for (const event of transferEvents.slice(-10)) { // 只检查最近 10 个转账
        if (event.args && event.args.to !== ethers.ZeroAddress) {
          uniqueAddresses.add(event.args.to);
        }
      }
      
      console.log("检查最近转账接收者的余额:");
      for (const addr of Array.from(uniqueAddresses).slice(0, 5)) { // 只检查前 5 个
        const balance = await echoToken.balanceOf(addr);
        if (balance > 0n) {
          console.log(`- ${addr}: ${ethers.formatUnits(balance, 18)} ECHO`);
        }
      }
    } catch (error) {
      console.log("⚠️  无法查询转账事件");
    }

    // 最终诊断结论
    console.log("");
    console.log("=".repeat(60));
    console.log("🎯 诊断结论:");
    console.log("=".repeat(60));
    
    if (hasCap && cap !== undefined) {
      const remaining = cap - totalSupply;
      if (remaining > ethers.parseUnits("200", 18)) {
        console.log("✅ Case A: CAP 未满，剩余", ethers.formatUnits(remaining, 18), "ECHO");
        console.log("📋 建议: 通过 Register 注册新账户获取 ECHO，继续 Path 1 验证");
      } else if (remaining > 0n) {
        console.log("⚠️  Case A-: CAP 接近满，剩余", ethers.formatUnits(remaining, 18), "ECHO");
        console.log("📋 建议: 谨慎注册，或考虑重新部署");
      } else {
        console.log("❌ Case B: CAP 已满，无法 mint 新 ECHO");
        console.log("📋 建议: 重新部署新合约实例");
      }
    } else {
      console.log("⚠️  Case C: 无 cap() 方法或其他问题");
      console.log("📋 建议: 检查合约 ABI 或重新部署");
    }
    
    if (deployerBalance > ethers.parseUnits("100", 18)) {
      console.log("✅ Deployer 有足够 ECHO，可直接进行验证");
    } else if (deployerBalance > 0n) {
      console.log("⚠️  Deployer ECHO 不足，需要补充");
    } else {
      console.log("❌ Deployer 无 ECHO");
    }

  } catch (error) {
    console.error("❌ 检查过程中出错:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});