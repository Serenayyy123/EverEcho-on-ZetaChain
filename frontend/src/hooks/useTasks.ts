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
  metadata?: TaskData;
  metadataError?: boolean; // 元数据加载失败标记
}

/**
 * 真实任务列表 Hook
 * 使用合约事件 + 轮询
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

      // 获取 taskCounter
      const taskCounter = await contract.taskCounter();
      const taskPromises: Promise<Task | null>[] = [];

      for (let i = 1; i <= Number(taskCounter); i++) {
        taskPromises.push(loadSingleTask(contract, i));
      }

      const loadedTasks = (await Promise.all(taskPromises)).filter((t): t is Task => t !== null);
      setTasks(loadedTasks);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Load tasks failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      setLoading(false);
    }
  };

  const loadSingleTask = async (
    contract: ethers.Contract,
    taskId: number
  ): Promise<Task | null> => {
    try {
      const taskData = await contract.tasks(taskId);
      
      // 加载元数据：统一使用 taskId（不使用 taskURI）
      // 修复：确保 metadata 与 taskId 一一对应，避免缓存/绑定错误
      let metadata: TaskData | undefined;
      let metadataError = false;
      try {
        console.log(`[useTasks] Loading metadata for taskId=${taskId}, taskURI=${taskData.taskURI}`);
        metadata = await apiClient.getTask(taskId.toString());
        console.log(`[useTasks] Loaded metadata for taskId=${taskId}:`, {
          title: metadata?.title,
          category: metadata?.category,
        });
      } catch (err) {
        console.warn(`Failed to load metadata for task ${taskId}:`, err);
        metadataError = true; // 标记元数据加载失败
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
        metadata,
        metadataError,
      };
    } catch (err) {
      console.error(`Failed to load task ${taskId}:`, err);
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
 * 真实单个任务 Hook
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

      const taskData = await contract.tasks(taskId);
      
      // 加载元数据：统一使用 taskId（不使用 taskURI）
      // 修复：确保 metadata 与 taskId 一一对应，避免缓存/绑定错误
      let metadata: TaskData | undefined;
      let metadataError = false;
      try {
        console.log(`[useTask] Loading metadata for taskId=${taskId}, taskURI=${taskData.taskURI}`);
        metadata = await apiClient.getTask(taskId.toString());
        console.log(`[useTask] Loaded metadata for taskId=${taskId}:`, {
          title: metadata?.title,
          category: metadata?.category,
        });
      } catch (err) {
        console.warn(`Failed to load metadata for task ${taskId}:`, err);
        metadataError = true; // 标记元数据加载失败
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
        metadata,
        metadataError,
      });
      
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Load task failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load task');
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
