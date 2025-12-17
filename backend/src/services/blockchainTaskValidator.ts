import { ethers } from 'ethers';

/**
 * 区块链任务验证结果
 */
export interface TaskValidationResult {
  exists: boolean;
  creator: string;
  status: number;
  reward: string;
  taskURI: string;
  error?: string;
}

/**
 * 区块链任务验证器服务
 * P0 Fix: 验证任务在区块链上的存在性，防止 orphan metadata
 */
export class BlockchainTaskValidator {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor(rpcUrl: string, contractAddress: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // TaskEscrow 合约 ABI（只需要 tasks 函数）
    const taskEscrowABI = [
      'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt, uint256 echoPostFee, address rewardAsset, uint256 rewardAmount)'
    ];
    
    this.contract = new ethers.Contract(contractAddress, taskEscrowABI, this.provider);
  }

  /**
   * 验证任务是否存在于区块链上
   * @param taskId 任务 ID
   * @returns 验证结果
   */
  async validateTaskExists(taskId: string): Promise<TaskValidationResult> {
    try {
      console.log(`[BlockchainValidator] Validating task ${taskId} on blockchain...`);
      
      // 设置 3 秒超时
      const taskData = await Promise.race([
        this.contract.tasks(taskId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('RPC timeout')), 3000)
        )
      ]) as any[];

      const [
        taskIdOnChain,
        creator,
        helper,
        reward,
        taskURI,
        status,
        createdAt,
        acceptedAt,
        submittedAt,
        terminateRequestedBy,
        terminateRequestedAt,
        fixRequested,
        fixRequestedAt,
        echoPostFee,
        rewardAsset,
        rewardAmount
      ] = taskData;

      // 检查任务是否存在（creator 不为零地址）
      const exists = creator !== ethers.ZeroAddress;
      
      if (!exists) {
        console.log(`[BlockchainValidator] Task ${taskId} does not exist on blockchain (creator is zero address)`);
        return {
          exists: false,
          creator: ethers.ZeroAddress,
          status: 0,
          reward: '0',
          taskURI: '',
          error: 'Task not found on blockchain'
        };
      }

      console.log(`[BlockchainValidator] ✅ Task ${taskId} exists on blockchain:`, {
        creator,
        reward: reward.toString(),
        status: status.toString(),
        taskURI
      });

      return {
        exists: true,
        creator,
        status: Number(status),
        reward: reward.toString(),
        taskURI,
      };

    } catch (error) {
      console.error(`[BlockchainValidator] ❌ Error validating task ${taskId}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        exists: false,
        creator: ethers.ZeroAddress,
        status: 0,
        reward: '0',
        taskURI: '',
        error: `Blockchain validation failed: ${errorMessage}`
      };
    }
  }

  /**
   * 获取任务创建者地址
   * @param taskId 任务 ID
   * @returns 创建者地址
   */
  async getTaskCreator(taskId: string): Promise<string> {
    try {
      const validation = await this.validateTaskExists(taskId);
      return validation.creator;
    } catch (error) {
      console.error(`[BlockchainValidator] Error getting task creator for ${taskId}:`, error);
      return ethers.ZeroAddress;
    }
  }

  /**
   * 验证请求者是否为任务创建者
   * @param taskId 任务 ID
   * @param requestorAddress 请求者地址
   * @returns 是否为创建者
   */
  async validateCreatorAuthorization(taskId: string, requestorAddress: string): Promise<boolean> {
    try {
      const creator = await this.getTaskCreator(taskId);
      const isAuthorized = creator.toLowerCase() === requestorAddress.toLowerCase();
      
      console.log(`[BlockchainValidator] Authorization check for task ${taskId}:`, {
        creator,
        requestor: requestorAddress,
        authorized: isAuthorized
      });
      
      return isAuthorized;
    } catch (error) {
      console.error(`[BlockchainValidator] Error validating creator authorization:`, error);
      return false;
    }
  }
}

// 单例实例
let validatorInstance: BlockchainTaskValidator | null = null;

/**
 * 获取区块链任务验证器实例
 */
export function getBlockchainTaskValidator(): BlockchainTaskValidator {
  if (!validatorInstance) {
    const rpcUrl = process.env.RPC_URL;
    const contractAddress = process.env.TASK_ESCROW_ADDRESS;
    
    if (!rpcUrl || !contractAddress) {
      throw new Error('Missing RPC_URL or TASK_ESCROW_ADDRESS environment variables');
    }
    
    validatorInstance = new BlockchainTaskValidator(rpcUrl, contractAddress);
  }
  
  return validatorInstance;
}