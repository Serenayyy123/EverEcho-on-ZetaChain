import { ethers } from 'ethers';

/**
 * 链上状态读取服务
 * 冻结点 1.3-13：状态枚举 { Open, InProgress, Submitted, Completed, Cancelled }
 */

// TaskEscrow 最小 ABI（只读 tasks）
const TASK_ESCROW_ABI = [
  'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
];

// 状态枚举
export enum TaskStatus {
  Open = 0,
  InProgress = 1,
  Submitted = 2,
  Completed = 3,
  Cancelled = 4,
}

/**
 * 获取任务链上状态
 * @param taskId 任务 ID
 * @returns 任务状态和参与者信息
 */
export async function getTaskOnChainStatus(taskId: string): Promise<{
  status: TaskStatus;
  creator: string;
  helper: string;
} | null> {
  try {
    // 从环境变量读取配置
    const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
    const taskEscrowAddress = process.env.TASK_ESCROW_ADDRESS;
    
    if (!taskEscrowAddress) {
      throw new Error('TASK_ESCROW_ADDRESS not configured');
    }
    
    // 尝试多个 RPC 端点
    const rpcUrls = [
      rpcUrl,
      'https://sepolia.base.org',
      'https://base-sepolia-rpc.publicnode.com',
    ];
    
    let lastError: any = null;
    
    for (const url of rpcUrls) {
      try {
        console.log(`[chainService] Trying RPC: ${url}`);
        const provider = new ethers.JsonRpcProvider(url);
        const taskEscrow = new ethers.Contract(taskEscrowAddress, TASK_ESCROW_ABI, provider);
        
        // 读取链上任务数据（设置超时）
        const task = await Promise.race([
          taskEscrow.tasks(taskId),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('RPC timeout')), 5000)
          ),
        ]);
        
        console.log(`[chainService] Successfully read task from ${url}`);
        
        return {
          status: Number((task as any).status) as TaskStatus,
          creator: (task as any).creator,
          helper: (task as any).helper,
        };
      } catch (error: any) {
        console.log(`[chainService] RPC ${url} failed:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    throw lastError || new Error('All RPC endpoints failed');
  } catch (error) {
    console.error('[chainService] Error reading on-chain task status:', error);
    return null;
  }
}

/**
 * 检查任务状态是否允许解密 contacts
 * @param status 任务状态
 * @returns 是否允许
 */
export function isStatusAllowedForDecryption(status: TaskStatus): boolean {
  // 冻结点 1.3-13/15/16/17：仅 InProgress/Submitted/Completed 允许解密
  return status === TaskStatus.InProgress 
      || status === TaskStatus.Submitted 
      || status === TaskStatus.Completed;
}

/**
 * 检查用户是否为任务参与者
 * @param address 用户地址
 * @param creator Creator 地址
 * @param helper Helper 地址
 * @returns 是否为参与者及角色
 */
export function checkTaskParticipant(
  address: string,
  creator: string,
  helper: string
): { isParticipant: boolean; isCreator: boolean } {
  const lowerAddress = address.toLowerCase();
  const isCreator = lowerAddress === creator.toLowerCase();
  const isHelper = lowerAddress === helper.toLowerCase();
  
  return {
    isParticipant: isCreator || isHelper,
    isCreator,
  };
}
