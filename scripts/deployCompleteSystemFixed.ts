/**
 * 完整重新部署系统以修复 confirm complete 问题
 * 
 * 步骤：
 * 1. 部署新的 ECHO Token
 * 2. 部署新的 TaskEscrow（使用新的 ECHO Token 地址）
 * 3. 设置 ECHO Token 的 TaskEscrow 地址
 * 4. 验证所有配置
 */

import { ethers } from 'hardhat';

async function deployCompleteSystemFixed() {
  console.log('🚀 开始完整重新部署系统...\n');

  const [deployer] = await ethers.getSigners();
  const chainId = await deployer.provider.getNetwork().then(n => Number(n.chainId));
  
  console.log(`📋 部署信息:`);
  console.log(`   - 部署者地址: ${deployer.address}`);
  console.log(`   - 链ID: ${chainId}`);
  console.log(`   - 余额: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH\n`);

  // 获取 Register 地址（保持不变）
  let REGISTER_ADDRESS: string;
  let UNIVERSAL_REWARD_ADDRESS: string;
  
  if (chainId === 31337) {
    // Local Hardhat Network
    REGISTER_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    UNIVERSAL_REWARD_ADDRESS = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
  } else if (chainId === 7001) {
    // ZetaChain Athens Testnet
    REGISTER_ADDRESS = '0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA';
    UNIVERSAL_REWARD_ADDRESS = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
  } else {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  console.log(`🔧 已存在的合约地址:`);
  console.log(`   - Register 地址: ${REGISTER_ADDRESS}`);
  console.log(`   - UniversalReward 地址: ${UNIVERSAL_REWARD_ADDRESS}\n`);

  try {
    // 1. 部署新的 ECHO Token
    console.log('📦 部署新的 ECHO Token 合约...');
    const EOCHOTokenFactory = await ethers.getContractFactory('EOCHOToken');
    const echoToken = await EOCHOTokenFactory.deploy();
    await echoToken.waitForDeployment();
    
    const echoTokenAddress = await echoToken.getAddress();
    console.log(`✅ ECHO Token 合约部署成功: ${echoTokenAddress}`);

    // 2. 设置 ECHO Token 的 Register 地址
    console.log('\n🔧 配置 ECHO Token 的 Register 地址...');
    const setRegisterTx = await echoToken.setRegisterAddress(REGISTER_ADDRESS);
    await setRegisterTx.wait();
    console.log('✅ Register 地址设置成功');

    // 3. 部署新的 TaskEscrow
    console.log('\n📦 部署新的 TaskEscrow 合约...');
    const TaskEscrowFactory = await ethers.getContractFactory('TaskEscrow');
    const taskEscrow = await TaskEscrowFactory.deploy(echoTokenAddress, REGISTER_ADDRESS);
    await taskEscrow.waitForDeployment();
    
    const taskEscrowAddress = await taskEscrow.getAddress();
    console.log(`✅ TaskEscrow 合约部署成功: ${taskEscrowAddress}`);

    // 4. 设置 ECHO Token 的 TaskEscrow 地址
    console.log('\n🔧 配置 ECHO Token 的 TaskEscrow 地址...');
    const setTaskEscrowTx = await echoToken.setTaskEscrowAddress(taskEscrowAddress);
    await setTaskEscrowTx.wait();
    console.log('✅ TaskEscrow 地址设置成功');

    // 5. 验证所有配置
    console.log('\n🔍 验证所有配置...');
    
    // 验证 ECHO Token 配置
    const configuredRegister = await echoToken.registerAddress();
    const configuredTaskEscrow = await echoToken.taskEscrowAddress();
    const owner = await echoToken.owner();

    console.log(`📋 ECHO Token 配置:`);
    console.log(`   - 合约所有者: ${owner}`);
    console.log(`   - Register 地址: ${configuredRegister}`);
    console.log(`   - TaskEscrow 地址: ${configuredTaskEscrow}`);

    // 验证 TaskEscrow 配置
    const taskEscrowEchoToken = await taskEscrow.echoToken();
    const taskEscrowRegister = await taskEscrow.registerContract();

    console.log(`📋 TaskEscrow 配置:`);
    console.log(`   - ECHO Token 地址: ${taskEscrowEchoToken}`);
    console.log(`   - Register 地址: ${taskEscrowRegister}`);

    // 验证地址匹配
    const echoTokenRegisterMatches = configuredRegister.toLowerCase() === REGISTER_ADDRESS.toLowerCase();
    const echoTokenTaskEscrowMatches = configuredTaskEscrow.toLowerCase() === taskEscrowAddress.toLowerCase();
    const taskEscrowEchoTokenMatches = taskEscrowEchoToken.toLowerCase() === echoTokenAddress.toLowerCase();
    const taskEscrowRegisterMatches = taskEscrowRegister.toLowerCase() === REGISTER_ADDRESS.toLowerCase();

    console.log(`\n🔍 地址匹配验证:`);
    console.log(`   - ECHO Token → Register: ${echoTokenRegisterMatches ? '✅' : '❌'}`);
    console.log(`   - ECHO Token → TaskEscrow: ${echoTokenTaskEscrowMatches ? '✅' : '❌'}`);
    console.log(`   - TaskEscrow → ECHO Token: ${taskEscrowEchoTokenMatches ? '✅' : '❌'}`);
    console.log(`   - TaskEscrow → Register: ${taskEscrowRegisterMatches ? '✅' : '❌'}`);

    const allMatches = echoTokenRegisterMatches && echoTokenTaskEscrowMatches && 
                      taskEscrowEchoTokenMatches && taskEscrowRegisterMatches;

    if (!allMatches) {
      throw new Error('地址配置验证失败');
    }

    // 6. 输出部署结果
    console.log('\n🎉 系统部署完成！');
    console.log(`\n📋 新的合约地址:`);
    console.log(`   ECHO Token: ${echoTokenAddress}`);
    console.log(`   TaskEscrow: ${taskEscrowAddress}`);
    console.log(`   Register: ${REGISTER_ADDRESS} (保持不变)`);
    console.log(`   UniversalReward: ${UNIVERSAL_REWARD_ADDRESS} (保持不变)`);
    
    console.log(`\n⚠️  下一步操作:`);
    console.log(`   1. 更新 frontend/src/contracts/addresses.ts 中的地址`);
    console.log(`   2. 重新启动前端应用`);
    console.log(`   3. 测试 confirm complete 功能`);

    // 7. 生成更新命令
    console.log(`\n🔧 addresses.ts 更新内容:`);
    if (chainId === 7001) {
      console.log(`   ZetaChain Athens Testnet 配置:`);
      console.log(`   taskEscrow: '${taskEscrowAddress}',`);
      console.log(`   echoToken: '${echoTokenAddress}',`);
      console.log(`   register: '${REGISTER_ADDRESS}',`);
      console.log(`   universalReward: '${UNIVERSAL_REWARD_ADDRESS}'`);
    }

    return {
      taskEscrow: taskEscrowAddress,
      echoToken: echoTokenAddress,
      register: REGISTER_ADDRESS,
      universalReward: UNIVERSAL_REWARD_ADDRESS,
      chainId
    };

  } catch (error: any) {
    console.error('❌ 部署失败:', error.message);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  deployCompleteSystemFixed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { deployCompleteSystemFixed };