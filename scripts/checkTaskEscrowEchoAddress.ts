/**
 * 检查TaskEscrow合约中配置的ECHO代币地址
 * 验证是否与新部署的ECHO代币地址匹配
 */

import { ethers } from 'ethers';

async function checkTaskEscrowEchoAddress() {
  console.log('🔍 检查TaskEscrow合约中的ECHO代币地址配置...\n');

  const TASK_ESCROW_ADDRESS = '0xE442Eb737983986153E42C9ad28530676d8C1f55';
  const NEW_ECHO_TOKEN_ADDRESS = '0x876E3e3508c8ee669359A0e58A7bADD55530B8B3';

  const TASK_ESCROW_ABI = [
    'function echoToken() view returns (address)',
    'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt, uint256 echoPostFee, address rewardAsset, uint256 rewardAmount)'
  ];

  try {
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    const taskEscrow = new ethers.Contract(TASK_ESCROW_ADDRESS, TASK_ESCROW_ABI, provider);

    console.log('📋 地址信息:');
    console.log(`   - TaskEscrow 地址: ${TASK_ESCROW_ADDRESS}`);
    console.log(`   - 新 ECHO 代币地址: ${NEW_ECHO_TOKEN_ADDRESS}`);

    // 1. 检查TaskEscrow中配置的ECHO代币地址
    console.log('\n🔍 检查TaskEscrow配置:');
    const configuredEchoAddress = await taskEscrow.echoToken();
    console.log(`   - TaskEscrow中配置的ECHO地址: ${configuredEchoAddress}`);
    
    const addressMatches = configuredEchoAddress.toLowerCase() === NEW_ECHO_TOKEN_ADDRESS.toLowerCase();
    console.log(`   - 地址匹配: ${addressMatches ? '✅' : '❌'}`);

    if (!addressMatches) {
      console.log('\n❌ 问题发现:');
      console.log('   TaskEscrow合约中的ECHO代币地址与新部署的地址不匹配！');
      console.log('\n💡 解决方案:');
      console.log('   需要重新部署TaskEscrow合约，使用新的ECHO代币地址');
      console.log('   或者修改TaskEscrow合约以支持更新ECHO代币地址');
      
      console.log('\n🚨 这就是confirm complete失败的根本原因:');
      console.log('   1. TaskEscrow尝试调用旧ECHO代币合约的transfer和burn函数');
      console.log('   2. 但是旧合约可能已经没有足够的余额或权限');
      console.log('   3. 新ECHO代币合约有正确的TaskEscrow地址配置，但TaskEscrow不知道新地址');
    } else {
      console.log('\n✅ 配置正确:');
      console.log('   TaskEscrow合约中的ECHO代币地址与新部署的地址匹配');
    }

    // 2. 检查任务3的状态
    console.log('\n📋 检查任务3状态:');
    try {
      const task = await taskEscrow.tasks(3);
      console.log(`   - 任务ID: ${task.taskId}`);
      console.log(`   - 创建者: ${task.creator}`);
      console.log(`   - Helper: ${task.helper}`);
      console.log(`   - 奖励: ${ethers.formatEther(task.reward)} ECHO`);
      console.log(`   - 状态: ${task.status} (2=Submitted)`);
    } catch (error: any) {
      console.log(`   ❌ 无法读取任务3: ${error.message}`);
    }

    return {
      taskEscrowAddress: TASK_ESCROW_ADDRESS,
      configuredEchoAddress,
      newEchoAddress: NEW_ECHO_TOKEN_ADDRESS,
      addressMatches
    };

  } catch (error: any) {
    console.error('❌ 检查失败:', error.message);
    throw error;
  }
}

checkTaskEscrowEchoAddress().catch(console.error);