#!/usr/bin/env tsx

/**
 * 改进的任务发布流程，解决跨链奖励关联问题
 */

import { ethers } from 'ethers';

interface ImprovedPublishTaskFlow {
  // 阶段1: 验证跨链奖励状态
  validateCrossChainReward(rewardId: string): Promise<boolean>;
  
  // 阶段2: 原子化任务创建和奖励锁定
  createTaskWithReward(taskData: any, rewardId: string): Promise<{
    taskId: number;
    txHash: string;
    rewardLocked: boolean;
  }>;
  
  // 阶段3: 错误恢复
  recoverFromFailure(rewardId: string, taskId?: number): Promise<void>;
}

export class SafePublishTaskFlow implements ImprovedPublishTaskFlow {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private taskEscrowAddress: string;
  private universalRewardAddress: string;

  constructor(
    provider: ethers.Provider,
    signer: ethers.Signer,
    taskEscrowAddress: string,
    universalRewardAddress: string
  ) {
    this.provider = provider;
    this.signer = signer;
    this.taskEscrowAddress = taskEscrowAddress;
    this.universalRewardAddress = universalRewardAddress;
  }

  async validateCrossChainReward(rewardId: string): Promise<boolean> {
    try {
      const universalRewardABI = [
        "function getRewardPlan(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))"
      ];

      const contract = new ethers.Contract(
        this.universalRewardAddress,
        universalRewardABI,
        this.provider
      );

      const plan = await contract.getRewardPlan(BigInt(rewardId));
      
      // 验证状态必须是 Deposited (1)
      if (Number(plan.status) !== 1) {
        console.error('❌ Reward not in Deposited status:', plan.status);
        return false;
      }

      // 验证创建者是当前用户
      const signerAddress = await this.signer.getAddress();
      if (plan.creator.toLowerCase() !== signerAddress.toLowerCase()) {
        console.error('❌ Reward creator mismatch');
        return false;
      }

      // 验证未绑定到其他任务
      if (Number(plan.taskId) !== 0) {
        console.error('❌ Reward already locked to task:', plan.taskId);
        return false;
      }

      console.log('✅ Cross-chain reward validation passed');
      return true;
    } catch (error) {
      console.error('❌ Failed to validate cross-chain reward:', error);
      return false;
    }
  }

  async createTaskWithReward(taskData: any, rewardId: string): Promise<{
    taskId: number;
    txHash: string;
    rewardLocked: boolean;
  }> {
    let taskId: number | null = null;
    let taskTxHash: string = '';
    let rewardLocked = false;

    try {
      // 步骤1: 验证跨链奖励
      const isValidReward = await this.validateCrossChainReward(rewardId);
      if (!isValidReward) {
        throw new Error('Cross-chain reward validation failed');
      }

      // 步骤2: 创建任务
      console.log('📝 Creating ECHO task...');
      const taskEscrowABI = [
        "function createTask(string memory taskURI, uint256 reward, uint256 echoPostFee, address rewardAsset, uint256 rewardAmount) external returns (uint256)",
        "event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 reward, string taskURI)"
      ];

      const taskContract = new ethers.Contract(
        this.taskEscrowAddress,
        taskEscrowABI,
        this.signer
      );

      const createTx = await taskContract.createTask(
        taskData.taskURI,
        ethers.parseEther(taskData.reward),
        ethers.parseEther('10'), // echoPostFee
        taskData.rewardAsset || ethers.ZeroAddress,
        taskData.rewardAmount ? ethers.parseEther(taskData.rewardAmount) : 0
      );

      taskTxHash = createTx.hash;
      console.log('⏳ Waiting for task creation confirmation...');
      
      const receipt = await createTx.wait();
      console.log('✅ Task created successfully');

      // 步骤3: 解析 TaskID
      taskId = await this.parseTaskIdFromReceipt(receipt);
      if (!taskId) {
        throw new Error('Failed to parse TaskID from receipt');
      }

      console.log('🎯 TaskID parsed:', taskId);

      // 步骤4: 锁定跨链奖励
      console.log('🔒 Locking cross-chain reward to task...');
      
      const universalRewardABI = [
        "function lockForTask(uint256 rewardId, uint256 taskId) external"
      ];

      const rewardContract = new ethers.Contract(
        this.universalRewardAddress,
        universalRewardABI,
        this.signer
      );

      const lockTx = await rewardContract.lockForTask(BigInt(rewardId), taskId);
      await lockTx.wait();
      
      rewardLocked = true;
      console.log('✅ Cross-chain reward locked successfully');

      return {
        taskId,
        txHash: taskTxHash,
        rewardLocked
      };

    } catch (error) {
      console.error('❌ Task creation with reward failed:', error);
      
      // 错误恢复
      await this.recoverFromFailure(rewardId, taskId || undefined);
      
      throw error;
    }
  }

  private async parseTaskIdFromReceipt(receipt: ethers.TransactionReceipt): Promise<number | null> {
    try {
      const taskCreatedEventABI = [
        "event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 reward, string taskURI)"
      ];

      const iface = new ethers.Interface(taskCreatedEventABI);

      for (const log of receipt.logs) {
        try {
          if (log.address.toLowerCase() === this.taskEscrowAddress.toLowerCase()) {
            const parsed = iface.parseLog({
              topics: log.topics,
              data: log.data
            });
            
            if (parsed && parsed.name === 'TaskCreated') {
              return Number(parsed.args.taskId);
            }
          }
        } catch (parseError) {
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to parse TaskID:', error);
      return null;
    }
  }

  async recoverFromFailure(rewardId: string, taskId?: number): Promise<void> {
    try {
      console.log('🔧 Attempting error recovery...');

      // 检查跨链奖励状态
      const universalRewardABI = [
        "function getRewardPlan(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))",
        "function refund(uint256 rewardId) external"
      ];

      const contract = new ethers.Contract(
        this.universalRewardAddress,
        universalRewardABI,
        this.signer
      );

      const plan = await contract.getRewardPlan(BigInt(rewardId));
      
      // 如果奖励处于 Deposited 状态且未锁定，提供退款选项
      if (Number(plan.status) === 1 && Number(plan.taskId) === 0) {
        console.log('💡 Cross-chain reward can be refunded');
        console.log('   Call refund() to recover your funds');
      }
      
      // 如果任务已创建但奖励未锁定，提供手动锁定选项
      if (taskId && Number(plan.status) === 1) {
        console.log('💡 Task created but reward not locked');
        console.log(`   Call lockForTask(${rewardId}, ${taskId}) to associate reward`);
      }

    } catch (error) {
      console.error('Recovery attempt failed:', error);
    }
  }
}

// 使用示例
async function demonstrateImprovedFlow() {
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  const signer = await provider.getSigner(0);
  
  const flow = new SafePublishTaskFlow(
    provider,
    signer,
    '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', // TaskEscrow
    '0x9A676e781A523b5d0C0e43731313A708CB607508'  // UniversalReward
  );

  try {
    const result = await flow.createTaskWithReward(
      {
        taskURI: 'ipfs://example',
        reward: '100',
        rewardAsset: ethers.ZeroAddress,
        rewardAmount: '0'
      },
      '1' // rewardId
    );

    console.log('🎉 Task created successfully:', result);
  } catch (error) {
    console.error('Task creation failed:', error);
  }
}

if (require.main === module) {
  demonstrateImprovedFlow().catch(console.error);
}