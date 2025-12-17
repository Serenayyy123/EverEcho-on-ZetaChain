/**
 * 重新部署 TaskEscrow 合约，使用修复后的 ECHO Token 地址
 * 
 * 步骤：
 * 1. 使用新的 ECHO Token 地址部署 TaskEscrow
 * 2. 调用 ECHO Token 的 setTaskEscrowAddress() 设置新的 TaskEscrow 地址
 * 3. 更新前端配置
 */

import { ethers } from 'hardhat';

async function deployNewTaskEscrowWithFixedEcho() {
  console.log('🚀 开始重新部署 TaskEscrow 合约...\n');

  const [deployer] = await ethers.getSigners();
  const chainId = await deployer.provider.getNetwork().then(n => Number(n.chainId));
  
  console.log(`📋 部署信息:`);
  console.log(`   - 部署者地址: ${deployer.address}`);
  console.log(`   - 链ID: ${chainId}`);
  console.log(`   - 余额: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH\n`);

  // 获取当前地址配置
  let ECHO_TOKEN_ADDRESS: string;
  let REGISTER_ADDRESS: string;
  
  if (chainId === 31337) {
    // Local Hardhat Network
    ECHO_TOKEN_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    REGISTER_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
  } else if (chainId === 7001) {
    // ZetaChain Athens Testnet - 使用新部署的 ECHO Token
    ECHO_TOKEN_ADDRESS = '0x876E3e3508c8ee669359A0e58A7bADD55530B8B3';
    REGISTER_ADDRESS = '0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA';
  } else {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  console.log(`🔧 合约地址配置:`);
  console.log(`   - ECHO Token 地址: ${ECHO_TOKEN_ADDRESS}`);
  console.log(`   - Register 地址: ${REGISTER_ADDRESS}\n`);

  try {
    // 1. 部署新的 TaskEscrow 合约
    console.log('📦 部署 TaskEscrow 合约...');
    const TaskEscrowFactory = await ethers.getContractFactory('TaskEscrow');
    const taskEscrow = await TaskEscrowFactory.deploy(ECHO_TOKEN_ADDRESS, REGISTER_ADDRESS);
    await taskEscrow.waitForDeployment();
    
    const taskEscrowAddress = await taskEscrow.getAddress();
    console.log(`✅ TaskEscrow 合约部署成功: ${taskEscrowAddress}`);

    // 2. 验证 TaskEscrow 配置
    console.log('\n🔍 验证 TaskEscrow 配置...');
    const configuredEchoToken = await taskEscrow.echoToken();
    const configuredRegister = await taskEscrow.registerContract();

    console.log(`   - 配置的 ECHO Token 地址: ${configuredEchoToken}`);
    console.log(`   - 配置的 Register 地址: ${configuredRegister}`);

    // 验证地址匹配
    const echoTokenMatches = configuredEchoToken.toLowerCase() === ECHO_TOKEN_ADDRESS.toLowerCase();
    const registerMatches = configuredRegister.toLowerCase() === REGISTER_ADDRESS.toLowerCase();

    console.log(`   - ECHO Token 地址匹配: ${echoTokenMatches ? '✅' : '❌'}`);
    console.log(`   - Register 地址匹配: ${registerMatches ? '✅' : '❌'}`);

    if (!echoTokenMatches || !registerMatches) {
      throw new Error('TaskEscrow 地址配置验证失败');
    }

    // 3. 更新 ECHO Token 的 TaskEscrow 地址
    console.log('\n🔧 更新 ECHO Token 的 TaskEscrow 地址...');
    
    const ECHO_TOKEN_ABI = [
      'function owner() view returns (address)',
      'function taskEscrowAddress() view returns (address)',
      'function setTaskEscrowAddress(address) external'
    ];

    const echoToken = new ethers.Contract(ECHO_TOKEN_ADDRESS, ECHO_TOKEN_ABI, deployer);
    
    // 检查当前 TaskEscrow 地址
    const currentTaskEscrowAddress = await echoToken.taskEscrowAddress();
    console.log(`   - 当前 TaskEscrow 地址: ${currentTaskEscrowAddress}`);
    console.log(`   - 新的 TaskEscrow 地址: ${taskEscrowAddress}`);

    if (currentTaskEscrowAddress.toLowerCase() !== taskEscrowAddress.toLowerCase()) {
      // 检查是否已经设置过
      if (currentTaskEscrowAddress === ethers.ZeroAddress) {
        console.log('   - 设置 TaskEscrow 地址...');
        const setTaskEscrowTx = await echoToken.setTaskEscrowAddress(taskEscrowAddress);
        await setTaskEscrowTx.wait();
        console.log('   ✅ TaskEscrow 地址设置成功');
      } else {
        console.log('   ⚠️ ECHO Token 已经设置了不同的 TaskEscrow 地址');
        console.log('   💡 这可能需要重新部署 ECHO Token 或使用不同的解决方案');
      }
    } else {
      console.log('   ✅ TaskEscrow 地址已经正确设置');
    }

    // 4. 验证最终配置
    console.log('\n🔍 验证最终配置...');
    const finalTaskEscrowAddress = await echoToken.taskEscrowAddress();
    const finalMatches = finalTaskEscrowAddress.toLowerCase() === taskEscrowAddress.toLowerCase();
    
    console.log(`   - 最终 TaskEscrow 地址: ${finalTaskEscrowAddress}`);
    console.log(`   - 地址匹配: ${finalMatches ? '✅' : '❌'}`);

    // 5. 输出部署结果
    console.log('\n🎉 部署完成！');
    console.log(`\n📋 新的合约地址:`);
    console.log(`   TaskEscrow: ${taskEscrowAddress}`);
    console.log(`   ECHO Token: ${ECHO_TOKEN_ADDRESS} (已存在)`);
    console.log(`   Register: ${REGISTER_ADDRESS} (已存在)`);
    
    console.log(`\n⚠️  下一步操作:`);
    console.log(`   1. 更新 frontend/src/contracts/addresses.ts 中的 taskEscrow 地址`);
    console.log(`   2. 重新启动前端应用`);
    console.log(`   3. 测试 confirm complete 功能`);

    // 6. 生成更新命令
    console.log(`\n🔧 地址更新命令:`);
    console.log(`   将以下地址更新到 addresses.ts:`);
    console.log(`   taskEscrow: '${taskEscrowAddress}'`);

    return {
      taskEscrow: taskEscrowAddress,
      echoToken: ECHO_TOKEN_ADDRESS,
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
  deployNewTaskEscrowWithFixedEcho()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { deployNewTaskEscrowWithFixedEcho };