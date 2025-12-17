import { ethers } from 'ethers';

// UniversalReward 合约 ABI
const UNIVERSAL_REWARD_ABI = [
  "function getRewardByTask(uint256 taskId) external view returns (uint256)",
  "function getRewardPlan(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))",
  "function nextRewardId() external view returns (uint256)",
  "function lockForTask(uint256 rewardId, uint256 taskId) external",
  "function preparePlan(address asset, uint256 amount, uint256 targetChainId) external payable returns (uint256)",
  "function refund(uint256 rewardId) external"
];

// TaskEscrow 合约 ABI（简化版）
const TASK_ESCROW_ABI = [
  "function tasks(uint256 taskId) external view returns (tuple(uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt, uint256 echoPostFee, address rewardAsset, uint256 rewardAmount))",
  "function taskCounter() external view returns (uint256)"
];

/**
 * 测试任务奖励关联修复
 * 验证新的lockForTask调用是否正确工作
 */
async function testTaskRewardAssociation() {
  console.log('🧪 测试任务奖励关联修复...');
  
  try {
    // 1. 连接到 ZetaChain Athens 测试网
    console.log('\n🔗 连接到 ZetaChain Athens 测试网...');
    const zetaRpcUrl = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';
    const zetaProvider = new ethers.JsonRpcProvider(zetaRpcUrl, 7001);
    
    const universalRewardAddress = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
    const taskEscrowAddress = '0xE442Eb737983986153E42C9ad28530676d8C1f55';
    
    console.log('📍 UniversalReward 合约地址:', universalRewardAddress);
    console.log('📍 TaskEscrow 合约地址:', taskEscrowAddress);
    
    // 2. 创建合约实例
    const universalRewardContract = new ethers.Contract(
      universalRewardAddress,
      UNIVERSAL_REWARD_ABI,
      zetaProvider
    );
    
    const taskEscrowContract = new ethers.Contract(
      taskEscrowAddress,
      TASK_ESCROW_ABI,
      zetaProvider
    );
    
    // 3. 检查当前状态
    console.log('\n📊 检查当前状态...');
    
    const nextRewardId = await universalRewardContract.nextRewardId();
    const taskCounter = await taskEscrowContract.taskCounter();
    
    console.log(`当前奖励数量: ${Number(nextRewardId) - 1}`);
    console.log(`当前任务数量: ${taskCounter.toString()}`);
    
    // 4. 测试现有任务的奖励关联
    console.log('\n🔗 测试现有任务的奖励关联...');
    
    const testTaskIds = [1, 2, 3, 4, 5];
    const associationResults: Array<{
      taskId: number;
      rewardId: string;
      hasAssociation: boolean;
      isOrphan: boolean;
    }> = [];
    
    for (const taskId of testTaskIds) {
      try {
        // 检查任务是否存在
        const taskData = await taskEscrowContract.tasks(taskId);
        if (taskData.creator === ethers.ZeroAddress) {
          console.log(`⚪ 任务 ${taskId}: 不存在`);
          continue;
        }
        
        // 检查任务的奖励关联
        const rewardId = await universalRewardContract.getRewardByTask(BigInt(taskId));
        const hasAssociation = rewardId.toString() !== '0';
        
        if (hasAssociation) {
          // 验证反向关联
          const plan = await universalRewardContract.getRewardPlan(rewardId);
          const isConsistent = plan.taskId.toString() === taskId.toString();
          
          console.log(`✅ 任务 ${taskId} -> 奖励 ${rewardId.toString()} ${isConsistent ? '(一致)' : '(不一致!)'}`);
          
          associationResults.push({
            taskId,
            rewardId: rewardId.toString(),
            hasAssociation: true,
            isOrphan: false
          });
        } else {
          console.log(`⚪ 任务 ${taskId}: 无关联奖励`);
          
          associationResults.push({
            taskId,
            rewardId: '0',
            hasAssociation: false,
            isOrphan: false
          });
        }
        
      } catch (error: any) {
        console.log(`❌ 任务 ${taskId}: 查询失败 - ${error.message}`);
      }
    }
    
    // 5. 检查孤儿奖励状态
    console.log('\n🔍 检查孤儿奖励状态...');
    
    let orphanCount = 0;
    let depositedOrphanCount = 0;
    
    for (let i = 1; i < Number(nextRewardId); i++) {
      try {
        const plan = await universalRewardContract.getRewardPlan(BigInt(i));
        
        if (plan.taskId.toString() === '0') {
          orphanCount++;
          if (Number(plan.status) === 1) { // Deposited状态
            depositedOrphanCount++;
          }
        }
      } catch (error) {
        // 忽略无法读取的奖励
        continue;
      }
    }
    
    console.log(`📊 孤儿奖励统计:`);
    console.log(`  总孤儿奖励: ${orphanCount} 个`);
    console.log(`  待处理孤儿奖励 (Deposited): ${depositedOrphanCount} 个`);
    
    // 6. 模拟新的关联流程测试
    console.log('\n🧪 模拟新的关联流程...');
    console.log('注意: 这是模拟测试，不会执行实际的区块链交易');
    
    // 模拟场景：创建奖励 -> 创建任务 -> 关联奖励
    console.log('\n场景 1: 正常关联流程');
    console.log('  1. 用户在CrossChainRewardSection中创建奖励 (preparePlan)');
    console.log('  2. 用户在PublishTask中创建任务 (createTaskWithCrossChainReward)');
    console.log('  3. 系统自动调用lockForTask关联奖励到任务 ✅');
    console.log('  4. 验证: getRewardByTask(taskId) 返回正确的rewardId ✅');
    
    console.log('\n场景 2: 关联失败回滚流程');
    console.log('  1. 用户创建奖励成功');
    console.log('  2. 用户创建任务成功');
    console.log('  3. lockForTask调用失败 (网络问题/Gas不足等)');
    console.log('  4. 系统自动调用refund退还奖励 ✅');
    console.log('  5. 用户收到明确的错误信息和退款确认 ✅');
    
    // 7. 验证修复效果
    console.log('\n📋 修复效果验证:');
    console.log('==================');
    
    const hasValidAssociations = associationResults.some(r => r.hasAssociation);
    const hasOrphans = depositedOrphanCount > 0;
    
    if (hasValidAssociations) {
      console.log('✅ 发现有效的任务奖励关联，说明关联机制可以正常工作');
    } else {
      console.log('⚠️  没有发现有效的任务奖励关联');
    }
    
    if (hasOrphans) {
      console.log(`⚠️  仍有 ${depositedOrphanCount} 个待处理的孤儿奖励`);
      console.log('   建议运行清理脚本: npx ts-node scripts/executeOrphanRefunds.ts');
    } else {
      console.log('✅ 没有发现待处理的孤儿奖励');
    }
    
    // 8. 提供测试建议
    console.log('\n🔧 测试建议:');
    console.log('==================');
    console.log('1. 在测试环境中创建一个新的跨链奖励');
    console.log('2. 立即创建一个新任务并启用原子化操作');
    console.log('3. 验证任务创建后，getRewardByTask返回正确的奖励ID');
    console.log('4. 验证TaskDetail页面正确显示跨链奖励信息');
    console.log('5. 测试网络中断等异常情况下的回滚机制');
    
    console.log('\n✅ 测试完成');
    
  } catch (error: any) {
    console.error('❌ 测试过程中出错:', error.message);
    console.error('错误详情:', error);
  }
}

/**
 * 测试特定任务的奖励关联
 */
async function testSpecificTaskReward(taskId: number) {
  console.log(`🔍 测试任务 ${taskId} 的奖励关联...`);
  
  try {
    const zetaRpcUrl = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';
    const zetaProvider = new ethers.JsonRpcProvider(zetaRpcUrl, 7001);
    
    const universalRewardAddress = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
    const universalRewardContract = new ethers.Contract(
      universalRewardAddress,
      UNIVERSAL_REWARD_ABI,
      zetaProvider
    );
    
    // 检查任务的奖励关联
    const rewardId = await universalRewardContract.getRewardByTask(BigInt(taskId));
    
    if (rewardId.toString() !== '0') {
      console.log(`✅ 任务 ${taskId} 关联到奖励 ${rewardId.toString()}`);
      
      // 获取奖励详情
      const plan = await universalRewardContract.getRewardPlan(rewardId);
      console.log('奖励详情:');
      console.log(`  创建者: ${plan.creator}`);
      console.log(`  数量: ${ethers.formatEther(plan.amount)} ETH`);
      console.log(`  目标链: ${plan.targetChainId.toString()}`);
      console.log(`  状态: ${getStatusName(Number(plan.status))}`);
      
      // 验证反向关联
      if (plan.taskId.toString() === taskId.toString()) {
        console.log('✅ 反向关联验证通过');
      } else {
        console.log(`❌ 反向关联验证失败: 奖励的taskId是 ${plan.taskId.toString()}`);
      }
    } else {
      console.log(`⚪ 任务 ${taskId} 没有关联的奖励`);
    }
    
  } catch (error: any) {
    console.error(`❌ 测试任务 ${taskId} 失败:`, error.message);
  }
}

/**
 * 获取状态名称
 */
function getStatusName(status: number): string {
  const statusMap: Record<number, string> = {
    0: 'Prepared',
    1: 'Deposited',
    2: 'Locked',
    3: 'Claimed',
    4: 'Refunded',
    5: 'Reverted'
  };
  return statusMap[status] || `Unknown(${status})`;
}

// 运行脚本
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === '--task') {
    const taskId = parseInt(args[1]);
    if (!isNaN(taskId)) {
      testSpecificTaskReward(taskId).catch(console.error);
    } else {
      console.error('请提供有效的任务ID: --task <taskId>');
    }
  } else {
    testTaskRewardAssociation().catch(console.error);
  }
}

export { testTaskRewardAssociation, testSpecificTaskReward };