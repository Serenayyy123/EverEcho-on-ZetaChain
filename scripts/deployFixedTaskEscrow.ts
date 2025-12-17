import { ethers } from "hardhat";
import * as fs from "fs";

/**
 * 重新部署修复后的TaskEscrow合约
 * 修复双重扣费问题后的部署脚本
 * 
 * 使用方法：
 * - 本地：npx hardhat run scripts/deployFixedTaskEscrow.ts --network localhost
 * - ZetaChain Athens：npx hardhat run scripts/deployFixedTaskEscrow.ts --network zetachainAthens
 */

async function main() {
  console.log("=".repeat(60));
  console.log("重新部署修复后的TaskEscrow合约");
  console.log("修复：双重扣费问题 - 职责分离");
  console.log("=".repeat(60));
  console.log("");

  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("账户余额:", ethers.formatEther(balance), "ETH");
  console.log("网络:", chainId);
  console.log("");

  // 读取现有部署信息
  let deploymentData: any = {};
  try {
    const existingData = fs.readFileSync('deployment.json', 'utf8');
    deploymentData = JSON.parse(existingData);
  } catch (error) {
    console.error("❌ 无法读取 deployment.json，请先运行完整部署脚本");
    process.exit(1);
  }

  // 确定网络名称
  let networkName = "";
  if (chainId === 31337) {
    networkName = "localhost";
  } else if (chainId === 7001) {
    networkName = "zetachainAthens";
  } else {
    console.error("❌ 不支持的网络，请使用 localhost 或 zetachainAthens");
    process.exit(1);
  }

  // 检查现有部署信息
  if (!deploymentData[networkName] || !deploymentData[networkName].contracts) {
    console.error(`❌ 未找到 ${networkName} 网络的部署信息，请先运行完整部署脚本`);
    process.exit(1);
  }

  const existingContracts = deploymentData[networkName].contracts;
  
  // 检查必需的合约地址
  if (!existingContracts.EOCHOToken || !existingContracts.Register) {
    console.error("❌ 缺少 EOCHOToken 或 Register 合约地址");
    process.exit(1);
  }

  const echoTokenAddress = existingContracts.EOCHOToken.address;
  const registerAddress = existingContracts.Register.address;
  
  console.log("现有合约地址:");
  console.log("EOCHOToken:", echoTokenAddress);
  console.log("Register:  ", registerAddress);
  console.log("");

  // 1. 部署新的TaskEscrow合约
  console.log("[1/3] 部署修复后的TaskEscrow合约...");
  const TaskEscrow = await ethers.getContractFactory("TaskEscrow");
  const taskEscrow = await TaskEscrow.deploy(echoTokenAddress, registerAddress);
  await taskEscrow.waitForDeployment();
  
  const taskEscrowAddress = await taskEscrow.getAddress();
  const taskEscrowTx = taskEscrow.deploymentTransaction();
  const taskEscrowReceipt = await taskEscrowTx?.wait();
  
  console.log("✓ 新的TaskEscrow部署成功:", taskEscrowAddress);
  console.log("  交易哈希:", taskEscrowTx?.hash);
  console.log("  区块号:", taskEscrowReceipt?.blockNumber);
  console.log("");

  // 2. 检查并更新EOCHOToken的TaskEscrow地址
  console.log("[2/3] 检查EOCHOToken的TaskEscrow地址设置...");
  const echoToken = await ethers.getContractAt("EOCHOToken", echoTokenAddress);
  
  try {
    const currentTaskEscrowAddress = await echoToken.taskEscrowAddress();
    console.log("当前设置的TaskEscrow地址:", currentTaskEscrowAddress);
    
    if (currentTaskEscrowAddress === ethers.ZeroAddress) {
      // 地址未设置，可以设置新地址
      const updateTx = await echoToken.setTaskEscrowAddress(taskEscrowAddress);
      await updateTx.wait();
      console.log("✓ EOCHOToken TaskEscrow地址设置完成");
      console.log("  交易哈希:", updateTx.hash);
    } else {
      // 地址已设置，需要部署新的EOCHOToken或使用其他方法
      console.log("⚠️  TaskEscrow地址已设置，无法更新");
      console.log("   旧地址:", currentTaskEscrowAddress);
      console.log("   新地址:", taskEscrowAddress);
      console.log("   注意：新的TaskEscrow合约无法调用EOCHOToken的burn函数");
      console.log("   建议：使用新的TaskEscrow地址更新前端配置");
    }
  } catch (error) {
    console.error("❌ 检查TaskEscrow地址失败:", error);
  }
  console.log("");

  // 3. 跳过Gateway部署 - Gateway合约未被实际使用
  console.log("[3/3] 跳过Gateway部署...");
  console.log("⚠️  Gateway合约未被前端实际使用，跳过重新部署");
  console.log("   前端实际使用的是UniversalReward合约处理跨链奖励");
  console.log("   UniversalReward地址:", existingContracts.EverEchoUniversalReward?.address || "未找到");
  console.log("");

  // 更新部署信息
  const oldTaskEscrowAddress = existingContracts.TaskEscrow?.address || "未知";
  
  deploymentData[networkName].contracts.TaskEscrow = {
    address: taskEscrowAddress,
    txHash: taskEscrowTx?.hash,
    blockNumber: taskEscrowReceipt?.blockNumber,
    previousAddress: oldTaskEscrowAddress,
    fixedAt: new Date().toISOString(),
    fixDescription: "双重扣费修复 - 职责分离，TaskEscrow只处理ECHO代币"
  };

  // 保存更新的部署信息
  fs.writeFileSync(
    'deployment.json',
    JSON.stringify(deploymentData, null, 2)
  );

  // 输出部署结果
  console.log("=".repeat(60));
  console.log("TaskEscrow修复部署完成！");
  console.log("=".repeat(60));
  console.log("");
  console.log("合约地址变更:");
  console.log("-".repeat(60));
  console.log("旧TaskEscrow:    ", oldTaskEscrowAddress);
  console.log("新TaskEscrow:    ", taskEscrowAddress);
  console.log("UniversalReward: ", existingContracts.EverEchoUniversalReward?.address || "未找到", "(未变更)");
  console.log("");
  
  console.log("需要更新的配置文件:");
  console.log("-".repeat(60));
  console.log("1. frontend/src/contracts/addresses.ts (TaskEscrow地址)");
  console.log("2. frontend/src/config/contracts.ts (TaskEscrow地址)");
  console.log("3. UniversalReward地址无需更新 (前端真正使用的合约)");
  console.log("");

  console.log("前端配置更新:");
  console.log("-".repeat(60));
  if (chainId === 31337) {
    console.log("// 更新 localhost 配置");
    console.log(`taskEscrow: '${taskEscrowAddress}',`);
  } else if (chainId === 7001) {
    console.log("// 更新 ZetaChain Athens 配置");
    console.log(`taskEscrow: '${taskEscrowAddress}',`);
  }
  console.log("");

  console.log("验证修复:");
  console.log("-".repeat(60));
  console.log(`npx hardhat run scripts/testDoubleChargingFix.ts --network ${networkName}`);
  console.log("");

  console.log("✓ 部署信息已更新到 deployment.json");
  console.log("✓ 请手动更新前端配置文件");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });