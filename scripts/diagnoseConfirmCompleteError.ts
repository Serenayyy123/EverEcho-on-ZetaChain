/**
 * 诊断 Confirm Complete 错误脚本
 * 分析 "missing revert data" 错误的原因
 */

import { ethers } from 'ethers';

// 直接定义合约地址和 ABI
const CONTRACT_ADDRESSES = {
  taskEscrow: '0xE442Eb737983986153E42C9ad28530676d8C1f55',
  echoToken: '0xE0e8CD2F3a8bd6241B09798DEe98f1c777537b4D'
};

// 简化的 TaskEscrow ABI - 只包含需要的函数
const TASK_ESCROW_ABI = [
  'function tasks(uint256) view returns (address creator, address helper, uint256 reward, uint8 status, string memory title, string memory description)',
  'function confirmComplete(uint256 taskId) external'
];

async function diagnoseConfirmCompleteError() {
  console.log('🔍 诊断 Confirm Complete 错误...\n');

  // 错误信息中的详细信息
  const errorDetails = {
    contractAddress: '0xE442Eb737983986153E42C9ad28530676d8C1f55',
    taskId: 3,
    fromAddress: '0xD68a76259d4100A2622D643d5e62F5F92C28C4fe',
    functionData: '0xf17489b60000000000000000000000000000000000000000000000000000000000000003'
  };

  console.log('📋 错误详情:');
  console.log('   - 合约地址:', errorDetails.contractAddress);
  console.log('   - 任务ID:', errorDetails.taskId);
  console.log('   - 调用者:', errorDetails.fromAddress);
  console.log('   - 函数数据:', errorDetails.functionData);

  // 1. 验证合约地址配置
  console.log('\n🔧 验证合约地址配置:');
  console.log('   - 配置中的 TaskEscrow 地址:', CONTRACT_ADDRESSES.taskEscrow);
  console.log('   - 错误中的合约地址:', errorDetails.contractAddress);
  console.log('   - 地址匹配:', CONTRACT_ADDRESSES.taskEscrow.toLowerCase() === errorDetails.contractAddress.toLowerCase() ? '✅' : '❌');

  // 2. 连接到 ZetaChain 并检查合约状态
  console.log('\n🌐 连接 ZetaChain 检查合约状态:');
  try {
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    
    // 检查合约是否存在
    const code = await provider.getCode(errorDetails.contractAddress);
    console.log('   - 合约代码长度:', code.length);
    console.log('   - 合约存在:', code !== '0x' ? '✅' : '❌');

    if (code === '0x') {
      console.log('   ❌ 合约不存在或地址错误！');
      return;
    }

    // 创建合约实例
    const contract = new ethers.Contract(errorDetails.contractAddress, TASK_ESCROW_ABI, provider);

    // 3. 检查任务状态
    console.log('\n📋 检查任务状态:');
    try {
      const taskData = await contract.tasks(errorDetails.taskId);
      console.log('   - 任务存在:', taskData.creator !== ethers.ZeroAddress ? '✅' : '❌');
      
      if (taskData.creator !== ethers.ZeroAddress) {
        console.log('   - 创建者:', taskData.creator);
        console.log('   - Helper:', taskData.helper);
        console.log('   - 奖励:', ethers.formatEther(taskData.reward), 'ECHO');
        console.log('   - 状态:', getStatusName(Number(taskData.status)));
        console.log('   - 当前状态码:', Number(taskData.status));
        
        // 检查是否可以调用 confirmComplete
        const currentStatus = Number(taskData.status);
        const canConfirmComplete = currentStatus === 2; // Submitted = 2
        console.log('   - 可以确认完成:', canConfirmComplete ? '✅' : '❌');
        
        if (!canConfirmComplete) {
          console.log('   ⚠️ 任务状态不允许确认完成');
          console.log('   💡 只有状态为 "Submitted" (2) 的任务才能确认完成');
        }

        // 检查调用者权限
        const isCreator = taskData.creator.toLowerCase() === errorDetails.fromAddress.toLowerCase();
        console.log('   - 调用者是创建者:', isCreator ? '✅' : '❌');
        
        if (!isCreator) {
          console.log('   ⚠️ 只有任务创建者才能确认完成');
        }
      }
    } catch (taskError) {
      console.error('   ❌ 获取任务数据失败:', taskError);
    }

    // 4. 模拟合约调用
    console.log('\n🧪 模拟合约调用:');
    try {
      // 解码函数调用数据
      const iface = new ethers.Interface(TASK_ESCROW_ABI);
      const decoded = iface.parseTransaction({ data: errorDetails.functionData });
      console.log('   - 调用函数:', decoded?.name);
      console.log('   - 参数:', decoded?.args);

      // 尝试静态调用
      const result = await contract.confirmComplete.staticCall(errorDetails.taskId);
      console.log('   - 静态调用结果:', result);
    } catch (simulateError: any) {
      console.error('   ❌ 模拟调用失败:', simulateError.message);
      
      // 分析错误类型
      if (simulateError.message.includes('InvalidTaskStatus')) {
        console.log('   💡 错误原因: 任务状态不正确');
      } else if (simulateError.message.includes('OnlyCreator')) {
        console.log('   💡 错误原因: 只有创建者可以确认完成');
      } else if (simulateError.message.includes('TaskNotFound')) {
        console.log('   💡 错误原因: 任务不存在');
      } else {
        console.log('   💡 可能的错误原因: 合约逻辑错误或网络问题');
      }
    }

  } catch (networkError) {
    console.error('   ❌ 网络连接失败:', networkError);
  }

  // 5. 提供解决方案
  console.log('\n💡 解决方案建议:');
  console.log('1. 检查任务状态是否为 "Submitted"');
  console.log('2. 确认调用者是任务创建者');
  console.log('3. 检查网络连接和 RPC 端点');
  console.log('4. 尝试刷新页面重新加载任务数据');
  console.log('5. 如果问题持续，可能需要检查合约部署状态');
}

function getStatusName(status: number): string {
  const statusNames = ['Open', 'InProgress', 'Submitted', 'Completed', 'Disputed'];
  return statusNames[status] || `Unknown(${status})`;
}

// 执行诊断
diagnoseConfirmCompleteError().catch(console.error);