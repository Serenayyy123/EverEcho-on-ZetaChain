import { ethers } from "hardhat";

/**
 * EverEcho 合约部署脚本
 * 部署顺序：EOCHOToken → Register → TaskEscrow
 * 
 * 使用方法：
 * - 本地：npx hardhat run scripts/deploy.ts --network localhost
 * - Sepolia：npx hardhat run scripts/deploy.ts --network sepolia
 */

async function main() {
  console.log("=".repeat(50));
  console.log("EverEcho 合约部署");
  console.log("=".repeat(50));
  console.log("");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("账户余额:", ethers.formatEther(balance), "ETH");
  console.log("");

  // 1. 部署 EOCHOToken
  console.log("[1/3] 部署 EOCHOToken...");
  const EOCHOToken = await ethers.getContractFactory("EOCHOToken");
  const echoToken = await EOCHOToken.deploy();
  await echoToken.waitForDeployment();
  const echoTokenAddress = await echoToken.getAddress();
  console.log("✓ EOCHOToken 部署成功:", echoTokenAddress);
  console.log("");

  // 2. 部署 Register
  console.log("[2/3] 部署 Register...");
  const Register = await ethers.getContractFactory("Register");
  const register = await Register.deploy(echoTokenAddress);
  await register.waitForDeployment();
  const registerAddress = await register.getAddress();
  console.log("✓ Register 部署成功:", registerAddress);
  console.log("");

  // 3. 设置 Register 合约地址到 EOCHOToken
  console.log("[3/5] 配置 EOCHOToken (Register)...");
  const tx1 = await echoToken.setRegisterAddress(registerAddress);
  await tx1.wait();
  console.log("✓ EOCHOToken Register 地址配置完成");
  console.log("");

  // 4. 部署 TaskEscrow
  console.log("[4/5] 部署 TaskEscrow...");
  const TaskEscrow = await ethers.getContractFactory("TaskEscrow");
  const taskEscrow = await TaskEscrow.deploy(echoTokenAddress, registerAddress);
  await taskEscrow.waitForDeployment();
  const taskEscrowAddress = await taskEscrow.getAddress();
  console.log("✓ TaskEscrow 部署成功:", taskEscrowAddress);
  console.log("");

  // 5. 设置 TaskEscrow 合约地址到 EOCHOToken
  console.log("[5/5] 配置 EOCHOToken (TaskEscrow)...");
  const tx2 = await echoToken.setTaskEscrowAddress(taskEscrowAddress);
  await tx2.wait();
  console.log("✓ EOCHOToken TaskEscrow 地址配置完成");
  console.log("");

  // 输出部署信息
  console.log("=".repeat(50));
  console.log("部署完成！");
  console.log("=".repeat(50));
  console.log("");
  console.log("合约地址：");
  console.log("-".repeat(50));
  console.log("EOCHOToken:  ", echoTokenAddress);
  console.log("Register:    ", registerAddress);
  console.log("TaskEscrow:  ", taskEscrowAddress);
  console.log("");

  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  // 根据网络输出配置
  let rpcUrl = "";
  let networkName = "";
  let explorerUrl = "";
  
  if (chainId === 84532) {
    rpcUrl = "https://sepolia.base.org";
    networkName = "Base Sepolia";
    explorerUrl = "https://sepolia.basescan.org";
  } else if (chainId === 11155111) {
    rpcUrl = "https://rpc.sepolia.org";
    networkName = "Sepolia";
    explorerUrl = "https://sepolia.etherscan.io";
  } else if (chainId === 31337) {
    rpcUrl = "http://localhost:8545";
    networkName = "Hardhat Local";
    explorerUrl = "";
  }
  
  // 输出配置信息
  console.log("前端配置（frontend/.env）：");
  console.log("-".repeat(50));
  console.log(`VITE_EOCHO_TOKEN_ADDRESS=${echoTokenAddress}`);
  console.log(`VITE_REGISTER_ADDRESS=${registerAddress}`);
  console.log(`VITE_TASK_ESCROW_ADDRESS=${taskEscrowAddress}`);
  console.log(`VITE_CHAIN_ID=${chainId}`);
  console.log(`VITE_NETWORK_NAME=${networkName}`);
  console.log("");

  // 输出后端配置
  console.log("后端配置（backend/.env）：");
  console.log("-".repeat(50));
  console.log(`RPC_URL=${rpcUrl}`);
  console.log(`TASK_ESCROW_ADDRESS=${taskEscrowAddress}`);
  console.log(`CHAIN_ID=${chainId}`);
  console.log("");

  // 验证合约（如果在测试网）
  if (chainId === 84532) {
    console.log("提示：在 Basescan 上验证合约");
    console.log("-".repeat(50));
    console.log(`npx hardhat verify --network baseSepolia ${echoTokenAddress}`);
    console.log(`npx hardhat verify --network baseSepolia ${registerAddress} ${echoTokenAddress}`);
    console.log(`npx hardhat verify --network baseSepolia ${taskEscrowAddress} ${echoTokenAddress} ${registerAddress}`);
    console.log("");
  } else if (chainId === 11155111) {
    console.log("提示：在 Etherscan 上验证合约");
    console.log("-".repeat(50));
    console.log(`npx hardhat verify --network sepolia ${echoTokenAddress}`);
    console.log(`npx hardhat verify --network sepolia ${registerAddress} ${echoTokenAddress}`);
    console.log(`npx hardhat verify --network sepolia ${taskEscrowAddress} ${echoTokenAddress} ${registerAddress}`);
    console.log("");
  }

  // 保存部署信息到文件
  const fs = require('fs');
  const deploymentInfo = {
    network: networkName || network.name,
    chainId: chainId,
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
