import { useState } from 'react';
import { ethers } from 'ethers';
import { getContractAddresses } from '../contracts/addresses';
import TaskEscrowABI from '../contracts/TaskEscrow.json';
import EOCHOTokenABI from '../contracts/EOCHOToken.json';
import { retryQueue } from '../services/retryQueue';
import NetworkGuard from '../services/networkGuard';

/**
 * 创建任务 Hook - Chain-first 方法
 * P0 Fix: 先链上成功，再写后端 metadata，防止 orphan metadata
 * 冻结点 1.3-14：双向抵押前置检查
 * 孤儿奖励修复：改进的错误处理和自动回滚机制
 */

/**
 * 解析和分类错误，提供用户友好的错误信息
 */
const parseContractError = (error: any): string => {
  if (!error) return 'Unknown error occurred';
  
  const errorMessage = error.message || error.toString();
  
  // 用户取消交易
  if (errorMessage.includes('user rejected') || errorMessage.includes('User denied')) {
    return 'Transaction was cancelled by user';
  }
  
  // 网络错误
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return 'Network connection error. Please check your internet connection and try again';
  }
  
  // Gas 相关错误
  if (errorMessage.includes('gas') || errorMessage.includes('out of gas')) {
    return 'Transaction failed due to insufficient gas. Please try again with higher gas limit';
  }
  
  // 余额不足
  if (errorMessage.includes('insufficient funds') || 
      (errorMessage.includes('balance') && !errorMessage.includes('gas'))) {
    return 'Insufficient balance to complete the transaction';
  }
  
  // 合约 revert 错误
  if (errorMessage.includes('revert')) {
    // 尝试提取 revert 原因
    const revertMatch = errorMessage.match(/revert (.+?)(?:\s|$)/);
    if (revertMatch) {
      return `Contract error: ${revertMatch[1]}`;
    }
    return 'Transaction was reverted by the contract';
  }
  
  // 奖励相关的特定错误
  if (errorMessage.includes('Invalid reward status')) {
    return 'The cross-chain reward is in an invalid state. Please create a new reward';
  }
  
  if (errorMessage.includes('Reward creator mismatch')) {
    return 'You are not the creator of this cross-chain reward';
  }
  
  if (errorMessage.includes('Association verification failed')) {
    return 'Failed to verify reward association. The operation may have partially succeeded';
  }
  
  // 超时错误
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return 'Transaction timed out. Please check the transaction status and try again if needed';
  }
  
  // 处理对象类型的错误
  if (typeof error === 'object' && error !== null && !error.message) {
    if (error.code) {
      return `Error code: ${error.code}`;
    }
    return 'Unknown error occurred';
  }
  
  // 返回原始错误信息（截断过长的信息）
  return errorMessage.length > 200 ? errorMessage.substring(0, 200) + '...' : errorMessage;
};

// ERC20 ABI（用于余额检查）
const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
];

// 冻结点 1.2-10：MAX_REWARD 硬限制
const MAX_REWARD = 1000;

export interface CreateTaskParams {
  title: string;
  description: string;
  contactsPlaintext: string; // 明文联系方式（从 Profile 获取）
  reward: string; // ECHO 单位 - 原生 ECHO，参与 2R 结算（核心资金流）
  category?: string; // 任务分类（可选）
  // Stage 4.1 语义边界：跨链奖励占位字段（当前不转账）
  rewardAsset?: string; // 跨链奖励资产地址（占位，不做真实转账）
  rewardAmount?: string; // 跨链奖励数量（占位，不做真实转账）
  // 原子化操作参数
  useAtomicOperation?: boolean; // 是否使用原子化操作
  crossChainRewardId?: string; // 已准备的跨链奖励ID（用于原子化操作）
  targetChainId?: string; // 目标链ID
  // Stage 4.9.x: 自定义 signer 支持
  customSigner?: ethers.Signer; // 自定义 signer（用于双 Provider 架构）
}

export function useCreateTask(
  signer: ethers.Signer | null,
  provider: ethers.Provider | null,
  chainId: number | null
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [step, setStep] = useState<string>('');

  /**
   * 写入任务 metadata 到后端（新的 chain-first 端点）
   * P0 Fix: 使用新的 PUT /api/tasks/:taskId/metadata 端点，带重试队列机制
   */
  const writeTaskMetadata = async (
    taskId: string, 
    metadata: {
      title: string;
      description: string;
      contactsPlaintext: string;
      category?: string;
      createdAt: number;
    },
    creatorAddress: string,
    useRetryQueue = false
  ): Promise<void> => {
    const API_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...metadata,
          creatorAddress
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Metadata write failed:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(`Failed to save task metadata: ${errorMessage}`);
      }

      const data = await response.json();
      console.log('✅ Metadata saved successfully:', data);
      
    } catch (error) {
      // If immediate write fails and retry queue is enabled, add to queue
      if (useRetryQueue) {
        console.log('🔄 Adding metadata write to retry queue...');
        const retryId = retryQueue.addOperation({
          type: 'metadata_write',
          payload: { taskId, metadata, creatorAddress },
          maxAttempts: 5,
          onSuccess: (_result) => {
            console.log(`✅ Metadata write succeeded via retry queue for task ${taskId}`);
          },
          onFailure: (error) => {
            console.error(`❌ Metadata write failed permanently for task ${taskId}:`, error.message);
          }
        });
        
        console.log(`📋 Metadata write queued with ID: ${retryId}`);
        // Don't throw error when using retry queue - let it handle retries
        return;
      }
      
      throw error;
    }
  };

  /**
   * 检查余额是否充足
   */
  const checkBalance = async (address: string, rewardWei: bigint): Promise<boolean> => {
    if (!provider || !chainId) return false;

    try {
      const addresses = getContractAddresses(chainId);
      const tokenContract = new ethers.Contract(
        addresses.echoToken,
        ERC20_ABI,
        provider
      );
      const balance = await tokenContract.balanceOf(address);
      return balance >= rewardWei;
    } catch (err) {
      console.error('Failed to check balance:', err);
      return false;
    }
  };

  /**
   * 解析TaskCreated事件获取真实taskId
   * P0 Fix: 从交易回执中解析真实的 taskId，不再预测 taskCounter+1
   */
  const parseTaskIdFromReceipt = async (receipt: ethers.TransactionReceipt, contract: ethers.Contract): Promise<string> => {
    try {
      // 优先解析TaskCreated事件
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsedLog && parsedLog.name === 'TaskCreated') {
            const taskId = parsedLog.args.taskId.toString();
            console.log('✅ Parsed taskId from TaskCreated event:', taskId);
            return taskId;
          }
        } catch (err) {
          // 继续尝试下一个log
          continue;
        }
      }
      
      // Fallback: 读取当前 taskCounter（但不预测+1）
      console.warn('TaskCreated event not found, falling back to taskCounter');
      try {
        const taskCounter = await contract.taskCounter();
        const taskId = taskCounter.toString();
        console.log('📋 Fallback taskId from taskCounter:', taskId);
        return taskId;
      } catch (fallbackError) {
        console.error('Fallback taskCounter read failed:', fallbackError);
        throw new Error('Failed to determine taskId from both event and taskCounter');
      }
    } catch (error) {
      console.error('❌ Failed to parse taskId from receipt:', error);
      throw new Error('Failed to parse taskId from transaction receipt');
    }
  };

  /**
   * Method 4: 分离式创建任务和跨链奖励 - 职责分离，避免双重扣费
   */
  const createTaskAtomic = async (params: CreateTaskParams): Promise<string | null> => {
    // Stage 4.9.x: 使用自定义 signer 或默认 signer
    const activeSigner = params.customSigner || signer;
    const activeProvider = params.customSigner?.provider || provider;
    
    if (!activeSigner || !activeProvider) {
      setError('Wallet not connected');
      return null;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);
    setStep('');

    try {
      // Stage 4.9.x: 0. 确保钱包在发布网络（ZetaChain）
      setStep('Ensuring network for publishing...');
      const networkGuard = NetworkGuard.getInstance();
      const switchResult = await networkGuard.ensureNetworkFor('publish');
      
      if (!switchResult.ok) {
        throw new Error(`Network switch failed: ${switchResult.reason}`);
      }

      // 如果发生了网络切换，使用传入的 customSigner（已经是新鲜的）
      let finalSigner = activeSigner;
      if (switchResult.switched && params.customSigner) {
        console.log('[useCreateTask] Using custom signer after network switch');
        finalSigner = params.customSigner;
      }

      const address = await finalSigner.getAddress();

      // 1. 验证输入
      setStep('Validating input...');
      
      if (!params.useAtomicOperation || !params.crossChainRewardId) {
        throw new Error('Missing atomic operation parameters - cross-chain reward must be prepared first');
      }

      const rewardNum = parseFloat(params.reward);
      if (isNaN(rewardNum) || rewardNum <= 0) {
        throw new Error('Reward must be a positive number');
      }

      if (rewardNum > MAX_REWARD) {
        throw new Error(`Reward cannot exceed ${MAX_REWARD} ECHO`);
      }

      const rewardWei = ethers.parseUnits(params.reward, 18);
      const postFeeWei = ethers.parseUnits("10", 18);
      const totalRequired = rewardWei + postFeeWei;

      // 2. 检查ECHO余额（只检查ECHO，跨链代币已在CrossChainRewardSection中处理）
      setStep('Checking ECHO balance...');
      const hasBalance = await checkBalance(address, totalRequired);
      if (!hasBalance) {
        throw new Error(`Insufficient ECHO balance. You need at least ${ethers.formatEther(totalRequired)} ECHO`);
      }

      // 3. 授权TaskEscrow使用ECHO（只处理ECHO代币）
      setStep('Approving ECHO tokens for TaskEscrow...');
      const addresses = getContractAddresses(chainId!);
      
      const tokenContract = new ethers.Contract(
        addresses.echoToken,
        EOCHOTokenABI.abi,
        finalSigner
      );
      
      const approveTx = await tokenContract.approve(addresses.taskEscrow, totalRequired);
      await approveTx.wait();

      // 4. 调用TaskEscrow创建任务（只处理ECHO，不处理跨链代币）
      setStep('Creating task with ECHO reward only...');
      
      const taskEscrowContract = new ethers.Contract(
        addresses.taskEscrow,
        TaskEscrowABI.abi,
        finalSigner
      );
      
      const tempTaskURI = `temp-task-${Date.now()}`;
      
      // 职责分离：TaskEscrow只处理ECHO代币，不发送msg.value
      const tx = await taskEscrowContract.createTaskWithCrossChainReward(
        rewardWei,
        tempTaskURI,
        params.rewardAsset || ethers.ZeroAddress,
        ethers.parseUnits(params.rewardAmount || '0', 18),
        BigInt(params.targetChainId || '0')
        // 注意：不再发送 { value: crossChainAmountWei }
      );

      setTxHash(tx.hash);
      console.log('🚀 Task creation transaction sent (ECHO only):', tx.hash);

      setStep('Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('✅ Task creation confirmed:', receipt);

      // 5. 解析TaskID
      setStep('Parsing task ID...');
      const taskId = await parseTaskIdFromReceipt(receipt, taskEscrowContract);
      console.log('📋 Task created with ID:', taskId, 'Cross-chain reward ID:', params.crossChainRewardId);

      // 6. 关键修复：立即关联跨链奖励到任务（带重试和改进的错误处理）
      if (params.crossChainRewardId) {
        setStep('Associating cross-chain reward to task...');
        
        let associationSuccess = false;
        let lastAssociationError: any = null;
        
        // 重试机制：最多尝试3次关联
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`🔗 Attempt ${attempt}/3: Associating reward ${params.crossChainRewardId} to task ${taskId}...`);
            
            // 创建UniversalReward合约实例
            const { createUniversalRewardContract } = await import('../config/contracts');
            const universalRewardContract = createUniversalRewardContract(finalSigner, 7001);
            
            // 验证奖励状态（确保奖励存在且处于正确状态）
            try {
              const rewardPlan = await universalRewardContract.rewardPlans(BigInt(params.crossChainRewardId));
              console.log('📋 Reward plan status:', {
                rewardId: params.crossChainRewardId,
                status: rewardPlan.status.toString(),
                creator: rewardPlan.creator,
                amount: rewardPlan.amount.toString()
              });
              
              // 检查奖励状态（应该是Deposited=1）
              if (rewardPlan.status !== 1n) {
                throw new Error(`Invalid reward status: ${rewardPlan.status}. Expected status 1 (Deposited).`);
              }
              
              // 检查创建者是否匹配
              const currentAddress = await finalSigner.getAddress();
              if (rewardPlan.creator.toLowerCase() !== currentAddress.toLowerCase()) {
                throw new Error(`Reward creator mismatch. Expected: ${currentAddress}, Got: ${rewardPlan.creator}`);
              }
              
            } catch (statusError: any) {
              console.error('❌ Reward status validation failed:', statusError);
              throw new Error(`Reward validation failed: ${statusError.message}`);
            }
            
            // 调用lockForTask函数关联奖励到任务
            const lockTx = await universalRewardContract.lockForTask(
              BigInt(params.crossChainRewardId), 
              BigInt(taskId)
            );
            
            console.log(`🔄 Lock transaction sent (attempt ${attempt}):`, lockTx.hash);
            setStep(`Confirming association (attempt ${attempt}/3)...`);
            
            const lockReceipt = await lockTx.wait();
            console.log('✅ Lock transaction confirmed:', lockReceipt);
            
            // 验证关联是否成功
            try {
              const verifyRewardId = await universalRewardContract.getRewardByTask(BigInt(taskId));
              if (verifyRewardId.toString() === params.crossChainRewardId) {
                console.log('✅ Cross-chain reward successfully associated to task');
                associationSuccess = true;
                break;
              } else {
                throw new Error(`Association verification failed. Expected reward ID: ${params.crossChainRewardId}, Got: ${verifyRewardId.toString()}`);
              }
            } catch (verifyError: any) {
              console.error('❌ Association verification failed:', verifyError);
              throw new Error(`Association verification failed: ${verifyError.message}`);
            }
            
          } catch (lockError: any) {
            lastAssociationError = lockError;
            const parsedError = parseContractError(lockError);
            console.error(`❌ Association attempt ${attempt} failed:`, parsedError);
            
            // 如果是用户取消，直接抛出错误，不重试
            if (parsedError.includes('cancelled by user')) {
              throw new Error('Cross-chain reward association was cancelled by user');
            }
            
            // 如果不是最后一次尝试，等待后重试
            if (attempt < 3) {
              const waitTime = attempt * 2000; // 递增等待时间：2s, 4s
              console.log(`⏳ Waiting ${waitTime}ms before retry...`);
              setStep(`Association failed (${parsedError}), retrying in ${waitTime/1000}s...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }
        
        // 如果所有尝试都失败，执行自动退款
        if (!associationSuccess) {
          console.error('❌ All association attempts failed, initiating refund...');
          setStep('Association failed, refunding cross-chain reward...');
          
          let refundSuccess = false;
          let lastRefundError: any = null;
          
          // 重试退款：最多尝试3次
          for (let refundAttempt = 1; refundAttempt <= 3; refundAttempt++) {
            try {
              console.log(`💰 Refund attempt ${refundAttempt}/3 for reward ${params.crossChainRewardId}...`);
              
              const { createUniversalRewardContract } = await import('../config/contracts');
              const universalRewardContract = createUniversalRewardContract(finalSigner, 7001);
              
              const refundTx = await universalRewardContract.refund(BigInt(params.crossChainRewardId));
              console.log(`🔄 Refund transaction sent (attempt ${refundAttempt}):`, refundTx.hash);
              
              setStep(`Confirming refund (attempt ${refundAttempt}/3)...`);
              const refundReceipt = await refundTx.wait();
              console.log('✅ Refund transaction confirmed:', refundReceipt);
              
              // 验证退款是否成功
              try {
                const rewardPlan = await universalRewardContract.rewardPlans(BigInt(params.crossChainRewardId));
                if (rewardPlan.status === 4n) { // Refunded = 4
                  console.log('✅ Cross-chain reward refunded successfully');
                  refundSuccess = true;
                  break;
                } else {
                  throw new Error(`Refund verification failed. Expected status 4 (Refunded), Got: ${rewardPlan.status}`);
                }
              } catch (verifyError: any) {
                console.error('❌ Refund verification failed:', verifyError);
                throw new Error(`Refund verification failed: ${verifyError.message}`);
              }
              
            } catch (refundError: any) {
              lastRefundError = refundError;
              const parsedRefundError = parseContractError(refundError);
              console.error(`❌ Refund attempt ${refundAttempt} failed:`, parsedRefundError);
              
              if (refundAttempt < 3) {
                const waitTime = refundAttempt * 2000;
                console.log(`⏳ Waiting ${waitTime}ms before refund retry...`);
                setStep(`Refund failed (${parsedRefundError}), retrying in ${waitTime/1000}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
              }
            }
          }
          
          // 构造详细的错误信息
          let errorMessage = 'Cross-chain reward association failed after 3 attempts.';
          
          if (lastAssociationError) {
            const parsedAssociationError = parseContractError(lastAssociationError);
            errorMessage += ` Last association error: ${parsedAssociationError}`;
          }
          
          if (refundSuccess) {
            errorMessage += ' Your cross-chain reward has been refunded successfully. Please try creating the task again.';
          } else {
            errorMessage += ` Automatic refund also failed after 3 attempts.`;
            if (lastRefundError) {
              const parsedRefundError = parseContractError(lastRefundError);
              errorMessage += ` Last refund error: ${parsedRefundError}`;
            }
            errorMessage += ` Please contact support immediately. Reward ID: ${params.crossChainRewardId}`;
          }
          
          throw new Error(errorMessage);
        }
      }

      // 7. 写入后端metadata
      setStep('Saving task metadata...');
      try {
        await writeTaskMetadata(taskId.toString(), {
          title: params.title,
          description: params.description,
          contactsPlaintext: params.contactsPlaintext,
          category: params.category,
          createdAt: Date.now()
        }, address, false);
      } catch (metadataError) {
        console.warn('Direct metadata write failed, using retry queue:', metadataError);
        await writeTaskMetadata(taskId.toString(), {
          title: params.title,
          description: params.description,
          contactsPlaintext: params.contactsPlaintext,
          category: params.category,
          createdAt: Date.now()
        }, address, true);
        
        setStep('Task created! Metadata will be saved in background...');
      }

      setStep('Task created successfully! Cross-chain reward associated.');
      return tx.hash;

    } catch (err) {
      console.error('Task creation failed:', err);
      const errorMessage = parseContractError(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };



  /**
   * 创建任务
   * P0 Fix: Chain-first流程 - 先链上成功，再写后端metadata
   */
  const createTask = async (params: CreateTaskParams): Promise<string | null> => {
    // 如果启用原子化操作，使用新的流程
    if (params.useAtomicOperation) {
      return createTaskAtomic(params);
    }

    // 否则使用原有流程
    // Stage 4.9.x: 使用自定义 signer 或默认 signer
    const activeSigner = params.customSigner || signer;
    const activeProvider = params.customSigner?.provider || provider;
    
    if (!activeSigner || !activeProvider) {
      setError('Wallet not connected');
      return null;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);
    setStep('');

    try {
      const address = await activeSigner.getAddress();

      // 1. 验证输入
      setStep('Validating input...');

      if (!params.title.trim()) {
        throw new Error('Title is required');
      }
      if (!params.description.trim()) {
        throw new Error('Description is required');
      }
      if (!params.contactsPlaintext.trim()) {
        throw new Error('Contacts is required');
      }

      const rewardNum = parseFloat(params.reward);
      if (isNaN(rewardNum) || rewardNum <= 0) {
        throw new Error('Reward must be a positive number');
      }

      // 冻结点 1.2-10：MAX_REWARD 校验
      if (rewardNum > MAX_REWARD) {
        throw new Error(`Reward cannot exceed ${MAX_REWARD} ECHO`);
      }

      const rewardWei = ethers.parseUnits(params.reward, 18);
      const postFeeWei = ethers.parseUnits("10", 18); // TASK_POST_FEE constant
      const totalRequired = rewardWei + postFeeWei;

      // 2. 检查余额（冻结点 1.3-14）- 需要 reward + postFee
      setStep('Checking balance...');
      const hasBalance = await checkBalance(address, totalRequired);
      if (!hasBalance) {
        throw new Error(`Insufficient balance. You need at least ${ethers.formatEther(totalRequired)} ECHO (${params.reward} reward + 10 postFee)`);
      }

      // 3. 授权合约转移 ECHO（冻结点 1.3-14）- 授权 totalRequired
      setStep('Approving token transfer...');
      const addresses = getContractAddresses(chainId!);
      const tokenContract = new ethers.Contract(
        addresses.echoToken,
        EOCHOTokenABI.abi,
        activeSigner
      );
      
      const approveTx = await tokenContract.approve(addresses.taskEscrow, totalRequired);
      console.log('Approve transaction sent:', approveTx.hash);
      await approveTx.wait();
      console.log('Approve transaction confirmed');

      // 4. 调用链上 createTask（Chain-first: 先链上成功）
      setStep('Creating task on blockchain...');
      const contract = new ethers.Contract(
        addresses.taskEscrow,
        TaskEscrowABI.abi,
        activeSigner
      );
      
      // 生成临时taskURI（链上需要，但后续会被后端覆盖）
      const tempTaskURI = `temp-task-${Date.now()}`;
      
      // 选择合适的创建函数
      let tx;
      if (params.rewardAsset && params.rewardAmount && params.rewardAsset !== ethers.ZeroAddress) {
        // 使用 createTaskWithReward 支持跨链占位
        const rewardAmountWei = ethers.parseUnits(params.rewardAmount, 18);
        tx = await contract.createTaskWithReward(rewardWei, tempTaskURI, params.rewardAsset, rewardAmountWei);
        console.log('Creating task with cross-chain reward placeholder:', {
          reward: params.reward,
          rewardAsset: params.rewardAsset,
          rewardAmount: params.rewardAmount
        });
      } else {
        // 使用标准 createTask
        tx = await contract.createTask(rewardWei, tempTaskURI);
        console.log('Creating standard task with ECHO reward only');
      }
      
      setTxHash(tx.hash);
      console.log('🚀 Transaction sent:', tx.hash);

      setStep('Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);

      // 5. P0 Fix: 解析真实 taskId 从交易回执
      setStep('Parsing task ID from receipt...');
      const taskId = await parseTaskIdFromReceipt(receipt, contract);
      console.log('📋 Parsed taskId:', taskId);

      // 6. P0 Fix: 调用新的后端 metadata 端点，失败时使用重试队列
      setStep('Saving task metadata...');
      try {
        await writeTaskMetadata(taskId, {
          title: params.title,
          description: params.description,
          contactsPlaintext: params.contactsPlaintext,
          category: params.category,
          createdAt: Date.now()
        }, address, false); // 先尝试直接写入
      } catch (metadataError) {
        console.warn('Direct metadata write failed, using retry queue:', metadataError);
        // 使用重试队列作为备选方案
        await writeTaskMetadata(taskId, {
          title: params.title,
          description: params.description,
          contactsPlaintext: params.contactsPlaintext,
          category: params.category,
          createdAt: Date.now()
        }, address, true); // 使用重试队列
        
        setStep('Task created! Metadata will be saved in background...');
      }

      setStep('Task created successfully!');
      return tx.hash;
    } catch (err) {
      console.error('Failed to create task:', err);
      const errorMessage = parseContractError(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createTask,
    loading,
    error,
    txHash,
    step,
    MAX_REWARD,
  };
}
