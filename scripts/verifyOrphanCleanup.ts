import { ethers } from 'ethers';

// UniversalReward 合约 ABI
const UNIVERSAL_REWARD_ABI = [
  "function getRewardPlan(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))",
  "function nextRewardId() external view returns (uint256)",
  "function getRewardByTask(uint256 taskId) external view returns (uint256)"
];

interface RewardSummary {
  rewardId: number;
  creator: string;
  taskId: string;
  amount: string;
  status: number;
  statusName: string;
}

/**
 * 验证孤儿奖励清理结果
 * 检查是否还有未处理的孤儿奖励
 */
async function verifyOrphanCleanup() {
  console.log('🔍 验证孤儿奖励清理结果...');
  
  try {
    // 1. 连接到 ZetaChain Athens 测试网
    console.log('\n🔗 连接到 ZetaChain Athens 测试网...');
    const zetaRpcUrl = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';
    const zetaProvider = new ethers.JsonRpcProvider(zetaRpcUrl, 7001);
    
    const universalRewardAddress = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
    console.log('📍 UniversalReward 合约地址:', universalRewardAddress);
    
    // 2. 创建合约实例
    const contract = new ethers.Contract(
      universalRewardAddress,
      UNIVERSAL_REWARD_ABI,
      zetaProvider
    );
    
    // 3. 获取所有奖励记录
    console.log('\n📊 分析所有奖励记录...');
    const analysis = await analyzeAllRewards(contract);
    
    // 4. 显示分析结果
    displayAnalysisResults(analysis);
    
    // 5. 验证特定任务的奖励关联
    console.log('\n🔗 验证任务奖励关联...');
    await verifyTaskRewardAssociations(contract);
    
    console.log('\n✅ 验证完成');
    
  } catch (error: any) {
    console.error('❌ 验证过程中出错:', error.message);
    console.error('错误详情:', error);
  }
}

/**
 * 分析所有奖励记录
 */
async function analyzeAllRewards(contract: ethers.Contract) {
  const nextRewardId = await contract.nextRewardId();
  const totalRewards = Number(nextRewardId) - 1;
  
  console.log(`📊 总奖励数量: ${totalRewards}`);
  
  const rewards: RewardSummary[] = [];
  const statusCounts: Record<number, number> = {};
  const orphanRewards: RewardSummary[] = [];
  const validRewards: RewardSummary[] = [];
  
  for (let i = 1; i <= totalRewards; i++) {
    try {
      const plan = await contract.getRewardPlan(BigInt(i));
      
      const reward: RewardSummary = {
        rewardId: i,
        creator: plan.creator,
        taskId: plan.taskId.toString(),
        amount: ethers.formatEther(plan.amount),
        status: Number(plan.status),
        statusName: getStatusName(Number(plan.status))
      };
      
      rewards.push(reward);
      
      // 统计状态
      statusCounts[reward.status] = (statusCounts[reward.status] || 0) + 1;
      
      // 分类奖励
      if (reward.taskId === '0') {
        orphanRewards.push(reward);
      } else {
        validRewards.push(reward);
      }
      
      // 进度显示
      if (i % 10 === 0) {
        console.log(`  已分析 ${i}/${totalRewards} 个奖励...`);
      }
      
    } catch (error: any) {
      console.warn(`⚠️ 无法读取奖励 ${i}:`, error.message);
    }
  }
  
  return {
    totalRewards,
    rewards,
    statusCounts,
    orphanRewards,
    validRewards
  };
}

/**
 * 显示分析结果
 */
function displayAnalysisResults(analysis: any) {
  console.log('\n📊 奖励状态统计:');
  console.log('==================');
  
  const statusNames: Record<number, string> = {
    0: 'Prepared',
    1: 'Deposited',
    2: 'Locked',
    3: 'Claimed',
    4: 'Refunded',
    5: 'Reverted'
  };
  
  for (const [status, count] of Object.entries(analysis.statusCounts)) {
    const statusNum = parseInt(status);
    const statusName = statusNames[statusNum] || `Unknown(${statusNum})`;
    console.log(`${statusName}: ${count} 个`);
  }
  
  console.log('\n🎯 奖励分类:');
  console.log('==================');
  console.log(`✅ 有效奖励 (taskId > 0): ${analysis.validRewards.length} 个`);
  console.log(`⚠️  孤儿奖励 (taskId = 0): ${analysis.orphanRewards.length} 个`);
  
  if (analysis.orphanRewards.length > 0) {
    console.log('\n⚠️  剩余孤儿奖励详情:');
    console.log('==================');
    
    const groupedOrphans = groupRewardsByCreator(analysis.orphanRewards);
    for (const [creator, rewards] of Object.entries(groupedOrphans)) {
      console.log(`\n👤 创建者 ${creator}:`);
      rewards.forEach((reward: RewardSummary) => {
        console.log(`  - 奖励 ${reward.rewardId}: ${reward.amount} ETH (${reward.statusName})`);
      });
    }
    
    // 按状态分析孤儿奖励
    const orphansByStatus = analysis.orphanRewards.reduce((acc: any, reward: RewardSummary) => {
      acc[reward.status] = (acc[reward.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 孤儿奖励状态分布:');
    for (const [status, count] of Object.entries(orphansByStatus)) {
      const statusNum = parseInt(status);
      const statusName = statusNames[statusNum] || `Unknown(${statusNum})`;
      console.log(`  ${statusName}: ${count} 个`);
    }
    
    // 如果还有Deposited状态的孤儿奖励，说明清理不完整
    if (orphansByStatus[1] > 0) {
      console.log('\n❌ 清理不完整！');
      console.log(`还有 ${orphansByStatus[1]} 个处于 Deposited 状态的孤儿奖励需要处理`);
    } else {
      console.log('\n✅ 所有孤儿奖励都已处理（非Deposited状态）');
    }
  } else {
    console.log('\n✅ 没有发现孤儿奖励，清理完成！');
  }
  
  // 显示有效奖励的统计
  if (analysis.validRewards.length > 0) {
    console.log('\n✅ 有效奖励统计:');
    console.log('==================');
    
    const validByStatus = analysis.validRewards.reduce((acc: any, reward: RewardSummary) => {
      acc[reward.status] = (acc[reward.status] || 0) + 1;
      return acc;
    }, {});
    
    for (const [status, count] of Object.entries(validByStatus)) {
      const statusNum = parseInt(status);
      const statusName = statusNames[statusNum] || `Unknown(${statusNum})`;
      console.log(`  ${statusName}: ${count} 个`);
    }
  }
}

/**
 * 验证任务奖励关联
 */
async function verifyTaskRewardAssociations(contract: ethers.Contract) {
  // 测试一些已知的任务ID
  const testTaskIds = [1, 2, 3, 4, 5];
  
  console.log('🔗 检查任务奖励关联:');
  
  for (const taskId of testTaskIds) {
    try {
      const rewardId = await contract.getRewardByTask(BigInt(taskId));
      
      if (rewardId.toString() !== '0') {
        console.log(`✅ 任务 ${taskId} -> 奖励 ${rewardId.toString()}`);
        
        // 验证反向关联
        try {
          const plan = await contract.getRewardPlan(rewardId);
          if (plan.taskId.toString() === taskId.toString()) {
            console.log(`  ✅ 反向验证通过`);
          } else {
            console.log(`  ❌ 反向验证失败: 奖励 ${rewardId.toString()} 的 taskId 是 ${plan.taskId.toString()}`);
          }
        } catch (error) {
          console.log(`  ⚠️ 无法验证奖励 ${rewardId.toString()}`);
        }
      } else {
        console.log(`⚪ 任务 ${taskId} -> 无奖励`);
      }
    } catch (error: any) {
      console.log(`❌ 任务 ${taskId} -> 查询失败: ${error.message}`);
    }
  }
}

/**
 * 按创建者分组
 */
function groupRewardsByCreator(rewards: RewardSummary[]): Record<string, RewardSummary[]> {
  return rewards.reduce((groups, reward) => {
    const creator = reward.creator;
    if (!groups[creator]) {
      groups[creator] = [];
    }
    groups[creator].push(reward);
    return groups;
  }, {} as Record<string, RewardSummary[]>);
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
  verifyOrphanCleanup().catch(console.error);
}

export { verifyOrphanCleanup, analyzeAllRewards };