#!/usr/bin/env npx tsx

/**
 * 诊断当前的孤儿奖励问题
 * 扫描UniversalReward合约中的所有奖励，识别孤儿奖励
 */

import { ethers } from 'ethers';
import { config } from 'dotenv';

// 加载环境变量
config();

// 合约地址配置
const CONTRACTS = {
  UNIVERSAL_REWARD: process.env.VITE_UNIVERSAL_REWARD_ADDRESS || '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3',
  TASK_ESCROW: process.env.VITE_TASK_ESCROW_ADDRESS || '0xE442Eb737983986153E42C9ad28530676d8C1f55'
};

// UniversalReward ABI
const UNIVERSAL_REWARD_ABI = [
  'function nextRewardId() external view returns (uint256)',
  'function rewardPlans(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))',
  'function getRewardsByCreator(address creator) external view returns (uint256[])',
  'function getRewardByTask(uint256 taskId) external view returns (uint256)'
];

// TaskEscrow ABI
const TASK_ESCROW_ABI = [
  'function taskCounter() external view returns (uint256)',
  'function tasks(uint256 taskId) external view returns (tuple(address creator, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 completedAt, address helper, address rewardAsset, uint256 rewardAmount, uint256 targetChainId))'
];

// 奖励状态枚举
enum RewardStatus {
  Prepared = 0,
  Deposited = 1,
  Locked = 2,
  Claimed = 3,
  Refunded = 4,
  Reverted = 5
}

interface OrphanReward {
  rewardId: string;
  creator: string;
  amount: string;
  asset: string;
  targetChainId: string;
  status: RewardStatus;
  createdAt: number;
  reason: string;
}

class OrphanRewardDiagnostic {
  private provider: ethers.Provider;
  private universalRewardContract: ethers.Contract;
  private taskEscrowContract: ethers.Contract;

  constructor() {
    // 连接到ZetaChain Athens测试网
    this.provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public');
    this.universalRewardContract = new ethers.Contract(CONTRACTS.UNIVERSAL_REWARD, UNIVERSAL_REWARD_ABI, this.provider);
    this.taskEscrowContract = new ethers.Contract(CONTRACTS.TASK_ESCROW, TASK_ESCROW_ABI, this.provider);
  }

  /**
   * 扫描所有奖励，识别孤儿奖励
   */
  async scanForOrphanRewards(): Promise<OrphanReward[]> {
    console.log('🔍 开始扫描孤儿奖励...');
    console.log(`📋 UniversalReward合约地址: ${CONTRACTS.UNIVERSAL_REWARD}`);
    console.log(`📋 TaskEscrow合约地址: ${CONTRACTS.TASK_ESCROW}`);

    const orphanRewards: OrphanReward[] = [];

    try {
      // 获取下一个奖励ID（即总奖励数量）
      const nextRewardId = await this.universalRewardContract.nextRewardId();
      const totalRewards = Number(nextRewardId);
      
      console.log(`📊 总奖励数量: ${totalRewards}`);

      if (totalRewards === 0) {
        console.log('✅ 没有找到任何奖励');
        return orphanRewards;
      }

      // 扫描所有奖励（从ID 1开始）
      for (let rewardId = 1; rewardId < totalRewards; rewardId++) {
        try {
          console.log(`🔍 检查奖励 ID: ${rewardId}`);
          
          const rewardPlan = await this.universalRewardContract.rewardPlans(rewardId);
          
          const reward = {
            rewardId: rewardId.toString(),
            creator: rewardPlan.creator,
            taskId: rewardPlan.taskId.toString(),
            asset: rewardPlan.asset,
            amount: ethers.formatEther(rewardPlan.amount),
            targetChainId: rewardPlan.targetChainId.toString(),
            status: Number(rewardPlan.status) as RewardStatus,
            createdAt: Number(rewardPlan.createdAt)
          };

          console.log(`   📋 奖励详情:`, {
            rewardId: reward.rewardId,
            creator: reward.creator,
            taskId: reward.taskId,
            status: RewardStatus[reward.status],
            amount: reward.amount
          });

          // 检查是否为孤儿奖励
          const orphanReason = await this.checkIfOrphan(reward);
          if (orphanReason) {
            orphanRewards.push({
              ...reward,
              reason: orphanReason
            });
            console.log(`❌ 发现孤儿奖励: ${reward.rewardId} - ${orphanReason}`);
          } else {
            console.log(`✅ 奖励 ${reward.rewardId} 状态正常`);
          }

        } catch (error) {
          console.error(`❌ 检查奖励 ${rewardId} 时出错:`, error);
        }
      }

      return orphanRewards;

    } catch (error) {
      console.error('❌ 扫描过程中出错:', error);
      throw error;
    }
  }

  /**
   * 检查奖励是否为孤儿奖励
   */
  private async checkIfOrphan(reward: any): Promise<string | null> {
    // 1. 检查taskId为0的情况（经典孤儿奖励）
    if (reward.taskId === '0') {
      if (reward.status === RewardStatus.Deposited) {
        return 'taskId为0且状态为Deposited（经典孤儿奖励）';
      }
      if (reward.status === RewardStatus.Prepared) {
        return 'taskId为0且状态为Prepared（未完成的奖励创建）';
      }
    }

    // 2. 检查taskId不为0但任务不存在的情况
    if (reward.taskId !== '0') {
      try {
        const taskData = await this.taskEscrowContract.tasks(BigInt(reward.taskId));
        
        // 检查任务是否真实存在（creator不为零地址）
        if (taskData.creator === '0x0000000000000000000000000000000000000000') {
          return `taskId ${reward.taskId} 指向不存在的任务`;
        }

        // 检查任务创建者是否与奖励创建者匹配
        if (taskData.creator.toLowerCase() !== reward.creator.toLowerCase()) {
          return `taskId ${reward.taskId} 的任务创建者与奖励创建者不匹配`;
        }

        // 检查反向关联：任务是否正确关联到这个奖励
        try {
          const associatedRewardId = await this.universalRewardContract.getRewardByTask(BigInt(reward.taskId));
          if (associatedRewardId.toString() !== reward.rewardId) {
            return `taskId ${reward.taskId} 关联的奖励ID不匹配（期望: ${reward.rewardId}, 实际: ${associatedRewardId.toString()}）`;
          }
        } catch (error) {
          return `无法获取taskId ${reward.taskId} 关联的奖励ID`;
        }

      } catch (error) {
        return `无法验证taskId ${reward.taskId} 的任务数据`;
      }
    }

    // 3. 检查状态异常的情况
    if (reward.status === RewardStatus.Deposited && reward.taskId !== '0') {
      // 状态为Deposited但有taskId，应该是Locked状态
      return `状态异常：有taskId但状态仍为Deposited，应该为Locked`;
    }

    return null; // 不是孤儿奖励
  }

  /**
   * 生成详细报告
   */
  generateReport(orphanRewards: OrphanReward[]): void {
    console.log('\n📊 孤儿奖励诊断报告');
    console.log('='.repeat(50));
    
    if (orphanRewards.length === 0) {
      console.log('✅ 没有发现孤儿奖励！系统状态良好。');
      return;
    }

    console.log(`❌ 发现 ${orphanRewards.length} 个孤儿奖励：\n`);

    // 按原因分组
    const groupedByReason = orphanRewards.reduce((acc, reward) => {
      if (!acc[reward.reason]) {
        acc[reward.reason] = [];
      }
      acc[reward.reason].push(reward);
      return acc;
    }, {} as Record<string, OrphanReward[]>);

    for (const [reason, rewards] of Object.entries(groupedByReason)) {
      console.log(`📋 ${reason}:`);
      console.log(`   数量: ${rewards.length}`);
      
      for (const reward of rewards) {
        console.log(`   - 奖励ID: ${reward.rewardId}`);
        console.log(`     创建者: ${reward.creator}`);
        console.log(`     金额: ${reward.amount} ETH`);
        console.log(`     状态: ${RewardStatus[reward.status]}`);
        console.log(`     目标链: ${reward.targetChainId}`);
        console.log(`     创建时间: ${new Date(reward.createdAt * 1000).toLocaleString()}`);
        console.log('');
      }
    }

    // 统计信息
    const totalAmount = orphanRewards.reduce((sum, reward) => sum + parseFloat(reward.amount), 0);
    const uniqueCreators = new Set(orphanRewards.map(r => r.creator)).size;

    console.log('📈 统计信息:');
    console.log(`   总孤儿奖励数量: ${orphanRewards.length}`);
    console.log(`   涉及的总金额: ${totalAmount.toFixed(4)} ETH`);
    console.log(`   涉及的用户数量: ${uniqueCreators}`);
    
    // 按状态统计
    const statusCounts = orphanRewards.reduce((acc, reward) => {
      const status = RewardStatus[reward.status];
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('   按状态分布:');
    for (const [status, count] of Object.entries(statusCounts)) {
      console.log(`     ${status}: ${count}`);
    }
  }

  /**
   * 检查特定用户的奖励
   */
  async checkUserRewards(userAddress: string): Promise<void> {
    console.log(`\n🔍 检查用户 ${userAddress} 的奖励...`);
    
    try {
      const userRewardIds = await this.universalRewardContract.getRewardsByCreator(userAddress);
      console.log(`📊 用户共有 ${userRewardIds.length} 个奖励`);

      for (const rewardId of userRewardIds) {
        const rewardPlan = await this.universalRewardContract.rewardPlans(rewardId);
        console.log(`   奖励 ${rewardId.toString()}:`);
        console.log(`     taskId: ${rewardPlan.taskId.toString()}`);
        console.log(`     状态: ${RewardStatus[Number(rewardPlan.status)]}`);
        console.log(`     金额: ${ethers.formatEther(rewardPlan.amount)} ETH`);
      }
    } catch (error) {
      console.error('❌ 检查用户奖励时出错:', error);
    }
  }
}

async function main() {
  try {
    const diagnostic = new OrphanRewardDiagnostic();
    
    console.log('🚀 开始孤儿奖励诊断...\n');
    
    // 扫描所有孤儿奖励
    const orphanRewards = await diagnostic.scanForOrphanRewards();
    
    // 生成报告
    diagnostic.generateReport(orphanRewards);
    
    // 如果发现孤儿奖励，提供解决建议
    if (orphanRewards.length > 0) {
      console.log('\n💡 解决建议:');
      console.log('1. 对于taskId为0的孤儿奖励，可以使用退款功能返还资金');
      console.log('2. 对于关联错误的奖励，需要检查关联逻辑');
      console.log('3. 运行清理脚本: npx tsx scripts/executeOrphanRefunds.ts');
    }
    
  } catch (error) {
    console.error('💥 诊断失败:', error);
    process.exit(1);
  }
}

// 运行诊断
if (require.main === module) {
  main().catch(console.error);
}