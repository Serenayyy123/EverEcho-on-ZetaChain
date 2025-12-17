/**
 * 模拟 confirmComplete 调用
 * 尝试找出具体的失败原因
 */

import { ethers } from 'ethers';

async function simulateConfirmComplete() {
  console.log('🧪 模拟 confirmComplete 调用...\n');

  const TASK_ESCROW_ADDRESS = '0xE442Eb737983986153E42C9ad28530676d8C1f55';
  const CALLER_ADDRESS = '0xD68a76259d4100A2622D643d5e62F5F92C28C4fe';
  const TASK_ID = 3;

  // 完整的 confirmComplete 函数 ABI
  const ABI = [
    'function confirmComplete(uint256 taskId) external',
    'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt, uint256 echoPostFee, address rewardAsset, uint256 rewardAmount)'
  ];

  try {
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    const contract = new ethers.Contract(TASK_ESCROW_ADDRESS, ABI, provider);

    console.log('📋 基本信息:');
    console.log('   - 合约地址:', TASK_ESCROW_ADDRESS);
    console.log('   - 调用者:', CALLER_ADDRESS);
    console.log('   - 任务ID:', TASK_ID);

    // 1. 先检查任务状态
    console.log('\n🔍 检查任务状态:');
    const taskData = await contract.tasks(TASK_ID);
    console.log('   - 创建者:', taskData.creator);
    console.log('   - 状态:', Number(taskData.status));
    console.log('   - 权限正确:', taskData.creator.toLowerCase() === CALLER_ADDRESS.toLowerCase());

    // 2. 尝试静态调用
    console.log('\n🧪 尝试静态调用:');
    try {
      const result = await contract.confirmComplete.staticCall(TASK_ID);
      console.log('   ✅ 静态调用成功:', result);
    } catch (staticError: any) {
      console.log('   ❌ 静态调用失败:', staticError.message);
      
      // 解析具体错误
      if (staticError.message.includes('Unauthorized')) {
        console.log('   💡 错误原因: 权限不足');
      } else if (staticError.message.includes('InvalidStatus')) {
        console.log('   💡 错误原因: 任务状态不正确');
      } else if (staticError.message.includes('transfer failed') || staticError.message.includes('payout failed')) {
        console.log('   💡 错误原因: 代币转账失败');
      } else {
        console.log('   💡 未知错误，需要进一步调试');
      }
    }

    // 3. 尝试估算 Gas
    console.log('\n⛽ 尝试估算 Gas:');
    try {
      const gasEstimate = await contract.confirmComplete.estimateGas(TASK_ID);
      console.log('   ✅ Gas 估算成功:', gasEstimate.toString());
    } catch (gasError: any) {
      console.log('   ❌ Gas 估算失败:', gasError.message);
      console.log('   🔍 这就是前端看到的错误！');
      
      // 这是关键信息
      if (gasError.message.includes('missing revert data')) {
        console.log('   💡 "missing revert data" 通常表示:');
        console.log('      - 合约调用在执行前就失败了');
        console.log('      - 可能是合约不存在或函数签名错误');
        console.log('      - 或者是网络/RPC 问题');
      }
    }

    // 4. 检查合约代码
    console.log('\n🔧 检查合约代码:');
    const code = await provider.getCode(TASK_ESCROW_ADDRESS);
    console.log('   - 合约代码长度:', code.length);
    console.log('   - 合约存在:', code !== '0x' ? '✅' : '❌');

    // 5. 检查网络状态
    console.log('\n🌐 检查网络状态:');
    const blockNumber = await provider.getBlockNumber();
    console.log('   - 当前区块:', blockNumber);
    const network = await provider.getNetwork();
    console.log('   - 网络ID:', network.chainId);

  } catch (error: any) {
    console.error('❌ 模拟失败:', error.message);
  }
}

simulateConfirmComplete().catch(console.error);