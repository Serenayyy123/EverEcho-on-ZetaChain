/**
 * 重新部署TaskEscrow合约，使用新的ECHO代币地址
 * 
 * 问题：当前TaskEscrow合约中配置的ECHO代币地址是旧地址
 * 解决方案：重新部署TaskEscrow合约，使用新的ECHO代币地址
 */

import { ethers } from 'hardhat';

async function deployFixedTaskEscrowWithNewEcho() {
  console.log('🚀 开始重新部署TaskEscrow合约（使用新ECHO代币地址）...\n');

  const [deployer] = await ethers.getSigners();
  const chainId = await deployer.provider.getNetwork().then(n => Number(n.chainId));
  
  console.log(`📋 部署信息:`);
  console.log(`   - 部署者地址: ${deployer.address}`);
  console.log(`   - 链ID: ${chainId}`);
  console.log(`   - 余额: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH\n`);

  // 获取当前地址配置
  let NEW_ECHO_TOKEN_ADDRESS: string;
  let REGISTER_ADDRESS: string;
  
  if (chainId === 31337) {
    // Local Hardhat Network
    NEW_ECHO_TOKEN_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    REGISTER_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
  } else if (chainId === 7001) {
    // ZetaChain Athens Testnet
    NEW_ECHO_TOKEN_ADDRESS = '0x876E3e3508c8ee669359A0e58A7bADD55530B8B3';
    REGISTER_ADDRESS = '0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA';
  } else {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  console.log(`🔧 合约地址配置:`);
  console.log(`   - 新 ECHO 代币地址: ${NEW_ECHO_TOKEN_ADDRESS}`);
  console.log(`   - Register 地址: ${REGISTER_ADDRESS}\n`);

  try {
    // 1. 部署新的TaskEscrow合约
    console.log('📦 部署TaskEscrow合约...');
    const TaskEscrowFactory = await ethers.getContractFactory('TaskEscrow');
    const taskEscrow = await TaskEscrowFactory.deploy(NEW_ECHO_TOKEN_ADDRESS, REGISTER_ADDRESS);
    await taskEscrow.waitForDeployment();
    
    const taskEscrowAddress = await taskEscrow.getAddress();
    console.log(`✅ TaskEscrow合约部署成功: ${taskEscrowAddress}`);

    // 2. 验证配置
    console.log('\n🔍 验证配置...');
    const configuredEchoToken = await taskEscrow.echoToken();
    const configuredRegister = await taskEscrow.registerContract();

    console.log(`   - 配置的 ECHO 代币地址: ${configuredEchoToken}`);
    console.log(`   - 配置的 Register 地址: ${configuredRegister}`);

    // 验证地址匹配
    const echoMatches = configuredEchoToken.toLowerCase() === NEW_ECHO_TOKEN_ADDRESS.toLowerCase();
    const registerMatches = configuredRegister.toLowerCase() === REGISTER_ADDRESS.toLowerCase();

    console.log(`   - ECHO 地址匹配: ${echoMatches ? '✅' : '❌'}`);
    console.log(`   - Register 地址匹配: ${registerMatches ? '✅' : '❌'}`);

    if (!echoMatches || !registerMatches) {
      throw new Error('地址配置验证失败');
    }

    // 3. 检查新ECHO代币合约中的TaskEscrow地址是否需要更新
    console.log('\n🔧 检查ECHO代币合约配置...');
    const ECHO_TOKEN_ABI = [
      'function taskEscrowAddress() view returns (address)',
      'function setTaskEscrowAddress(address) external',
      'function owner() view returns (address)'
    ];

    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    const echoTokenContract = new ethers.Contract(NEW_ECHO_TOKEN_ADDRESS, ECHO_TOKEN_ABI, provider);
    
    const currentTaskEscrowInEcho = await echoTokenContract.taskEscrowAddress();
    console.log(`   - ECHO代币中配置的TaskEscrow地址: ${currentTaskEscrowInEcho}`);
    console.log(`   - 新TaskEscrow地址: ${taskEscrowAddress}`);
    
    const needsUpdate = currentTaskEscrowInEcho.toLowerCase() !== taskEscrowAddress.toLowerCase();
    console.log(`   - 需要更新ECHO代币配置: ${needsUpdate ? '是' : '否'}`);

    if (needsUpdate) {
      console.log('\n⚠️  需要更新ECHO代币合约中的TaskEscrow地址');
      console.log('   请运行以下命令更新ECHO代币配置:');
      console.log(`   echoToken.setTaskEscrowAddress('${taskEscrowAddress}')`);
    }

    // 4. 输出部署结果
    console.log('\n🎉 TaskEscrow部署完成！');
    console.log(`\n📋 新的合约地址:`);
    console.log(`   TaskEscrow: ${taskEscrowAddress}`);
    console.log(`\n⚠️  下一步操作:`);
    console.log(`   1. 更新 frontend/src/contracts/addresses.ts 中的 taskEscrow 地址`);
    console.log(`   2. 更新ECHO代币合约中的TaskEscrow地址（如果需要）`);
    console.log(`   3. 重新创建测试任务（因为旧任务在旧合约中）`);
    console.log(`   4. 测试 confirm complete 功能`);

    // 5. 生成更新命令
    console.log(`\n🔧 地址更新命令:`);
    console.log(`   将以下地址更新到 addresses.ts:`);
    console.log(`   taskEscrow: '${taskEscrowAddress}'`);

    return {
      taskEscrow: taskEscrowAddress,
      echoToken: NEW_ECHO_TOKEN_ADDRESS,
      register: REGISTER_ADDRESS,
      chainId,
      needsEchoUpdate: needsUpdate
    };

  } catch (error: any) {
    console.error('❌ 部署失败:', error.message);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  deployFixedTaskEscrowWithNewEcho()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { deployFixedTaskEscrowWithNewEcho };