/**
 * 检查任务3的状态和权限
 * 快速诊断 confirmComplete 失败的原因
 */

import { ethers } from 'ethers';

async function checkTask3Status() {
  console.log('🔍 检查任务3状态...\n');

  const CONTRACT_ADDRESS = '0xE442Eb737983986153E42C9ad28530676d8C1f55';
  const TASK_ID = 3;
  const CALLER_ADDRESS = '0xD68a76259d4100A2622D643d5e62F5F92C28C4fe';

  // 正确的 tasks 函数 ABI
  const ABI = [
    'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt, uint256 echoPostFee, address rewardAsset, uint256 rewardAmount)'
  ];

  try {
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    console.log('📋 任务信息:');
    const taskData = await contract.tasks(TASK_ID);
    
    console.log('   - 任务ID:', Number(taskData.taskId));
    console.log('   - 创建者:', taskData.creator);
    console.log('   - Helper:', taskData.helper);
    console.log('   - 奖励:', ethers.formatEther(taskData.reward), 'ECHO');
    console.log('   - 状态码:', Number(taskData.status));
    console.log('   - 状态名:', getStatusName(Number(taskData.status)));
    console.log('   - 任务URI:', taskData.taskURI);
    console.log('   - 创建时间:', new Date(Number(taskData.createdAt) * 1000).toLocaleString());
    
    if (taskData.acceptedAt > 0) {
      console.log('   - 接受时间:', new Date(Number(taskData.acceptedAt) * 1000).toLocaleString());
    }
    if (taskData.submittedAt > 0) {
      console.log('   - 提交时间:', new Date(Number(taskData.submittedAt) * 1000).toLocaleString());
    }

    console.log('\n🔐 权限检查:');
    console.log('   - 调用者:', CALLER_ADDRESS);
    console.log('   - 是创建者:', taskData.creator.toLowerCase() === CALLER_ADDRESS.toLowerCase() ? '✅' : '❌');

    console.log('\n📊 状态检查:');
    const currentStatus = Number(taskData.status);
    console.log('   - 当前状态:', currentStatus);
    console.log('   - 需要状态: 2 (Submitted)');
    console.log('   - 可以确认完成:', currentStatus === 2 ? '✅' : '❌');

    // 诊断结果
    console.log('\n🎯 诊断结果:');
    if (taskData.creator === ethers.ZeroAddress) {
      console.log('❌ 任务不存在');
    } else if (taskData.creator.toLowerCase() !== CALLER_ADDRESS.toLowerCase()) {
      console.log('❌ 权限不足：只有任务创建者可以确认完成');
      console.log(`   创建者: ${taskData.creator}`);
      console.log(`   调用者: ${CALLER_ADDRESS}`);
    } else if (currentStatus !== 2) {
      console.log('❌ 状态错误：任务必须处于 "Submitted" 状态才能确认完成');
      console.log(`   当前状态: ${getStatusName(currentStatus)} (${currentStatus})`);
      console.log('   需要状态: Submitted (2)');
    } else {
      console.log('✅ 权限和状态都正确，可能是其他问题');
    }

  } catch (error: any) {
    console.error('❌ 检查失败:', error.message);
  }
}

function getStatusName(status: number): string {
  const statusNames = ['Open', 'InProgress', 'Submitted', 'Completed', 'Disputed'];
  return statusNames[status] || `Unknown(${status})`;
}

checkTask3Status().catch(console.error);