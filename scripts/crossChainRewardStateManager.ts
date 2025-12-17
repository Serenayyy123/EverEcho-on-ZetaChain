#!/usr/bin/env tsx

/**
 * 跨链奖励状态管理器 - 解决状态丢失问题
 */

interface CrossChainRewardState {
  rewardId: string;
  status: 'prepared' | 'deposited' | 'locked' | 'claimed' | 'refunded' | 'error';
  taskId?: number;
  amount: string;
  asset: string;
  targetChainId: string;
  createdAt: number;
  lastUpdated: number;
  txHashes: {
    prepare?: string;
    deposit?: string;
    lock?: string;
    claim?: string;
  };
  error?: string;
}

export class CrossChainRewardStateManager {
  private storageKey = 'everecho_crosschain_rewards';

  // 保存状态到本地存储
  saveRewardState(userAddress: string, state: CrossChainRewardState): void {
    try {
      const allStates = this.getAllStates();
      const userKey = userAddress.toLowerCase();
      
      if (!allStates[userKey]) {
        allStates[userKey] = {};
      }
      
      allStates[userKey][state.rewardId] = {
        ...state,
        lastUpdated: Date.now()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(allStates));
      console.log('💾 Reward state saved:', state.rewardId);
    } catch (error) {
      console.error('Failed to save reward state:', error);
    }
  }

  // 获取用户的所有奖励状态
  getUserRewardStates(userAddress: string): Record<string, CrossChainRewardState> {
    try {
      const allStates = this.getAllStates();
      return allStates[userAddress.toLowerCase()] || {};
    } catch (error) {
      console.error('Failed to get user reward states:', error);
      return {};
    }
  }

  // 获取特定奖励状态
  getRewardState(userAddress: string, rewardId: string): CrossChainRewardState | null {
    try {
      const userStates = this.getUserRewardStates(userAddress);
      return userStates[rewardId] || null;
    } catch (error) {
      console.error('Failed to get reward state:', error);
      return null;
    }
  }

  // 更新奖励状态
  updateRewardState(
    userAddress: string, 
    rewardId: string, 
    updates: Partial<CrossChainRewardState>
  ): void {
    try {
      const currentState = this.getRewardState(userAddress, rewardId);
      if (!currentState) {
        console.warn('Reward state not found for update:', rewardId);
        return;
      }

      const updatedState: CrossChainRewardState = {
        ...currentState,
        ...updates,
        lastUpdated: Date.now()
      };

      this.saveRewardState(userAddress, updatedState);
    } catch (error) {
      console.error('Failed to update reward state:', error);
    }
  }

  // 删除奖励状态
  removeRewardState(userAddress: string, rewardId: string): void {
    try {
      const allStates = this.getAllStates();
      const userKey = userAddress.toLowerCase();
      
      if (allStates[userKey] && allStates[userKey][rewardId]) {
        delete allStates[userKey][rewardId];
        localStorage.setItem(this.storageKey, JSON.stringify(allStates));
        console.log('🗑️ Reward state removed:', rewardId);
      }
    } catch (error) {
      console.error('Failed to remove reward state:', error);
    }
  }

  // 清理过期状态（7天前的）
  cleanupExpiredStates(): void {
    try {
      const allStates = this.getAllStates();
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      let cleaned = false;

      for (const userAddress in allStates) {
        const userStates = allStates[userAddress];
        
        for (const rewardId in userStates) {
          const state = userStates[rewardId];
          
          // 删除7天前的已完成或错误状态
          if (state.lastUpdated < sevenDaysAgo && 
              (state.status === 'claimed' || state.status === 'refunded' || state.status === 'error')) {
            delete userStates[rewardId];
            cleaned = true;
          }
        }
      }

      if (cleaned) {
        localStorage.setItem(this.storageKey, JSON.stringify(allStates));
        console.log('🧹 Expired reward states cleaned up');
      }
    } catch (error) {
      console.error('Failed to cleanup expired states:', error);
    }
  }

  // 获取所有状态
  private getAllStates(): Record<string, Record<string, CrossChainRewardState>> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to parse stored states:', error);
      return {};
    }
  }

  // 同步链上状态
  async syncWithContract(
    userAddress: string,
    rewardId: string,
    provider: any,
    contractAddress: string
  ): Promise<void> {
    try {
      const contractABI = [
        "function getRewardPlan(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))"
      ];

      const contract = new (await import('ethers')).ethers.Contract(
        contractAddress,
        contractABI,
        provider
      );

      const plan = await contract.getRewardPlan(BigInt(rewardId));
      
      // 状态映射
      const statusMap = {
        0: 'prepared',
        1: 'deposited', 
        2: 'locked',
        3: 'claimed',
        4: 'refunded',
        5: 'error'
      } as const;

      const contractStatus = statusMap[Number(plan.status) as keyof typeof statusMap] || 'error';
      
      // 更新本地状态
      this.updateRewardState(userAddress, rewardId, {
        status: contractStatus,
        taskId: Number(plan.taskId) || undefined
      });

      console.log('🔄 State synced with contract:', { rewardId, status: contractStatus });
    } catch (error) {
      console.error('Failed to sync with contract:', error);
    }
  }

  // 检测未完成的奖励
  getIncompleteRewards(userAddress: string): CrossChainRewardState[] {
    try {
      const userStates = this.getUserRewardStates(userAddress);
      
      return Object.values(userStates).filter(state => 
        state.status === 'prepared' || 
        state.status === 'deposited' || 
        state.status === 'error'
      );
    } catch (error) {
      console.error('Failed to get incomplete rewards:', error);
      return [];
    }
  }

  // 生成恢复建议
  generateRecoveryActions(userAddress: string): Array<{
    rewardId: string;
    action: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    try {
      const incompleteRewards = this.getIncompleteRewards(userAddress);
      const actions: Array<{
        rewardId: string;
        action: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
      }> = [];

      for (const reward of incompleteRewards) {
        if (reward.status === 'prepared') {
          actions.push({
            rewardId: reward.rewardId,
            action: 'deposit',
            description: `存入 ${reward.amount} ${reward.asset} 到奖励计划`,
            priority: 'medium'
          });
        } else if (reward.status === 'deposited') {
          actions.push({
            rewardId: reward.rewardId,
            action: 'refund_or_use',
            description: `奖励已存入但未使用，可以退款或创建任务`,
            priority: 'high'
          });
        } else if (reward.status === 'error') {
          actions.push({
            rewardId: reward.rewardId,
            action: 'investigate',
            description: `奖励处于错误状态: ${reward.error}`,
            priority: 'high'
          });
        }
      }

      return actions.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    } catch (error) {
      console.error('Failed to generate recovery actions:', error);
      return [];
    }
  }
}

// 使用示例和测试
async function demonstrateStateManager() {
  const stateManager = new CrossChainRewardStateManager();
  const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  // 保存新的奖励状态
  const newRewardState: CrossChainRewardState = {
    rewardId: '123',
    status: 'prepared',
    amount: '0.01',
    asset: 'ETH',
    targetChainId: '11155111',
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    txHashes: {}
  };

  stateManager.saveRewardState(userAddress, newRewardState);

  // 更新状态
  stateManager.updateRewardState(userAddress, '123', {
    status: 'deposited',
    txHashes: { deposit: '0xabc123...' }
  });

  // 获取恢复建议
  const recoveryActions = stateManager.generateRecoveryActions(userAddress);
  console.log('Recovery actions:', recoveryActions);

  // 清理过期状态
  stateManager.cleanupExpiredStates();
}

if (require.main === module) {
  demonstrateStateManager().catch(console.error);
}