import { ethers } from "hardhat";
import * as fs from "fs";

/**
 * EverEcho 合约部署脚本
 * 部署顺序：EOCHOToken → Register → TaskEscrow → EverEchoGateway
 * 
 * 使用方法：
 * - 本地：npx hardhat run scripts/deploy.ts --network localhost
 * - Base Sepolia：npx hardhat run scripts/deploy.ts --network baseSepolia
 * - ZetaChain Athens：npx hardhat run scripts/deploy.ts --network zetachainAthens
 */

async function main() {
  console.log("=".repeat(50));
  console.log("EverEcho 合约部署");
  console.log("=".repeat(50));
  console.log("");

  // 检查部署私钥
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  if (chainId === 7001) {
    // ZetaChain Athens 需要 DEPLOYER_PRIVATE_KEY
    if (!process.env.DEPLOYER_PRIVATE_KEY) {
      console.error("❌ 错误：ZetaChain Athens 部署需要设置 DEPLOYER_PRIVATE_KEY 环境变量");
      process.exit(1);
    }
  }

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("账户余额:", ethers.formatEther(balance), "ETH");
  console.log("");

  // 存储部署信息
  const deploymentData: any = {
    network: "",
    chainId: chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {}
  };

  // 1. 部署 EOCHOToken
  console.log("[1/6] 部署 EOCHOToken...");
  const EOCHOToken = await ethers.getContractFactory("EOCHOToken");
  const echoToken = await EOCHOToken.deploy();
  await echoToken.waitForDeployment();
  const echoTokenAddress = await echoToken.getAddress();
  const echoTokenTx = echoToken.deploymentTransaction();
  const echoTokenReceipt = await echoTokenTx?.wait();
  console.log("✓ EOCHOToken 部署成功:", echoTokenAddress);
  console.log("  交易哈希:", echoTokenTx?.hash);
  console.log("  区块号:", echoTokenReceipt?.blockNumber);
  console.log("");

  deploymentData.contracts.EOCHOToken = {
    address: echoTokenAddress,
    txHash: echoTokenTx?.hash,
    blockNumber: echoTokenReceipt?.blockNumber
  };

  // 2. 部署 Register
  console.log("[2/6] 部署 Register...");
  const Register = await ethers.getContractFactory("Register");
  const register = await Register.deploy(echoTokenAddress);
  await register.waitForDeployment();
  const registerAddress = await register.getAddress();
  const registerTx = register.deploymentTransaction();
  const registerReceipt = await registerTx?.wait();
  console.log("✓ Register 部署成功:", registerAddress);
  console.log("  交易哈希:", registerTx?.hash);
  console.log("  区块号:", registerReceipt?.blockNumber);
  console.log("");

  deploymentData.contracts.Register = {
    address: registerAddress,
    txHash: registerTx?.hash,
    blockNumber: registerReceipt?.blockNumber
  };

  // 3. 设置 Register 合约地址到 EOCHOToken
  console.log("[3/6] 配置 EOCHOToken (Register)...");
  const tx1 = await echoToken.setRegisterAddress(registerAddress);
  await tx1.wait();
  console.log("✓ EOCHOToken Register 地址配置完成");
  console.log("");

  // 4. 部署 TaskEscrow
  console.log("[4/6] 部署 TaskEscrow...");
  const TaskEscrow = await ethers.getContractFactory("TaskEscrow");
  const taskEscrow = await TaskEscrow.deploy(echoTokenAddress, registerAddress);
  await taskEscrow.waitForDeployment();
  const taskEscrowAddress = await taskEscrow.getAddress();
  const taskEscrowTx = taskEscrow.deploymentTransaction();
  const taskEscrowReceipt = await taskEscrowTx?.wait();
  console.log("✓ TaskEscrow 部署成功:", taskEscrowAddress);
  console.log("  交易哈希:", taskEscrowTx?.hash);
  console.log("  区块号:", taskEscrowReceipt?.blockNumber);
  console.log("");

  deploymentData.contracts.TaskEscrow = {
    address: taskEscrowAddress,
    txHash: taskEscrowTx?.hash,
    blockNumber: taskEscrowReceipt?.blockNumber
  };

  // 5. 设置 TaskEscrow 合约地址到 EOCHOToken
  console.log("[5/6] 配置 EOCHOToken (TaskEscrow)...");
  const tx2 = await echoToken.setTaskEscrowAddress(taskEscrowAddress);
  await tx2.wait();
  console.log("✓ EOCHOToken TaskEscrow 地址配置完成");
  console.log("");

  // 6. 部署 EverEchoGateway
  console.log("[6/7] 部署 EverEchoGateway...");
  const EverEchoGateway = await ethers.getContractFactory("EverEchoGateway");
  const gateway = await EverEchoGateway.deploy(taskEscrowAddress);
  await gateway.waitForDeployment();
  const gatewayAddress = await gateway.getAddress();
  const gatewayTx = gateway.deploymentTransaction();
  const gatewayReceipt = await gatewayTx?.wait();
  console.log("✓ EverEchoGateway 部署成功:", gatewayAddress);
  console.log("  交易哈希:", gatewayTx?.hash);
  console.log("  区块号:", gatewayReceipt?.blockNumber);
  console.log("");

  deploymentData.contracts.EverEchoGateway = {
    address: gatewayAddress,
    txHash: gatewayTx?.hash,
    blockNumber: gatewayReceipt?.blockNumber
  };

  // 7. 部署 MockZRC20 (仅本地网络)
  let mockZRC20Address = "";
  if (chainId === 31337) {
    console.log("[7/7] 部署 MockZRC20 (本地测试)...");
    const MockZRC20 = await ethers.getContractFactory("MockZRC20");
    const mockZRC20 = await MockZRC20.deploy("Mock ZRC20", "MZRC", 18);
    await mockZRC20.waitForDeployment();
    mockZRC20Address = await mockZRC20.getAddress();
    const mockZRC20Tx = mockZRC20.deploymentTransaction();
    const mockZRC20Receipt = await mockZRC20Tx?.wait();
    console.log("✓ MockZRC20 部署成功:", mockZRC20Address);
    console.log("  交易哈希:", mockZRC20Tx?.hash);
    console.log("  区块号:", mockZRC20Receipt?.blockNumber);
    console.log("");

    deploymentData.contracts.MockZRC20 = {
      address: mockZRC20Address,
      txHash: mockZRC20Tx?.hash,
      blockNumber: mockZRC20Receipt?.blockNumber
    };
  }

  // 获取网络信息
  let rpcUrl = "";
  let networkName = "";
  let explorerUrl = "";
  
  if (chainId === 84532) {
    rpcUrl = "https://sepolia.base.org";
    networkName = "baseSepolia";
    explorerUrl = "https://sepolia.basescan.org";
  } else if (chainId === 11155111) {
    rpcUrl = "https://rpc.sepolia.org";
    networkName = "sepolia";
    explorerUrl = "https://sepolia.etherscan.io";
  } else if (chainId === 31337) {
    rpcUrl = "http://localhost:8545";
    networkName = "localhost";
    explorerUrl = "";
  } else if (chainId === 7001) {
    rpcUrl = process.env.ZETA_ATHENS_RPC_URL || "https://zetachain-athens-evm.blockpi.network/v1/rpc/public";
    networkName = "zetachainAthens";
    explorerUrl = "https://athens.explorer.zetachain.com";
  }

  deploymentData.network = networkName;
  deploymentData.rpc = rpcUrl;

  // 输出部署信息
  console.log("=".repeat(50));
  console.log("部署完成！");
  console.log("=".repeat(50));
  console.log("");
  console.log("网络信息：");
  console.log("-".repeat(50));
  console.log("Network:", networkName);
  console.log("ChainId:", chainId);
  console.log("Deployer:", deployer.address);
  console.log("");
  console.log("合约地址：");
  console.log("-".repeat(50));
  console.log("EOCHOToken:     ", echoTokenAddress);
  console.log("Register:       ", registerAddress);
  console.log("TaskEscrow:     ", taskEscrowAddress);
  console.log("EverEchoGateway:", gatewayAddress);
  if (mockZRC20Address) {
    console.log("MockZRC20:      ", mockZRC20Address);
  }
  console.log("");
  console.log("部署交易：");
  console.log("-".repeat(50));
  console.log("EOCHOToken:     ", echoTokenTx?.hash, "Block:", echoTokenReceipt?.blockNumber);
  console.log("Register:       ", registerTx?.hash, "Block:", registerReceipt?.blockNumber);
  console.log("TaskEscrow:     ", taskEscrowTx?.hash, "Block:", taskEscrowReceipt?.blockNumber);
  console.log("EverEchoGateway:", gatewayTx?.hash, "Block:", gatewayReceipt?.blockNumber);
  console.log("");
  // 输出配置信息
  console.log("前端配置（frontend/.env）：");
  console.log("-".repeat(50));
  console.log(`VITE_EOCHO_TOKEN_ADDRESS=${echoTokenAddress}`);
  console.log(`VITE_REGISTER_ADDRESS=${registerAddress}`);
  console.log(`VITE_TASK_ESCROW_ADDRESS=${taskEscrowAddress}`);
  console.log(`VITE_GATEWAY_ADDRESS=${gatewayAddress}`);
  if (mockZRC20Address) {
    console.log(`VITE_MOCK_ZRC20_ADDRESS=${mockZRC20Address}`);
  }
  console.log(`VITE_CHAIN_ID=${chainId}`);
  console.log(`VITE_NETWORK_NAME=${networkName}`);
  console.log("");

  // 输出后端配置
  console.log("后端配置（backend/.env）：");
  console.log("-".repeat(50));
  console.log(`RPC_URL=${rpcUrl}`);
  console.log(`TASK_ESCROW_ADDRESS=${taskEscrowAddress}`);
  console.log(`GATEWAY_ADDRESS=${gatewayAddress}`);
  console.log(`CHAIN_ID=${chainId}`);
  console.log("");

  // 验证合约（如果在测试网）
  if (chainId === 84532) {
    console.log("提示：在 Basescan 上验证合约");
    console.log("-".repeat(50));
    console.log(`npx hardhat verify --network baseSepolia ${echoTokenAddress}`);
    console.log(`npx hardhat verify --network baseSepolia ${registerAddress} ${echoTokenAddress}`);
    console.log(`npx hardhat verify --network baseSepolia ${taskEscrowAddress} ${echoTokenAddress} ${registerAddress}`);
    console.log(`npx hardhat verify --network baseSepolia ${gatewayAddress} ${taskEscrowAddress}`);
    console.log("");
  } else if (chainId === 11155111) {
    console.log("提示：在 Etherscan 上验证合约");
    console.log("-".repeat(50));
    console.log(`npx hardhat verify --network sepolia ${echoTokenAddress}`);
    console.log(`npx hardhat verify --network sepolia ${registerAddress} ${echoTokenAddress}`);
    console.log(`npx hardhat verify --network sepolia ${taskEscrowAddress} ${echoTokenAddress} ${registerAddress}`);
    console.log(`npx hardhat verify --network sepolia ${gatewayAddress} ${taskEscrowAddress}`);
    console.log("");
  } else if (chainId === 7001) {
    console.log("提示：ZetaChain Athens 部署完成");
    console.log("-".repeat(50));
    console.log("浏览器:", explorerUrl);
    console.log("运行命令进入 Stage 3.2 验证:");
    console.log(`npx hardhat run scripts/verify.ts --network zetachainAthens`);
    console.log("");
  }

  // 保存部署信息到文件
  let existingDeployments = {};
  try {
    const existingData = fs.readFileSync('deployment.json', 'utf8');
    existingDeployments = JSON.parse(existingData);
  } catch (error) {
    // 文件不存在或格式错误，使用空对象
  }

  // 更新部署信息
  existingDeployments[networkName] = deploymentData;

  fs.writeFileSync(
    'deployment.json',
    JSON.stringify(existingDeployments, null, 2)
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
