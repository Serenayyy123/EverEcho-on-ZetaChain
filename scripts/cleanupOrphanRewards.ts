import { ethers } from 'ethers';

// UniversalReward 合约 ABI
const UNIVERSAL_REWARD_ABI = [
  "function getRewardPlan(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))",
  "function nextRewardId() external view returns (uint256)",
  "function refund(uint256 rewardId) external",
  "event RewardRefunded(uint256 indexed rewardId, address indexed creator)"
];

interface OrphanReward {
  rewardId: number;
  creator: string;
  asset: string;
  amount: string;
  targetChainId: string;
  status: number;
  createdAt: number;
}

interface RefundResult {
  rewardId: number;
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: string;
}

/**
 * 孤儿奖励清理脚本
 * 检测并退还所有taskId=0的奖励记录
 */
async function cleanupOrphanRewards() {
  console.log('🧹 开始清理孤儿奖励...');
  
  try {
    // 1. 连接到 ZetaChain Athens 测试网
    console.log('\n🔗 连接到 ZetaChain Athens 测试网...');
    const zetaRpcUrl = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';
    const zetaProvider = new ethers.JsonRpcProvider(zetaRpcUrl, 7001);
    
    // 合约地址
    const universalRewardAddress = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
    console.log('📍 UniversalReward 合约地址:', universalRewardAddress);
    
    // 2. 创建只读合约实例进行检测
    const readOnlyContract = new ethers.Contract(
      universalRewardAddress,
      UNIVERSAL_REWARD_ABI,
      zetaProvider
    );
    
    // 3. 检测所有孤儿奖励
    console.log('\n🔍 检测孤儿奖励...');
    const orphanRewards = await detectOrphanRewards(readOnlyContract);
    
    if (orphanRewards.length === 0) {
      console.log('✅ 没有发现孤儿奖励');
      return;
    }
    
    console.log(`\n📊 发现 ${orphanRewards.length} 个孤儿奖励:`);
    
    // 按创建者分组显示
    const groupedByCreator = groupRewardsByCreator(orphanRewards);
    for (const [creator, rewards] of Object.entries(groupedByCreator)) {
      console.log(`\n👤 创建者 ${creator}:`);
      rewards.forEach(reward => {
        console.log(`  - 奖励 ${reward.rewardId}: ${reward.amount} ETH (${getStatusName(reward.status)})`);
      });
    }
    
    // 4. 确认是否执行退款
    console.log('\n⚠️  警告: 即将执行批量退款操作');
    console.log('这将把所有孤儿奖励的资金返还给原创建者');
    console.log('请确保您有足够的私钥访问权限来执行退款操作');
    
    // 注意: 在实际执行中，这里需要用户确认
    // 为了演示，我们先只显示检测结果
    console.log('\n📋 检测完成。要执行实际退款，请使用 --execute 参数');
    
    // 5. 如果指定了执行参数，则进行实际退款
    if (process.argv.includes('--execute')) {
      await executeRefunds(orphanRewards, universalRewardAddress, zetaProvider);
    }
    
  } catch (error: any) {
    console.error('❌ 清理过程中出错:', error.message);
    console.error('错误详情:', error);
  }
}

/**
 * 检测所有孤儿奖励
 */
async function detectOrphanRewards(contract: ethers.Contract): Promise<OrphanReward[]> {
  const orphanRewards: OrphanReward[] = [];
  
  try {
    const nextRewardId = await contract.nextRewardId();
    const totalRewards = Number(nextRewardId) - 1;
    
    console.log(`📊 扫描 ${totalRewards} 个奖励记录...`);
    
    for (let i = 1; i <= totalRewards; i++) {
      try {
        const plan = await contract.getRewardPlan(BigInt(i));
        
        // 检查是否为孤儿奖励 (taskId = 0)
        if (plan.taskId.toString() === '0') {
          orphanRewards.push({
            rewardId: i,
            creator: plan.creator,
            asset: plan.asset,
            amount: ethers.formatEther(plan.amount),
            targetChainId: plan.targetChainId.toString(),
            status: Number(plan.status),
            createdAt: Number(plan.createdAt)
          });
        }
        
        // 进度显示
        if (i % 10 === 0) {
          console.log(`  已扫描 ${i}/${totalRewards} 个奖励...`);
        }
        
      } catch (error: any) {
        console.warn(`⚠️ 无法读取奖励 ${i}:`, error.message);
        continue;
      }
    }
    
    console.log(`✅ 扫描完成，发现 ${orphanRewards.length} 个孤儿奖励`);
    return orphanRewards;
    
  } catch (error: any) {
    console.error('❌ 检测过程失败:', error.message);
    throw error;
  }
}

/**
 * 按创建者分组奖励
 */
function groupRewardsByCreator(rewards: OrphanReward[]): Record<string, OrphanReward[]> {
  return rewards.reduce((groups, reward) => {
    const creator = reward.creator;
    if (!groups[creator]) {
      groups[creator] = [];
    }
    groups[creator].push(reward);
    return groups;
  }, {} as Record<string, OrphanReward[]>);
}

/**
 * 执行批量退款
 */
async function executeRefunds(
  orphanRewards: OrphanReward[], 
  contractAddress: string, 
  provider: ethers.JsonRpcProvider
): Promise<void> {
  console.log('\n💰 开始执行批量退款...');
  
  // 按创建者分组处理
  const groupedRewards = groupRewardsByCreator(orphanRewards);
  const results: RefundResult[] = [];
  
  for (const [creator, rewards] of Object.entries(groupedRewards)) {
    console.log(`\n👤 处理创建者 ${creator} 的 ${rewards.length} 个奖励...`);
    
    // 注意: 在实际实现中，这里需要获取创建者的私钥
    // 为了安全，应该通过环境变量或安全的密钥管理系统获取
    console.log('⚠️  需要创建者的私钥来执行退款操作');
    console.log('请确保您有权限代表此创建者执行退款');
    
    // 模拟退款过程（实际实现中需要真实的私钥）
    for (const reward of rewards) {
      try {
        // 这里应该使用创建者的私钥创建signer
        // const signer = new ethers.Wallet(creatorPrivateKey, provider);
        // const contract = new ethers.Contract(contractAddress, UNIVERSAL_REWARD_ABI, signer);
        // const tx = await contract.refund(reward.rewardId);
        // const receipt = await tx.wait();
        
        console.log(`  ✅ 奖励 ${reward.rewardId} 退款成功 (模拟)`);
        
        results.push({
          rewardId: reward.rewardId,
          success: true,
          txHash: '0x' + '0'.repeat(64), // 模拟交易哈希
          gasUsed: '21000'
        });
        
      } catch (error: any) {
        console.error(`  ❌ 奖励 ${reward.rewardId} 退款失败:`, error.message);
        
        results.push({
          rewardId: reward.rewardId,
          success: false,
          error: error.message
        });
      }
    }
  }
  
  // 显示退款结果摘要
  console.log('\n📊 退款结果摘要:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ 成功: ${successful} 个`);
  console.log(`❌ 失败: ${failed} 个`);
  
  if (failed > 0) {
    console.log('\n❌ 失败的退款:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`  - 奖励 ${result.rewardId}: ${result.error}`);
    });
  }
  
  console.log('\n✅ 批量退款操作完成');
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

/**
 * 主函数
 */
if (require.main === module) {
  cleanupOrphanRewards().catch(console.error);
}

export { cleanupOrphanRewards, detectOrphanRewards, groupRewardsByCreator };