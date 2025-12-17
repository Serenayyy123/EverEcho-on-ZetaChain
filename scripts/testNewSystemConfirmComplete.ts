/**
 * 测试新部署的系统是否能正常执行 confirm complete
 */

import { ethers } from 'ethers';

async function testNewSystemConfirmComplete() {
  console.log('🧪 测试新系统的 confirm complete 功能...\n');

  // 新部署的合约地址
  const TASK_ESCROW_ADDRESS = '0x162E96b13E122719E90Cf3544E6Eb29DFa834757';
  const ECHO_TOKEN_ADDRESS = '0x650AAE045552567df9eb0633afd77D44308D3e6D';
  const REGISTER_ADDRESS = '0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA';

  const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);

  // 合约 ABI
  const TASK_ESCROW_ABI = [
    'function echoToken() view returns (address)',
    'function registerContract() view returns (address)',
    'function taskCounter() view returns (uint256)',
    'function tasks(uint256) view returns (tuple(uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt, uint256 echoPostFee, address rewardAsset, uint256 rewardAmount))'
  ];

  const ECHO_TOKEN_ABI = [
    'function taskEscrowAddress() view returns (address)',
    'function registerAddress() view returns (address)',
    'function owner() view returns (address)',
    'function balanceOf(address) view returns (uint256)',
    'function totalSupply() view returns (uint256)'
  ];

  try {
    // 1. 验证合约配置
    console.log('🔍 验证合约配置...');
    
    const taskEscrow = new ethers.Contract(TASK_ESCROW_ADDRESS, TASK_ESCROW_ABI, provider);
    const echoToken = new ethers.Contract(ECHO_TOKEN_ADDRESS, ECHO_TOKEN_ABI, provider);

    const taskEscrowEchoToken = await taskEscrow.echoToken();
    const taskEscrowRegister = await taskEscrow.registerContract();
    const echoTokenTaskEscrow = await echoToken.taskEscrowAddress();
    const echoTokenRegister = await echoToken.registerAddress();

    console.log(`📋 TaskEscrow 配置:`);
    console.log(`   - ECHO Token 地址: ${taskEscrowEchoToken}`);
    console.log(`   - Register 地址: ${taskEscrowRegister}`);

    console.log(`📋 ECHO Token 配置:`);
    console.log(`   - TaskEscrow 地址: ${echoTokenTaskEscrow}`);
    console.log(`   - Register 地址: ${echoTokenRegister}`);

    // 验证地址匹配
    const echoTokenMatches = taskEscrowEchoToken.toLowerCase() === ECHO_TOKEN_ADDRESS.toLowerCase();
    const registerMatches = taskEscrowRegister.toLowerCase() === REGISTER_ADDRESS.toLowerCase();
    const taskEscrowMatches = echoTokenTaskEscrow.toLowerCase() === TASK_ESCROW_ADDRESS.toLowerCase();
    const registerMatches2 = echoTokenRegister.toLowerCase() === REGISTER_ADDRESS.toLowerCase();

    console.log(`\n🔍 地址匹配验证:`);
    console.log(`   - TaskEscrow → ECHO Token: ${echoTokenMatches ? '✅' : '❌'}`);
    console.log(`   - TaskEscrow → Register: ${registerMatches ? '✅' : '❌'}`);
    console.log(`   - ECHO Token → TaskEscrow: ${taskEscrowMatches ? '✅' : '❌'}`);
    console.log(`   - ECHO Token → Register: ${registerMatches2 ? '✅' : '❌'}`);

    if (!echoTokenMatches || !registerMatches || !taskEscrowMatches || !registerMatches2) {
      throw new Error('地址配置不匹配');
    }

    // 2. 检查 ECHO Token 状态
    console.log('\n💰 检查 ECHO Token 状态...');
    const totalSupply = await echoToken.totalSupply();
    const owner = await echoToken.owner();
    
    console.log(`   - 总供应量: ${ethers.formatEther(totalSupply)} ECHO`);
    console.log(`   - 合约所有者: ${owner}`);

    // 3. 检查 TaskEscrow 状态
    console.log('\n📋 检查 TaskEscrow 状态...');
    const taskCounter = await taskEscrow.taskCounter();
    console.log(`   - 任务计数器: ${taskCounter}`);

    // 4. 检查是否有现有任务
    if (taskCounter > 0) {
      console.log('\n📝 检查现有任务...');
      for (let i = 1; i <= Number(taskCounter); i++) {
        try {
          const task = await taskEscrow.tasks(i);
          console.log(`   - 任务 ${i}: 状态 ${task.status}, 创建者 ${task.creator}`);
        } catch (error) {
          console.log(`   - 任务 ${i}: 无法读取`);
        }
      }
    }

    console.log('\n✅ 系统配置验证完成！');
    console.log('\n💡 下一步测试建议:');
    console.log('   1. 重新启动前端应用');
    console.log('   2. 创建一个新任务');
    console.log('   3. 接受任务并提交工作');
    console.log('   4. 测试 confirm complete 功能');

    return {
      taskEscrow: TASK_ESCROW_ADDRESS,
      echoToken: ECHO_TOKEN_ADDRESS,
      register: REGISTER_ADDRESS,
      configValid: true
    };

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testNewSystemConfirmComplete()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { testNewSystemConfirmComplete };