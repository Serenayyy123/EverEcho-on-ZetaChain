import { useState } from 'react';
import { ethers } from 'ethers';
import { uploadTask, type TaskData } from '../utils/api';
import { TASK_ESCROW_ADDRESS, EOCHO_TOKEN_ADDRESS } from '../contracts/addresses';
import TaskEscrowABI from '../contracts/TaskEscrow.json';
import EOCHOTokenABI from '../contracts/EOCHOToken.json';

/**
 * 创建任务 Hook
 * 冻结点 2.2-P0-F4：先链下后链上
 * 冻结点 1.3-14：双向抵押前置检查
 */

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
  reward: string; // ECHO 单位
  category?: string; // 任务分类（可选）
}

export function useCreateTask(
  signer: ethers.Signer | null,
  provider: ethers.Provider | null
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [step, setStep] = useState<string>('');

  /**
   * 检查余额是否充足
   */
  const checkBalance = async (address: string, rewardWei: bigint): Promise<boolean> => {
    if (!provider) return false;

    try {
      const tokenContract = new ethers.Contract(
        EOCHO_TOKEN_ADDRESS,
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
   * 创建任务
   * 冻结点 2.2-P0-F4：流程固定（先链下再链上）
   */
  const createTask = async (params: CreateTaskParams): Promise<string | null> => {
    if (!signer || !provider) {
      setError('Wallet not connected');
      return null;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);
    setStep('');

    try {
      const address = await signer.getAddress();

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

      // 2. 检查余额（冻结点 1.3-14）
      setStep('Checking balance...');
      const hasBalance = await checkBalance(address, rewardWei);
      if (!hasBalance) {
        throw new Error(`Insufficient balance. You need at least ${params.reward} ECHO`);
      }

      // 3. 获取下一个 taskId（从合约读取 taskCounter）
      setStep('Preparing task...');
      const contract = new ethers.Contract(
        TASK_ESCROW_ADDRESS,
        TaskEscrowABI.abi,
        signer
      );
      const taskCounter = await contract.taskCounter();
      const nextTaskId = (Number(taskCounter) + 1).toString();
      console.log('Chain taskCounter:', taskCounter.toString());
      console.log('Next taskId:', nextTaskId);
      
      // 防御性检查：确保 nextTaskId 在链上不存在
      try {
        const existingTask = await contract.tasks(nextTaskId);
        // tasks() 返回一个 tuple，creator 是第二个元素
        if (existingTask[1] !== ethers.ZeroAddress) {
          throw new Error(
            `Task ${nextTaskId} already exists on chain. ` +
            `This should not happen. Please refresh and try again.`
          );
        }
      } catch (err: any) {
        // 如果读取失败（任务不存在），这是正常的，继续
        if (!err.message?.includes('already exists')) {
          console.log(`Task ${nextTaskId} does not exist yet (expected)`);
        } else {
          throw err;
        }
      }

      // 4. 授权合约转移 ECHO（冻结点 1.3-14）
      setStep('Approving token transfer...');
      const tokenContract = new ethers.Contract(
        EOCHO_TOKEN_ADDRESS,
        EOCHOTokenABI.abi,
        signer
      );
      
      const approveTx = await tokenContract.approve(TASK_ESCROW_ADDRESS, rewardWei);
      console.log('Approve transaction sent:', approveTx.hash);
      await approveTx.wait();
      console.log('Approve transaction confirmed');

      // 5. 上传任务元数据到 backend（冻结点 2.2-P0-F4）
      // 强化重试：POST 必须成功才能继续链上创建
      setStep('Uploading task metadata...');
      const taskData: TaskData = {
        taskId: nextTaskId,
        title: params.title,
        description: params.description,
        contactsEncryptedPayload: params.contactsPlaintext, // 传递明文，后端负责加密
        createdAt: Math.floor(Date.now() / 1000),
        creatorAddress: address, // Creator 地址（后端需要）
        category: params.category, // 任务分类（可选）
      };

      let taskURI: string;
      const maxRetries = 5; // 增加到 5 次
      let lastError: Error | null = null;
      
      // 指数退避重试
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // 1s, 2s, 4s, 8s, 10s
            console.log(`Retry attempt ${attempt}/${maxRetries} after ${backoffMs}ms...`);
            setStep(`Retrying upload (${attempt}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
          
          taskURI = await uploadTask(taskData);
          console.log('Task metadata uploaded successfully, taskURI:', taskURI);
          lastError = null;
          break; // 成功，跳出循环
        } catch (uploadError) {
          lastError = uploadError instanceof Error ? uploadError : new Error('Upload failed');
          console.error(`Upload attempt ${attempt + 1} failed:`, uploadError);
          
          if (attempt === maxRetries - 1) {
            // 最后一次重试也失败，阻止链上创建
            throw new Error(
              `Failed to upload task metadata after ${maxRetries} attempts. ` +
              `Please check your network connection and try again. ` +
              `Error: ${lastError.message}`
            );
          }
        }
      }

      // 6. 调用链上 createTask（只有 POST 成功才会执行到这里）
      setStep('Creating task on blockchain...');
      const tx = await contract.createTask(rewardWei, taskURI!);
      setTxHash(tx.hash);
      console.log('Transaction sent:', tx.hash);

      setStep('Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      setStep('Task created successfully!');
      return tx.hash;
    } catch (err) {
      console.error('Failed to create task:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
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
