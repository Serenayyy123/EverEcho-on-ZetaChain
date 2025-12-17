/**
 * 重新部署 ECHO 代币合约以修复 TaskEscrow 地址不匹配问题
 * 
 * 问题：当前 ECHO 代币合约中配置的 taskEscrowAddress 与实际 TaskEscrow 地址不匹配
 * 解决方案：重新部署 ECHO 代币合约，并正确设置 TaskEscrow 地址
 */

import { ethers } from 'hardhat';

async function deployFixedEchoToken() {
  console.log('🚀 开始重新部署 ECHO 代币合约...\n');

  const [deployer] = await ethers.getSigners();
  const chainId = await deployer.provider.getNetwork().then(n => Number(n.chainId));
  
  console.log(`📋 部署信息:`);
  console.log(`   - 部署者地址: ${deployer.address}`);
  console.log(`   - 链ID: ${chainId}`);
  console.log(`   - 余额: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH\n`);

  // 获取当前地址配置（硬编码以避免 ES 模块问题）
  let TASK_ESCROW_ADDRESS: string;
  let REGISTER_ADDRESS: string;
  
  if (chainId === 31337) {
    // Local Hardhat Network
    TASK_ESCROW_ADDRESS = '0x0165878A594ca255338adfa4d48449f69242Eb8F';
    REGISTER_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
  } else if (chainId === 7001) {
    // ZetaChain Athens Testnet
    TASK_ESCROW_ADDRESS = '0xE442Eb737983986153E42C9ad28530676d8C1f55';
    REGISTER_ADDRESS = '0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA';
  } else {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  console.log(`🔧 合约地址配置:`);
  console.log(`   - TaskEscrow 地址: ${TASK_ESCROW_ADDRESS}`);
  console.log(`   - Register 地址: ${REGISTER_ADDRESS}\n`);

  try {
    // 1. 部署新的 ECHO 代币合约
    console.log('📦 部署 ECHO 代币合约...');
    const EOCHOTokenFactory = await ethers.getContractFactory('EOCHOToken');
    const echoToken = await EOCHOTokenFactory.deploy();
    await echoToken.waitForDeployment();
    
    const echoTokenAddress = await echoToken.getAddress();
    console.log(`✅ ECHO 代币合约部署成功: ${echoTokenAddress}`);

    // 2. 设置 Register 地址
    console.log('\n🔧 配置 Register 地址...');
    const setRegisterTx = await echoToken.setRegisterAddress(REGISTER_ADDRESS);
    await setRegisterTx.wait();
    console.log('✅ Register 地址设置成功');

    // 3. 设置 TaskEscrow 地址（这是关键修复）
    console.log('\n🔧 配置 TaskEscrow 地址...');
    const setTaskEscrowTx = await echoToken.setTaskEscrowAddress(TASK_ESCROW_ADDRESS);
    await setTaskEscrowTx.wait();
    console.log('✅ TaskEscrow 地址设置成功');

    // 4. 验证配置
    console.log('\n🔍 验证配置...');
    const configuredRegister = await echoToken.registerAddress();
    const configuredTaskEscrow = await echoToken.taskEscrowAddress();
    const owner = await echoToken.owner();

    console.log(`   - 合约所有者: ${owner}`);
    console.log(`   - 配置的 Register 地址: ${configuredRegister}`);
    console.log(`   - 配置的 TaskEscrow 地址: ${configuredTaskEscrow}`);

    // 验证地址匹配
    const registerMatches = configuredRegister.toLowerCase() === REGISTER_ADDRESS.toLowerCase();
    const taskEscrowMatches = configuredTaskEscrow.toLowerCase() === TASK_ESCROW_ADDRESS.toLowerCase();

    console.log(`   - Register 地址匹配: ${registerMatches ? '✅' : '❌'}`);
    console.log(`   - TaskEscrow 地址匹配: ${taskEscrowMatches ? '✅' : '❌'}`);

    if (!registerMatches || !taskEscrowMatches) {
      throw new Error('地址配置验证失败');
    }

    // 5. 输出部署结果
    console.log('\n🎉 部署完成！');
    console.log(`\n📋 新的合约地址:`);
    console.log(`   ECHO Token: ${echoTokenAddress}`);
    console.log(`\n⚠️  下一步操作:`);
    console.log(`   1. 更新 frontend/src/contracts/addresses.ts 中的 echoToken 地址`);
    console.log(`   2. 更新相关的 ABI 文件（如果有变化）`);
    console.log(`   3. 重新启动前端应用`);
    console.log(`   4. 测试 confirm complete 功能`);

    // 6. 生成更新命令
    console.log(`\n🔧 地址更新命令:`);
    console.log(`   将以下地址更新到 addresses.ts:`);
    console.log(`   echoToken: '${echoTokenAddress}'`);

    return {
      echoToken: echoTokenAddress,
      taskEscrow: TASK_ESCROW_ADDRESS,
      register: REGISTER_ADDRESS,
      chainId
    };

  } catch (error: any) {
    console.error('❌ 部署失败:', error.message);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  deployFixedEchoToken()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { deployFixedEchoToken };