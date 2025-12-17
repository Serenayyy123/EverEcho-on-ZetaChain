/**
 * 测试修复后的 confirm complete 功能
 * 验证 ECHO 代币地址修复是否解决了 burn 权限问题
 */

import { ethers } from 'ethers';

async function testConfirmCompleteFixed() {
  console.log('🧪 测试修复后的 confirm complete 功能...\n');

  const TASK_ESCROW_ADDRESS = '0xE442Eb737983986153E42C9ad28530676d8C1f55';
  const ECHO_TOKEN_ADDRESS = '0x876E3e3508c8ee669359A0e58A7bADD55530B8B3';
  const TASK_ID = 3;

  const TASK_ESCROW_ABI = [
    'function confirmComplete(uint256 taskId) external',
    'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt, uint256 echoPostFee, address rewardAsset, uint256 rewardAmount)'
  ];

  const ECHO_TOKEN_ABI = [
    'function taskEscrowAddress() view returns (address)',
    'function balanceOf(address) view returns (uint256)',
    'function burn(uint256 amount) external'
  ];

  try {
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    const taskEscrow = new ethers.Contract(TASK_ESCROW_ADDRESS, TASK_ESCROW_ABI, provider);
    const echoToken = new ethers.Contract(ECHO_TOKEN_ADDRESS, ECHO_TOKEN_ABI, provider);

    // 1. 验证 ECHO 代币配置
    console.log('🔍 验证 ECHO 代币配置:');
    const configuredTaskEscrow = await echoToken.taskEscrowAddress();
    console.log(`   - 配置的 TaskEscrow 地址: ${configuredTaskEscrow}`);
    console.log(`   - 实际的 TaskEscrow 地址: ${TASK_ESCROW_ADDRESS}`);
    
    const addressMatches = configuredTaskEscrow.toLowerCase() === TASK_ESCROW_ADDRESS.toLowerCase();
    console.log(`   - 地址匹配: ${addressMatches ? '✅' : '❌'}`);

    if (!addressMatches) {
      throw new Error('地址不匹配，修复失败');
    }

    // 2. 检查任务状态
    console.log('\n📋 检查任务状态:');
    const task = await taskEscrow.tasks(TASK_ID);
    console.log(`   - 任务ID: ${task.taskId}`);
    console.log(`   - 创建者: ${task.creator}`);
    console.log(`   - Helper: ${task.helper}`);
    console.log(`   - 奖励: ${ethers.formatEther(task.reward)} ECHO`);
    console.log(`   - 状态: ${task.status} (2=Submitted)`);

    if (Number(task.status) !== 2) {
      console.log('⚠️  任务状态不是 Submitted，无法测试 confirm complete');
      return;
    }

    // 3. 检查合约余额
    console.log('\n💰 检查合约余额:');
    const taskEscrowBalance = await echoToken.balanceOf(TASK_ESCROW_ADDRESS);
    console.log(`   - TaskEscrow 余额: ${ethers.formatEther(taskEscrowBalance)} ECHO`);

    // 4. 模拟 confirm complete 调用（不实际执行）
    console.log('\n🧪 模拟 confirm complete 调用:');
    console.log('   - 这将尝试估算 gas，如果成功说明修复有效');
    
    // 使用任务创建者的地址进行模拟
    const creatorAddress = task.creator;
    console.log(`   - 模拟调用者: ${creatorAddress}`);

    try {
      // 尝试估算 gas（不实际执行交易）
      const gasEstimate = await taskEscrow.confirmComplete.estimateGas(TASK_ID, {
        from: creatorAddress
      });
      
      console.log(`   ✅ Gas 估算成功: ${gasEstimate.toString()}`);
      console.log('   🎉 修复成功！confirm complete 功能现在应该可以正常工作');
      
    } catch (error: any) {
      console.log(`   ❌ Gas 估算失败: ${error.message}`);
      
      if (error.message.includes('missing revert data')) {
        console.log('   💡 仍然是相同的错误，可能需要进一步调查');
      } else {
        console.log('   💡 这是一个不同的错误，可能是权限或状态问题');
      }
    }

    // 5. 测试 burn 函数权限
    console.log('\n🔥 测试 burn 函数权限:');
    try {
      // 尝试直接调用 burn 函数（应该失败，因为只有 TaskEscrow 可以调用）
      await echoToken.burn.estimateGas(ethers.parseEther('0.1'), {
        from: creatorAddress
      });
      console.log('   ❌ 意外成功：普通用户不应该能调用 burn');
    } catch (error: any) {
      if (error.message.includes('OnlyTaskEscrow')) {
        console.log('   ✅ burn 函数权限控制正常工作');
      } else {
        console.log(`   ⚠️  burn 函数调用失败，但错误不是预期的: ${error.message}`);
      }
    }

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
  }
}

testConfirmCompleteFixed().catch(console.error);