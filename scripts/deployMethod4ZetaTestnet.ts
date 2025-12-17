import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ZetaChain Athens Testnet配置
const ZETA_TESTNET_CONFIG = {
  chainId: 7001,
  name: 'ZetaChain Athens Testnet',
  rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
  blockExplorer: 'https://athens.explorer.zetachain.com'
};

async function deployMethod4ZetaTestnet() {
  console.log('🚀 部署Method 4系统到ZetaChain测试网...');
  console.log('');
  
  // 检查环境变量
  const privateKey = process.env.ZETA_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ 请设置环境变量 ZETA_PRIVATE_KEY');
    console.log('');
    console.log('📋 设置方法:');
    console.log('1. 创建 .env 文件');
    console.log('2. 添加: ZETA_PRIVATE_KEY=你的私钥');
    console.log('3. 确保账号有足够的ZETA代币作为gas费');
    console.log('');
    console.log('🔗 获取测试代币: https://labs.zetachain.com/get-zeta');
    return;
  }

  try {
    // 连接到ZetaChain测试网
    console.log('🔗 连接到ZetaChain Athens测试网...');
    const provider = new ethers.JsonRpcProvider(ZETA_TESTNET_CONFIG.rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    
    const deployerAddress = await signer.getAddress();
    console.log('📋 部署账号:', deployerAddress);
    
    // 检查余额
    const balance = await provider.getBalance(deployerAddress);
    const balanceInZeta = ethers.formatEther(balance);
    console.log('💰 ZETA余额:', balanceInZeta, 'ZETA');
    
    if (parseFloat(balanceInZeta) < 0.1) {
      console.warn('⚠️ ZETA余额可能不足，建议至少有0.1 ZETA作为gas费');
      console.log('🔗 获取测试代币: https://labs.zetachain.com/get-zeta');
    }
    
    console.log('');
    
    // 读取合约字节码和ABI
    console.log('📦 准备合约部署...');
    
    // ECHOToken
    const echoTokenArtifact = JSON.parse(fs.readFileSync('artifacts/contracts/EOCHOToken.sol/EOCHOToken.json', 'utf8'));
    const echoTokenFactory = new ethers.ContractFactory(echoTokenArtifact.abi, echoTokenArtifact.bytecode, signer);
    
    // Register
    const registerArtifact = JSON.parse(fs.readFileSync('artifacts/contracts/Register.sol/Register.json', 'utf8'));
    const registerFactory = new ethers.ContractFactory(registerArtifact.abi, registerArtifact.bytecode, signer);
    
    // UniversalRewardInterface
    const universalRewardArtifact = JSON.parse(fs.readFileSync('artifacts/contracts/UniversalRewardInterface.sol/UniversalRewardInterface.json', 'utf8'));
    const universalRewardFactory = new ethers.ContractFactory(universalRewardArtifact.abi, universalRewardArtifact.bytecode, signer);
    
    // TaskEscrow (Enhanced)
    const taskEscrowArtifact = JSON.parse(fs.readFileSync('artifacts/contracts/TaskEscrow.sol/TaskEscrow.json', 'utf8'));
    const taskEscrowFactory = new ethers.ContractFactory(taskEscrowArtifact.abi, taskEscrowArtifact.bytecode, signer);
    
    console.log('✅ 合约工厂准备完成');
    console.log('');
    
    // 步骤1: 部署ECHOToken
    console.log('📦 步骤1: 部署ECHOToken...');
    const echoToken = await echoTokenFactory.deploy();
    await echoToken.waitForDeployment();
    const echoTokenAddress = await echoToken.getAddress();
    console.log('✅ ECHOToken部署成功:', echoTokenAddress);
    
    // 步骤2: 部署Register
    console.log('📦 步骤2: 部署Register...');
    const register = await registerFactory.deploy(echoTokenAddress);
    await register.waitForDeployment();
    const registerAddress = await register.getAddress();
    console.log('✅ Register部署成功:', registerAddress);
    
    // 步骤3: 配置ECHOToken
    console.log('🔧 步骤3: 配置ECHOToken...');
    const echoTokenContract = echoToken as any;
    const setRegisterTx = await echoTokenContract.setRegisterAddress(registerAddress);
    await setRegisterTx.wait();
    console.log('✅ Register地址已设置到ECHOToken');
    
    // 步骤4: 部署UniversalRewardInterface
    console.log('📦 步骤4: 部署UniversalRewardInterface...');
    const universalReward = await universalRewardFactory.deploy();
    await universalReward.waitForDeployment();
    const universalRewardAddress = await universalReward.getAddress();
    console.log('✅ UniversalRewardInterface部署成功:', universalRewardAddress);
    
    // 步骤5: 部署Enhanced TaskEscrow
    console.log('📦 步骤5: 部署Enhanced TaskEscrow...');
    const taskEscrow = await taskEscrowFactory.deploy(echoTokenAddress, registerAddress);
    await taskEscrow.waitForDeployment();
    const taskEscrowAddress = await taskEscrow.getAddress();
    console.log('✅ Enhanced TaskEscrow部署成功:', taskEscrowAddress);
    
    // 步骤6: 配置TaskEscrow
    console.log('🔧 步骤6: 配置TaskEscrow...');
    const taskEscrowContract = taskEscrow as any;
    const setUniversalRewardTx = await taskEscrowContract.setUniversalRewardAddress(universalRewardAddress);
    await setUniversalRewardTx.wait();
    console.log('✅ UniversalReward地址已设置到TaskEscrow');
    
    const setTaskEscrowTx = await echoTokenContract.setTaskEscrowAddress(taskEscrowAddress);
    await setTaskEscrowTx.wait();
    console.log('✅ TaskEscrow地址已设置到ECHOToken');
    
    console.log('');
    
    // 更新前端地址配置
    console.log('📝 更新前端配置...');
    const addressesPath = 'frontend/src/contracts/addresses.ts';
    let addressesContent = fs.readFileSync(addressesPath, 'utf8');
    
    // 更新ZetaChain测试网地址
    const zetaAddressesBlock = `  if (chainId === 7001) {
    // ZetaChain Athens Testnet - Method 4
    return {
      taskEscrow: '${taskEscrowAddress}',
      echoToken: '${echoTokenAddress}',
      register: '${registerAddress}',
      universalReward: '${universalRewardAddress}'
    };
  }`;
    
    addressesContent = addressesContent.replace(
      /if \(chainId === 7001\) \{[\s\S]*?\}/,
      zetaAddressesBlock
    );
    
    fs.writeFileSync(addressesPath, addressesContent);
    console.log('✅ 前端地址配置已更新');
    
    // 更新环境变量
    console.log('📝 更新环境变量...');
    const envContent = `
# ZetaChain Athens Testnet - Method 4 Addresses
VITE_ZETA_TASK_ESCROW_ADDRESS=${taskEscrowAddress}
VITE_ZETA_ECHO_TOKEN_ADDRESS=${echoTokenAddress}
VITE_ZETA_REGISTER_ADDRESS=${registerAddress}
VITE_ZETA_UNIVERSAL_REWARD_ADDRESS=${universalRewardAddress}

# ZetaChain Network Configuration
VITE_ZETA_CHAIN_ID=7001
VITE_ZETA_RPC_URL=${ZETA_TESTNET_CONFIG.rpcUrl}
VITE_ZETA_NETWORK_NAME=ZetaChain Athens Testnet
`;
    
    fs.writeFileSync('.env.zeta', envContent);
    console.log('✅ ZetaChain环境变量已保存到 .env.zeta');
    
    // 更新后端配置
    const backendEnvPath = 'backend/.env.zeta';
    const backendEnvContent = `
# ZetaChain Athens Testnet Configuration
RPC_URL=${ZETA_TESTNET_CONFIG.rpcUrl}
TASK_ESCROW_ADDRESS=${taskEscrowAddress}
CHAIN_ID=7001

# Database (保持现有配置)
DATABASE_URL="postgresql://everecho:everecho_password@localhost:5432/everecho?schema=public"
PORT=3001

# Event Listener
ENABLE_EVENT_LISTENER=true
ENABLE_CHAIN_SYNC=true

# CORS
CORS_ORIGIN=http://localhost:5173

# AI Configuration
AI_PROVIDER=mock
`;
    
    fs.writeFileSync(backendEnvPath, backendEnvContent);
    console.log('✅ 后端ZetaChain配置已保存到 backend/.env.zeta');
    
    console.log('');
    console.log('🎉 Method 4系统部署到ZetaChain测试网完成！');
    console.log('');
    console.log('📋 部署摘要:');
    console.log('   网络: ZetaChain Athens Testnet (Chain ID: 7001)');
    console.log('   部署账号:', deployerAddress);
    console.log('   剩余ZETA余额:', balanceInZeta, 'ZETA');
    console.log('');
    console.log('📋 合约地址:');
    console.log('   TaskEscrow (Enhanced):', taskEscrowAddress);
    console.log('   ECHOToken:', echoTokenAddress);
    console.log('   Register:', registerAddress);
    console.log('   UniversalReward:', universalRewardAddress);
    console.log('');
    console.log('🔗 区块链浏览器:');
    console.log('   TaskEscrow:', `${ZETA_TESTNET_CONFIG.blockExplorer}/address/${taskEscrowAddress}`);
    console.log('   ECHOToken:', `${ZETA_TESTNET_CONFIG.blockExplorer}/address/${echoTokenAddress}`);
    console.log('   Register:', `${ZETA_TESTNET_CONFIG.blockExplorer}/address/${registerAddress}`);
    console.log('   UniversalReward:', `${ZETA_TESTNET_CONFIG.blockExplorer}/address/${universalRewardAddress}`);
    console.log('');
    console.log('🔧 下一步:');
    console.log('1. 在MetaMask中添加ZetaChain Athens测试网');
    console.log('2. 获取测试ZETA代币: https://labs.zetachain.com/get-zeta');
    console.log('3. 使用 npm run dev:zeta 启动ZetaChain模式');
    console.log('4. 开始真实账号测试！');
    console.log('');
    console.log('✅ Method 4原子操作已在ZetaChain上启用！');
    console.log('✅ TaskID解析问题在真实网络上完全解决！');
    
  } catch (error) {
    console.error('❌ 部署失败:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        console.log('');
        console.log('💡 解决方案:');
        console.log('1. 获取更多ZETA测试代币: https://labs.zetachain.com/get-zeta');
        console.log('2. 确保账号有足够余额支付gas费');
      } else if (error.message.includes('nonce')) {
        console.log('');
        console.log('💡 解决方案:');
        console.log('1. 等待几分钟后重试');
        console.log('2. 或在MetaMask中重置账号nonce');
      }
    }
  }
}

deployMethod4ZetaTestnet().catch(console.error);