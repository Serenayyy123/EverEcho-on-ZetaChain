import { ethers } from 'ethers';

// UniversalReward 合约 ABI
const UNIVERSAL_REWARD_ABI = [
  "function getRewardByTask(uint256 taskId) external view returns (uint256)",
  "function getRewardPlan(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))",
  "function nextRewardId() external view returns (uint256)",
  "function refund(uint256 rewardId) external",
  "function emergencyWithdraw() external",
  "event RewardRefunded(uint256 indexed rewardId, address indexed creator)"
];

async function revertOrphanRewards() {
  console.log('🔍 检查孤儿奖励记录状态...');
  
  try {
    // 1. 连接到 ZetaChain Athens 测试网
    console.log('\n🔗 连接到 ZetaChain Athens 测试网...');
    
    const zetaRpcUrl = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';
    const provider = new ethers.JsonRpcProvider(zetaRpcUrl, 7001);
    
    // 只读模式，不需要私钥
    console.log('📍 只读模式检查');
    
    // 合约地址
    const universalRewardAddress = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
    console.log('📍 UniversalReward 合约地址:', universalRewardAddress);
    
    // 2. 创建合约实例（只读）
    const contract = new ethers.Contract(
      universalRewardAddress,
      UNIVERSAL_REWARD_ABI,
      provider
    );
    
    // 3. 获取所有奖励记录
    console.log('\n📋 检查所有奖励记录...');
    const nextRewardId = await contract.nextRewardId();
    console.log('总奖励数量:', Number(nextRewardId) - 1);
    
    const orphanRewards: Array<{
      rewardId: number;
      creator: string;
      taskId: string;
      asset: string;
      amount: string;
      status: number;
    }> = [];
    
    // 4. 识别孤儿奖励（taskId = 0 的奖励）
    for (let i = 1; i < Number(nextRewardId); i++) {
      try {
        const plan = await contract.getRewardPlan(BigInt(i));
        
        if (plan.taskId.toString() === '0') {
          orphanRewards.push({
            rewardId: i,
            creator: plan.creator,
            taskId: plan.taskId.toString(),
            asset: plan.asset,
            amount: ethers.formatEther(plan.amount),
            status: Number(plan.status)
          });
          
          console.log(`🔍 发现孤儿奖励 ${i}:`, {
            creator: plan.creator,
            amount: ethers.formatEther(plan.amount),
            status: Number(plan.status)
          });
        }
      } catch (error: any) {
        console.log(`❌ 查询奖励 ${i} 失败:`, error.message);
      }
    }
    
    console.log(`\n📊 统计结果:`);
    console.log(`- 总奖励数量: ${Number(nextRewardId) - 1}`);
    console.log(`- 孤儿奖励数量: ${orphanRewards.length}`);
    
    if (orphanRewards.length === 0) {
      console.log('✅ 没有发现孤儿奖励，无需处理');
      return;
    }
    
    // 5. 按状态分组
    const statusMap: Record<number, string> = {
      0: 'Prepared (已准备)',
      1: 'Deposited (已存入)',
      2: 'Locked (已锁定)',
      3: 'Claimed (已领取)',
      4: 'Refunded (已退款)',
      5: 'Reverted (已回滚)'
    };
    
    const groupedByStatus = orphanRewards.reduce((acc, reward) => {
      const status = reward.status;
      if (!acc[status]) acc[status] = [];
      acc[status].push(reward);
      return acc;
    }, {} as Record<number, typeof orphanRewards>);
    
    console.log('\n📈 按状态分组:');
    Object.entries(groupedByStatus).forEach(([status, rewards]) => {
      console.log(`- ${statusMap[Number(status)]}: ${rewards.length} 个`);
    });
    
    // 6. 只处理可以 refund 的奖励（状态 2: Locked）
    const refundableRewards = orphanRewards.filter(reward => reward.status === 2);
    
    if (refundableRewards.length === 0) {
      console.log('\n⚠️ 没有可以 refund 的奖励（只有 Locked 状态的奖励可以 refund）');
      console.log('当前孤儿奖励状态分布:');
      Object.entries(groupedByStatus).forEach(([status, rewards]) => {
        console.log(`- ${statusMap[Number(status)]}: ${rewards.length} 个`);
      });
      return;
    }
    
    console.log(`\n🔄 准备 refund ${refundableRewards.length} 个孤儿奖励...`);
    
    // 7. 确认操作
    console.log('\n⚠️ 警告: 这将 refund 以下奖励:');
    refundableRewards.forEach(reward => {
      console.log(`- 奖励 ${reward.rewardId}: ${reward.amount} ETH (创建者: ${reward.creator})`);
    });
    
    // 在生产环境中，这里应该有用户确认步骤
    // 为了安全，我们先只处理前 5 个
    const batchSize = Math.min(5, refundableRewards.length);
    const batchRewards = refundableRewards.slice(0, batchSize);
    
    console.log(`\n📋 分析结果:`);
    console.log(`- 可以 refund 的奖励: ${refundableRewards.length} 个`);
    
    if (refundableRewards.length > 0) {
      console.log('\n🔍 可 refund 的奖励详情:');
      refundableRewards.forEach(reward => {
        console.log(`- 奖励 ${reward.rewardId}: ${reward.amount} ETH (创建者: ${reward.creator})`);
      });
      
      console.log('\n💡 要执行 refund 操作，请:');
      console.log('1. 设置 PRIVATE_KEY 环境变量');
      console.log('2. 确保私钥对应的账户是这些奖励的创建者');
      console.log('3. 修改脚本启用实际的 refund 操作');
    }
    
    // 显示其他状态的奖励
    const otherStatusRewards = orphanRewards.filter(reward => reward.status !== 2);
    if (otherStatusRewards.length > 0) {
      console.log('\n⚠️ 其他状态的孤儿奖励（无法 refund）:');
      const otherGrouped = otherStatusRewards.reduce((acc, reward) => {
        const status = reward.status;
        if (!acc[status]) acc[status] = [];
        acc[status].push(reward);
        return acc;
      }, {} as Record<number, typeof otherStatusRewards>);
      
      Object.entries(otherGrouped).forEach(([status, rewards]) => {
        console.log(`\n${statusMap[Number(status)]} (${rewards.length} 个):`);
        rewards.slice(0, 3).forEach(reward => {
          console.log(`  - 奖励 ${reward.rewardId}: ${reward.amount} ETH (创建者: ${reward.creator})`);
        });
        if (rewards.length > 3) {
          console.log(`  ... 还有 ${rewards.length - 3} 个`);
        }
      });
    }
    
  } catch (error: any) {
    console.error('❌ 操作失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行脚本
revertOrphanRewards().catch(console.error);