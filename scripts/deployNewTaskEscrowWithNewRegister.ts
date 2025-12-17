import { ethers } from "hardhat";
import { writeFileSync } from "fs";

async function main() {
  console.log("🚀 开始部署新的TaskEscrow合约（使用新Register地址）...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);

  // 合约地址配置
  const ECHO_TOKEN_ADDRESS = "0x650AAE045552567df9eb0633afd77D44308D3e6D";
  const NEW_REGISTER_ADDRESS = "0x49215D817e017B2713761F9F676df31F5Ff812F2";
  
  console.log("ECHO Token地址:", ECHO_TOKEN_ADDRESS);
  console.log("新Register地址:", NEW_REGISTER_ADDRESS);

  // 部署TaskEscrow合约
  console.log("\n📦 部署TaskEscrow合约...");
  const TaskEscrow = await ethers.getContractFactory("TaskEscrow");
  const taskEscrow = await TaskEscrow.deploy(ECHO_TOKEN_ADDRESS, NEW_REGISTER_ADDRESS);
  
  await taskEscrow.waitForDeployment();
  const taskEscrowAddress = await taskEscrow.getAddress();
  
  console.log("✅ TaskEscrow合约部署成功!");
  console.log("TaskEscrow地址:", taskEscrowAddress);

  // 验证合约配置
  console.log("\n🔍 验证合约配置...");
  const echoTokenAddr = await taskEscrow.echoToken();
  const registerAddr = await taskEscrow.registerContract();
  
  console.log("TaskEscrow中的ECHO Token地址:", echoTokenAddr);
  console.log("TaskEscrow中的Register地址:", registerAddr);
  
  // 验证地址是否正确
  const echoTokenCorrect = echoTokenAddr.toLowerCase() === ECHO_TOKEN_ADDRESS.toLowerCase();
  const registerCorrect = registerAddr.toLowerCase() === NEW_REGISTER_ADDRESS.toLowerCase();
  
  console.log("ECHO Token地址正确:", echoTokenCorrect ? "✅" : "❌");
  console.log("Register地址正确:", registerCorrect ? "✅" : "❌");

  if (!echoTokenCorrect || !registerCorrect) {
    throw new Error("合约配置验证失败!");
  }

  // 更新ECHO Token合约中的TaskEscrow地址
  console.log("\n🔄 更新ECHO Token合约中的TaskEscrow地址...");
  const echoToken = await ethers.getContractAt("EOCHOToken", ECHO_TOKEN_ADDRESS);
  
  try {
    const setTx = await echoToken.setTaskEscrowAddress(taskEscrowAddress);
    await setTx.wait();
    console.log("✅ ECHO Token合约中的TaskEscrow地址更新成功!");
    
    // 验证更新
    const updatedTaskEscrowAddr = await echoToken.taskEscrowAddress();
    console.log("ECHO Token中的TaskEscrow地址:", updatedTaskEscrowAddr);
    
    if (updatedTaskEscrowAddr.toLowerCase() !== taskEscrowAddress.toLowerCase()) {
      throw new Error("ECHO Token中的TaskEscrow地址更新失败!");
    }
  } catch (error) {
    console.error("❌ 更新ECHO Token中的TaskEscrow地址失败:", error);
    throw error;
  }

  // 保存部署结果
  const deploymentResult = {
    network: "ZetaChain Athens Testnet",
    chainId: 7001,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      taskEscrow: taskEscrowAddress,
      echoToken: ECHO_TOKEN_ADDRESS,
      register: NEW_REGISTER_ADDRESS,
      universalReward: "0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3" // 保持不变
    },
    verification: {
      echoTokenCorrect,
      registerCorrect,
      echoTokenUpdated: true
    }
  };

  writeFileSync(
    'taskescrow-deployment-result.json',
    JSON.stringify(deploymentResult, null, 2)
  );

  console.log("\n🎉 TaskEscrow合约部署完成!");
  console.log("📋 新的合约地址配置:");
  console.log("- TaskEscrow:", taskEscrowAddress);
  console.log("- ECHO Token:", ECHO_TOKEN_ADDRESS);
  console.log("- Register:", NEW_REGISTER_ADDRESS);
  console.log("- UniversalReward:", "0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3");
  
  console.log("\n📄 部署结果已保存到: taskescrow-deployment-result.json");
  
  return {
    taskEscrow: taskEscrowAddress,
    echoToken: ECHO_TOKEN_ADDRESS,
    register: NEW_REGISTER_ADDRESS,
    universalReward: "0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3"
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });