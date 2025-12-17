import { ethers } from 'ethers';

// UniversalReward 合约 ABI
const UNIVERSAL_REWARD_ABI = [
  "function getRewardPlan(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))",
  "function nextRewardId() external view returns (uint256)",
  "function creatorRewards(address creator, uint256 index) external view returns (uint256)"
];

async function checkUserCrossChainHistory() {
  console.log('🔍 检查用户的跨链奖励历史...');
  
  try {
    // 1. 连接到 ZetaChain Athens 测试网
    console.log('\n🔗 连接到 ZetaChain Athens 测试网...');
    const zetaRpcUrl = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';
    const zetaProvider = new ethers.JsonRpcProvider(zetaRpcUrl, 7001);
    
    // 合约地址
    const universalRewardAddress = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
    console.log('📍 UniversalReward 合约地址:', universalRewardAddress);
    
    // 2. 创建合约实例
    const contract = new ethers.Contract(
      universalRewardAddress,
      UNIVERSAL_REWARD_ABI,
      zetaProvider
    );
    
    // 3. 获取所有奖励记录并按创建者分组
    console.log('\n📋 分析所有奖励记录...');
    const nextRewardId = await contract.nextRewardId();
    console.log('总奖励数量:', Number(nextRewardId) - 1);
    
    const rewardsByCreator: Record<string, any[]> = {};
    const rewardsByTaskId: Record<string, any[]> = {};
    
    for (let i = 1; i < Number(nextRewardId); i++) {
      try {
        const plan = await contract.getRewardPlan(BigInt(i));
        
        const reward = {
          rewardId: i,
          creator: plan.creator,
          taskId: plan.taskId.toString(),
          asset: plan.asset,
          amount: ethers.formatEther(plan.amount),
          targetChainId: plan.targetChainId.toString(),
          status: Number(plan.status),
          createdAt: new Date(Number(plan.createdAt) * 1000).toISOString(),
          lastTxHash: plan.lastTxHash
        };
        
        // 按创建者分组
        if (!rewardsByCreator[reward.creator]) {
          rewardsByCreator[reward.creator] = [];
        }
        rewardsByCreator[reward.creator].push(reward);
        
        // 按任务ID分组
        if (!rewardsByTaskId[reward.taskId]) {
          rewardsByTaskId[reward.taskId] = [];
        }
        rewardsByTaskId[reward.taskId].push(reward);
        
      } catch (error: any) {
        console.log(`❌ 查询奖励 ${i} 失败:`, error.message);
      }
    }
    
    // 4. 显示按创建者分组的结果
    console.log('\n👥 按创建者分组的奖励:');
    Object.entries(rewardsByCreator).forEach(([creator, rewards]) => {
      console.log(`\n创建者: ${creator} (${rewards.length} 个奖励)`);
      rewards.forEach(reward => {
        console.log(`  奖励 ${reward.rewardId}: ${reward.amount} ETH -> 任务 ${reward.taskId} (状态: ${getStatusName(reward.status)})`);
      });
    });
    
    // 5. 显示按任务ID分组的结果
    console.log('\n📋 按任务ID分组的奖励:');
    Object.entries(rewardsByTaskId).forEach(([taskId, rewards]) => {
      if (taskId !== '0') { // 忽略孤儿奖励
        console.log(`\n任务 ${taskId}: ${rewards.length} 个奖励`);
        rewards.forEach(reward => {
          console.log(`  奖励 ${reward.rewardId}: ${reward.amount} ETH (创建者: ${reward.creator.slice(0, 10)}...)`);
        });
      }
    });
    
    // 6. 特别检查是否有最近创建的奖励
    console.log('\n⏰ 最近创建的奖励 (按时间排序):');
    const allRewards = Object.values(rewardsByCreator).flat();
    const sortedRewards = allRewards.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    sortedRewards.slice(0, 5).forEach(reward => {
      console.log(`  奖励 ${reward.rewardId}: ${reward.createdAt} -> 任务 ${reward.taskId} (${reward.amount} ETH)`);
    });
    
    // 7. 检查是否有任何奖励尝试关联到任务2
    console.log('\n🔍 检查是否有奖励尝试关联到任务2:');
    const task2Rewards = rewardsByTaskId['2'] || [];
    if (task2Rewards.length > 0) {
      console.log(`✅ 找到 ${task2Rewards.length} 个关联到任务2的奖励:`);
      task2Rewards.forEach(reward => {
        console.log(`  奖励 ${reward.rewardId}: ${reward.amount} ETH (状态: ${getStatusName(reward.status)})`);
      });
    } else {
      console.log('❌ 没有找到任何关联到任务2的奖励');
    }
    
    // 8. 提供调试建议
    console.log('\n💡 调试建议:');
    console.log('1. 检查你创建跨链奖励时使用的账户地址');
    console.log('2. 确认操作时连接的是 ZetaChain Athens 测试网');
    console.log('3. 检查浏览器控制台是否有错误信息');
    console.log('4. 确认任务创建和跨链奖励创建是否在同一个事务中完成');
    console.log('5. 检查 MetaMask 的交易历史，确认跨链奖励交易是否真的成功');
    
  } catch (error: any) {
    console.error('❌ 检查过程中出错:', error.message);
    console.error('错误详情:', error);
  }
}

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

// 运行检查
checkUserCrossChainHistory().catch(console.error);