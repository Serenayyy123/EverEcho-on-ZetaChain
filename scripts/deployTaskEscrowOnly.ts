import { ethers } from "hardhat";

/**
 * 单独部署 TaskEscrow 合约
 * 使用已部署的 EOCHOToken 和 Register 地址
 */

async function main() {
  console.log("=".repeat(50));
  console.log("部署 TaskEscrow 合约");
  console.log("=".repeat(50));
  console.log("");

  // 使用最新部署的合约地址
  const echoTokenAddress = "0xEF20110CeD8A061c9CA8aD1a9888C573C3D30da1";
  const registerAddress = "0x26885C22c665ec1C713d49376d432Af618A18afb";

  console.log("使用已部署的合约：");
  console.log("EOCHOToken:", echoTokenAddress);
  console.log("Register:  ", registerAddress);
  console.log("");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("账户余额:", ethers.formatEther(balance), "ETH");
  console.log("");

  // 部署 TaskEscrow
  console.log("部署 TaskEscrow...");
  const TaskEscrow = await ethers.getContractFactory("TaskEscrow");
  const taskEscrow = await TaskEscrow.deploy(echoTokenAddress, registerAddress);
  
  console.log("等待部署确认...");
  await taskEscrow.waitForDeployment();
  
  const taskEscrowAddress = await taskEscrow.getAddress();
  console.log("✓ TaskEscrow 部署成功:", taskEscrowAddress);
  console.log("");

  // 输出完整配置
  console.log("=".repeat(50));
  console.log("部署完成！");
  console.log("=".repeat(50));
  console.log("");
  console.log("所有合约地址：");
  console.log("-".repeat(50));
  console.log("EOCHOToken:  ", echoTokenAddress);
  console.log("Register:    ", registerAddress);
  console.log("TaskEscrow:  ", taskEscrowAddress);
  console.log("");

  // 输出配置信息
  console.log("前端配置（frontend/.env）：");
  console.log("-".repeat(50));
  console.log(`VITE_EOCHO_TOKEN_ADDRESS=${echoTokenAddress}`);
  console.log(`VITE_REGISTER_ADDRESS=${registerAddress}`);
  console.log(`VITE_TASK_ESCROW_ADDRESS=${taskEscrowAddress}`);
  console.log("");

  // 输出后端配置
  console.log("后端配置（backend/.env）：");
  console.log("-".repeat(50));
  console.log(`TASK_ESCROW_ADDRESS=${taskEscrowAddress}`);
  console.log("");

  // 保存部署信息
  const fs = require('fs');
  const deploymentInfo = {
    network: "base-sepolia",
    chainId: 84532,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      EOCHOToken: echoTokenAddress,
      Register: registerAddress,
      TaskEscrow: taskEscrowAddress,
    },
  };

  fs.writeFileSync(
    'deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("✓ 部署信息已保存到 deployment.json");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
