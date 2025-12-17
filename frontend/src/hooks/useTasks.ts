import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { apiClient, TaskData } from '../api/client';
import { getContractAddresses, SUPPORTED_CHAIN_IDS } from '../contracts/addresses';
import TaskEscrowABI from '../contracts/TaskEscrow.json';

/**
 * 冻结点 1.2-10：MAX_REWARD 硬限制
 * 前端软提示允许，链上硬限制在合约层
 */
export const MAX_REWARD = 1000;

export enum TaskStatus {
  Open = 0,
  InProgress = 1,
  Submitted = 2,
  Completed = 3,
  Cancelled = 4,
}

export interface Task {
  taskId: number;
  creator: string;
  helper: string;
  reward: string;
  taskURI: string;
  status: TaskStatus;
  createdAt: number;
  acceptedAt: number;
  submittedAt: number;
  terminateRequestedBy: string;
  terminateRequestedAt: number;
  fixRequested: boolean;
  fixRequestedAt: number;
  // Stage 4: 新增跨链字段
  echoPostFee: string;
  rewardAsset: string;
  rewardAmount: string;
  metadata?: TaskData;
  metadataError?: boolean; // 元数据加载失败标记
}

/**
 * 区块链优先任务列表 Hook
 * P0 Fix: 以区块链为主要数据源，防止显示 orphan metadata
 */
export function useTasks(provider: ethers.Provider | null, chainId: number | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (provider && chainId) {
      loadTasks();
      
      // 轮询
      const interval = setInterval(loadTasks, 5000);
      return () => clearInterval(interval);
    } else {
      // 清空任务列表当 provider 为 null 时（断开钱包）
      setTasks([]);
      setLoading(false);
      setError(null);
    }
  }, [provider, chainId]);

  const loadTasks = async () => {
    if (!provider || !chainId) return;

    try {
      const addresses = getContractAddresses(chainId);
      const contract = new ethers.Contract(
        addresses.taskEscrow,
        TaskEscrowABI.abi,
        provider
      );

      console.log('[useTasks] 🔗 Loading tasks from blockchain (chain-first approach)...');

      // P0 Fix: 区块链优先 - 获取 taskCounter
      const taskCounter = await contract.taskCounter();
      console.log(`[useTasks] Found ${taskCounter} tasks on blockchain`);

      const taskPromises: Promise<Task | null>[] = [];

      // P0 Fix: 只处理区块链上存在的任务
      for (let i = 1; i <= Number(taskCounter); i++) {
        taskPromises.push(loadSingleTaskBlockchainFirst(contract, i));
      }

      const loadedTasks = (await Promise.all(taskPromises)).filter((t): t is Task => t !== null);
      
      console.log(`[useTasks] ✅ Loaded ${loadedTasks.length} valid tasks from blockchain`);
      setTasks(loadedTasks);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('[useTasks] ❌ Load tasks failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      setLoading(false);
    }
  };

  /**
   * P0 Fix: 区块链优先加载单个任务
   * 只有区块链上存在的任务才会被返回
   */
  const loadSingleTaskBlockchainFirst = async (
    contract: ethers.Contract,
    taskId: number
  ): Promise<Task | null> => {
    try {
      // P0 Fix: 首先从区块链读取任务数据
      const taskData = await contract.tasks(taskId);
      
      // P0 Fix: 验证任务是否真实存在（creator 不为零地址）
      if (taskData.creator === ethers.ZeroAddress) {
        console.warn(`[useTasks] ⚠️ Task ${taskId} has zero creator address, skipping`);
        return null;
      }

      console.log(`[useTasks] 📋 Task ${taskId} exists on blockchain, loading metadata...`);
      
      // P0 Fix: 尝试加载 metadata，如果失败则使用占位符
      let metadata: TaskData | undefined;
      let metadataError = false;
      
      try {
        metadata = await apiClient.getTask(taskId.toString());
        console.log(`[useTasks] ✅ Loaded metadata for task ${taskId}:`, {
          title: metadata?.title,
          category: metadata?.category,
        });
      } catch (err) {
        console.warn(`[useTasks] ⚠️ Failed to load metadata for task ${taskId}, using placeholder:`, err);
        metadataError = true;
        
        // P0 Fix: 提供占位符 metadata
        metadata = {
          taskId: taskId.toString(),
          title: `Task #${taskId}`,
          description: 'Metadata loading failed. This task exists on blockchain but metadata is unavailable.',
          contactsEncryptedPayload: '',
          createdAt: taskData.createdAt.toString(),
          creator: taskData.creator,
          category: 'unknown'
        };
      }

      return {
        taskId,
        creator: taskData.creator,
        helper: taskData.helper,
        reward: ethers.formatEther(taskData.reward),
        taskURI: taskData.taskURI,
        status: Number(taskData.status),
        createdAt: Number(taskData.createdAt),
        acceptedAt: Number(taskData.acceptedAt),
        submittedAt: Number(taskData.submittedAt),
        terminateRequestedBy: taskData.terminateRequestedBy,
        terminateRequestedAt: Number(taskData.terminateRequestedAt),
        fixRequested: taskData.fixRequested,
        fixRequestedAt: Number(taskData.fixRequestedAt),
        // Stage 4: 新增跨链字段
        echoPostFee: ethers.formatEther(taskData.echoPostFee),
        rewardAsset: taskData.rewardAsset,
        rewardAmount: ethers.formatEther(taskData.rewardAmount),
        metadata,
        metadataError,
      };
    } catch (err) {
      console.error(`[useTasks] ❌ Failed to load task ${taskId} from blockchain:`, err);
      return null;
    }
  };

  const refresh = () => {
    loadTasks();
  };

  return {
    tasks,
    loading,
    error,
    refresh,
  };
}

/**
 * 区块链优先单个任务 Hook
 * P0 Fix: 以区块链为主要数据源，提供清晰的错误处理
 */
export function useTask(
  taskId: number,
  provider: ethers.Provider | null,
  chainId: number | null
) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (provider && chainId && taskId) {
      loadTask();
      
      // 轮询
      const interval = setInterval(loadTask, 3000);
      return () => clearInterval(interval);
    }
  }, [taskId, provider, chainId]);

  const loadTask = async () => {
    if (!provider || !chainId) return;

    try {
      const addresses = getContractAddresses(chainId);
      const contract = new ethers.Contract(
        addresses.taskEscrow,
        TaskEscrowABI.abi,
        provider
      );

      console.log(`[useTask] 🔗 Loading task ${taskId} from blockchain...`);
      const taskData = await contract.tasks(taskId);
      
      // P0 Fix: 验证任务是否真实存在
      if (taskData.creator === ethers.ZeroAddress) {
        console.warn(`[useTask] ❌ Task ${taskId} not found on blockchain (creator is zero address)`);
        setError('Task not found on blockchain. This task may have failed to create or been cancelled.');
        setTask(null);
        setLoading(false);
        return;
      }

      console.log(`[useTask] ✅ Task ${taskId} exists on blockchain, loading metadata...`);
      
      // P0 Fix: 尝试加载 metadata，如果失败则使用占位符
      let metadata: TaskData | undefined;
      let metadataError = false;
      
      try {
        metadata = await apiClient.getTask(taskId.toString());
        console.log(`[useTask] ✅ Loaded metadata for task ${taskId}:`, {
          title: metadata?.title,
          category: metadata?.category,
        });
      } catch (err) {
        console.warn(`[useTask] ⚠️ Failed to load metadata for task ${taskId}, using placeholder:`, err);
        metadataError = true;
        
        // P0 Fix: 提供占位符 metadata
        metadata = {
          taskId: taskId.toString(),
          title: `Task #${taskId}`,
          description: 'Metadata loading failed. This task exists on blockchain but metadata is unavailable.',
          contactsEncryptedPayload: '',
          createdAt: taskData.createdAt.toString(),
          creator: taskData.creator,
          category: 'unknown'
        };
      }

      setTask({
        taskId,
        creator: taskData.creator,
        helper: taskData.helper,
        reward: ethers.formatEther(taskData.reward),
        taskURI: taskData.taskURI,
        status: Number(taskData.status),
        createdAt: Number(taskData.createdAt),
        acceptedAt: Number(taskData.acceptedAt),
        submittedAt: Number(taskData.submittedAt),
        terminateRequestedBy: taskData.terminateRequestedBy,
        terminateRequestedAt: Number(taskData.terminateRequestedAt),
        fixRequested: taskData.fixRequested,
        fixRequestedAt: Number(taskData.fixRequestedAt),
        // Stage 4: 新增跨链字段
        echoPostFee: ethers.formatEther(taskData.echoPostFee),
        rewardAsset: taskData.rewardAsset,
        rewardAmount: ethers.formatEther(taskData.rewardAmount),
        metadata,
        metadataError,
      });
      
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error(`[useTask] ❌ Load task ${taskId} failed:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load task');
      setTask(null);
      setLoading(false);
    }
  };

  const refresh = () => {
    loadTask();
  };

  return {
    task,
    loading,
    error,
    refresh,
  };
}

/**
 * 真实创建任务 Hook
 */
export function useCreateTask(
  signer: ethers.Signer | null,
  chainId: number | null,
  balance: string,
  onSuccess?: (taskId: number) => void
) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const createTask = async (reward: string, taskData: TaskData) => {
    if (!signer || !chainId) {
      setError('Wallet not connected');
      return null;
    }

    // chainId guard: 检查是否在支持的网络上
    if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
      setError('Wrong network. Please switch to Sepolia or Hardhat Local.');
      console.error(`createTask blocked: unsupported chainId ${chainId}`);
      return null;
    }

    setIsCreating(true);
    setError(null);
    setTxHash(null);

    try {
      // 预检查余额
      const rewardNum = parseFloat(reward);
      const balanceNum = parseFloat(balance);
      
      if (rewardNum > balanceNum) {
        throw new Error('Insufficient balance');
      }

      if (rewardNum <= 0 || rewardNum > 1000) {
        throw new Error('Reward must be between 0 and 1000 ECHO');
      }

      // Step 1: 上传 task 到后端
      console.log('Uploading task to backend...');
      const { taskURI } = await apiClient.createTask(taskData);
      console.log('Task URI:', taskURI);

      // Step 2: 调用 TaskEscrow 合约
      const addresses = getContractAddresses(chainId);
      const contract = new ethers.Contract(
        addresses.taskEscrow,
        TaskEscrowABI.abi,
        signer
      );

      const rewardWei = ethers.parseEther(reward);
      
      console.log('Calling createTask contract...');
      const tx = await contract.createTask(rewardWei, taskURI);
      setTxHash(tx.hash);
      console.log('Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);

      // 从事件中获取 taskId
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'TaskCreated';
        } catch {
          return false;
        }
      });

      let taskId = 0;
      if (event) {
        const parsed = contract.interface.parseLog(event);
        taskId = Number(parsed?.args[0]);
      }

      setIsCreating(false);
      
      if (onSuccess && taskId) {
        onSuccess(taskId);
      }

      return taskId;
    } catch (err: any) {
      console.error('Create task failed:', err);
      
      let errorMessage = 'Failed to create task';
      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsCreating(false);
      return null;
    }
  };

  return {
    createTask,
    isCreating,
    error,
    txHash,
  };
}
