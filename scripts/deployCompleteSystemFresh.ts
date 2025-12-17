import { ethers } from "hardhat";
import { writeFileSync } from "fs";

async function main() {
  console.log("🚀 开始完整重新部署系统（方案A）...");
  console.log("📋 部署顺序：ECHO Token → Register → TaskEscrow → 配置");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);

  const deploymentResult: any = {
    network: "ZetaChain Athens Testnet",
    chainId: 7001,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
    steps: []
  };

  try {
    // ============ 第一步：部署新ECHO Token ============
    console.log("\n🔥 第一步：部署新ECHO Token...");
    const EOCHOToken = await ethers.getContractFactory("EOCHOToken");
    const echoToken = await EOCHOToken.deploy();
    await echoToken.waitForDeployment();
    const echoTokenAddress = await echoToken.getAddress();
    
    console.log("✅ ECHO Token部署成功!");
    console.log("   地址:", echoTokenAddress);
    
    deploymentResult.contracts.echoToken = echoTokenAddress;
    deploymentResult.steps.push({
      step: 1,
      name: "Deploy ECHO Token",
      address: echoTokenAddress,
      status: "success"
    });

    // ============ 第二步：部署新Register ============
    console.log("\n🔥 第二步：部署新Register...");
    const Register = await ethers.getContractFactory("Register");
    const register = await Register.deploy(echoTokenAddress);
    await register.waitForDeployment();
    const registerAddress = await register.getAddress();
    
    console.log("✅ Register部署成功!");
    console.log("   地址:", registerAddress);
    console.log("   ECHO Token地址:", echoTokenAddress);
    
    deploymentResult.contracts.register = registerAddress;
    deploymentResult.steps.push({
      step: 2,
      name: "Deploy Register",
      address: registerAddress,
      echoTokenUsed: echoTokenAddress,
      status: "success"
    });

    // ============ 第三步：部署新TaskEscrow ============
    console.log("\n🔥 第三步：部署新TaskEscrow...");
    const TaskEscrow = await ethers.getContractFactory("TaskEscrow");
    const taskEscrow = await TaskEscrow.deploy(echoTokenAddress, registerAddress);
    await taskEscrow.waitForDeployment();
    const taskEscrowAddress = await taskEscrow.getAddress();
    
    console.log("✅ TaskEscrow部署成功!");
    console.log("   地址:", taskEscrowAddress);
    console.log("   ECHO Token地址:", echoTokenAddress);
    console.log("   Register地址:", registerAddress);
    
    deploymentResult.contracts.taskEscrow = taskEscrowAddress;
    deploymentResult.steps.push({
      step: 3,
      name: "Deploy TaskEscrow",
      address: taskEscrowAddress,
      echoTokenUsed: echoTokenAddress,
      registerUsed: registerAddress,
      status: "success"
    });

    // ============ 第四步：配置ECHO Token ============
    console.log("\n🔥 第四步：配置ECHO Token...");
    
    // 4.1 设置Register地址
    console.log("   4.1 设置Register地址...");
    const setRegisterTx = await echoToken.setRegisterAddress(registerAddress);
    await setRegisterTx.wait();
    console.log("   ✅ Register地址设置成功");
    
    // 4.2 设置TaskEscrow地址
    console.log("   4.2 设置TaskEscrow地址...");
    const setTaskEscrowTx = await echoToken.setTaskEscrowAddress(taskEscrowAddress);
    await setTaskEscrowTx.wait();
    console.log("   ✅ TaskEscrow地址设置成功");
    
    deploymentResult.steps.push({
      step: 4,
      name: "Configure ECHO Token",
      registerSet: registerAddress,
      taskEscrowSet: taskEscrowAddress,
      status: "success"
    });

    // ============ 验证配置 ============
    console.log("\n🔍 验证合约配置...");
    
    // 验证ECHO Token配置
    const configuredRegister = await echoToken.registerAddress();
    const configuredTaskEscrow = await echoToken.taskEscrowAddress();
    
    console.log("ECHO Token配置验证:");
    console.log("   Register地址:", configuredRegister);
    console.log("   TaskEscrow地址:", configuredTaskEscrow);
    
    const registerCorrect = configuredRegister.toLowerCase() === registerAddress.toLowerCase();
    const taskEscrowCorrect = configuredTaskEscrow.toLowerCase() === taskEscrowAddress.toLowerCase();
    
    console.log("   Register配置正确:", registerCorrect ? "✅" : "❌");
    console.log("   TaskEscrow配置正确:", taskEscrowCorrect ? "✅" : "❌");
    
    // 验证Register配置
    const registerEchoToken = await register.echoToken();
    const registerEchoCorrect = registerEchoToken.toLowerCase() === echoTokenAddress.toLowerCase();
    console.log("Register中ECHO Token地址:", registerEchoToken);
    console.log("Register配置正确:", registerEchoCorrect ? "✅" : "❌");
    
    // 验证TaskEscrow配置
    const taskEscrowEchoToken = await taskEscrow.echoToken();
    const taskEscrowRegister = await taskEscrow.registerContract();
    const taskEscrowEchoCorrect = taskEscrowEchoToken.toLowerCase() === echoTokenAddress.toLowerCase();
    const taskEscrowRegisterCorrect = taskEscrowRegister.toLowerCase() === registerAddress.toLowerCase();
    
    console.log("TaskEscrow配置验证:");
    console.log("   ECHO Token地址:", taskEscrowEchoToken);
    console.log("   Register地址:", taskEscrowRegister);
    console.log("   ECHO Token配置正确:", taskEscrowEchoCorrect ? "✅" : "❌");
    console.log("   Register配置正确:", taskEscrowRegisterCorrect ? "✅" : "❌");
    
    if (!registerCorrect || !taskEscrowCorrect || !registerEchoCorrect || !taskEscrowEchoCorrect || !taskEscrowRegisterCorrect) {
      throw new Error("合约配置验证失败!");
    }

    // ============ 保持UniversalReward地址不变 ============
    const universalRewardAddress = "0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3";
    deploymentResult.contracts.universalReward = universalRewardAddress;

    // ============ 保存部署结果 ============
    deploymentResult.verification = {
      registerCorrect,
      taskEscrowCorrect,
      registerEchoCorrect,
      taskEscrowEchoCorrect,
      taskEscrowRegisterCorrect,
      allCorrect: true
    };

    writeFileSync(
      'complete-system-deployment-result.json',
      JSON.stringify(deploymentResult, null, 2)
    );

    // ============ 显示最终结果 ============
    console.log("\n🎉 完整系统部署成功!");
    console.log("📋 新的合约地址配置:");
    console.log("┌─────────────────┬──────────────────────────────────────────────┐");
    console.log("│ 合约            │ 地址                                         │");
    console.log("├─────────────────┼──────────────────────────────────────────────┤");
    console.log(`│ ECHO Token      │ ${echoTokenAddress} │`);
    console.log(`│ Register        │ ${registerAddress} │`);
    console.log(`│ TaskEscrow      │ ${taskEscrowAddress} │`);
    console.log(`│ UniversalReward │ ${universalRewardAddress} │`);
    console.log("└─────────────────┴──────────────────────────────────────────────┘");
    
    console.log("\n📄 部署结果已保存到: complete-system-deployment-result.json");
    
    console.log("\n⚠️  下一步操作:");
    console.log("1. 更新P0配置文件（必须立即更新）:");
    console.log("   - frontend/src/contracts/addresses.ts");
    console.log("   - backend/.env");
    console.log("   - .env.zeta");
    console.log("   - frontend/src/config/contracts.ts");
    console.log("2. 重启前端和后端服务");
    console.log("3. 更新P1文件（部署后更新）");
    
    return {
      echoToken: echoTokenAddress,
      register: registerAddress,
      taskEscrow: taskEscrowAddress,
      universalReward: universalRewardAddress
    };

  } catch (error) {
    console.error("❌ 部署失败:", error);
    deploymentResult.error = error.message;
    writeFileSync(
      'complete-system-deployment-error.json',
      JSON.stringify(deploymentResult, null, 2)
    );
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });