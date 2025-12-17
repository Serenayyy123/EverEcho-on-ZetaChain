import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers, Contract } from 'ethers';
import { getContractAddresses } from '../contracts/addresses';
import TaskEscrowABI from '../contracts/TaskEscrow.json';
import { Task, TaskStatus } from '../types/task';
import { apiClient } from '../api/client';

/**
 * 任务历史 Hook
 * 冻结点 2.3-P0-F3：任务历史来自链上 TaskEscrow
 * P0 Fix: 区块链优先数据加载，防止显示 orphan metadata
 */

export interface TaskHistoryFilters {
  role: 'creator' | 'helper';
  address: string;
}

export function useTaskHistory(
  provider: ethers.Provider | null,
  filters: TaskHistoryFilters | null,
  chainId?: number | null
) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 稳定 filters 对象引用，避免无限循环
  const stableFilters = useMemo(() => filters, [
    filters?.role,
    filters?.address
  ]);

  /**
   * P0 Fix: 区块链优先加载单个任务 metadata
   * 复用 useTasks.ts 中已验证的优化策略
   */
  const fetchMetadata = useCallback(async (taskId: number, taskData: any) => {
    try {
      const metadata = await apiClient.getTask(taskId.toString());
      console.log(`[useTaskHistory] ✅ Loaded metadata for task ${taskId}:`, {
        title: metadata?.title,
        category: metadata?.category,
      });
      return { metadata, metadataError: false };
    } catch (err) {
      console.warn(`[useTaskHistory] ⚠️ Failed to load metadata for task ${taskId}, using placeholder:`, err);
      
      // P0 Fix: 提供占位符 metadata
      const placeholderMetadata = {
        taskId: taskId.toString(),
        title: `Task #${taskId}`,
        description: 'Metadata loading failed. This task exists on blockchain but metadata is unavailable.',
        contactsEncryptedPayload: '',
        createdAt: taskData.createdAt.toString(),
        creatorAddress: taskData.creator,
        category: 'unknown'
      };
      
      return { metadata: placeholderMetadata, metadataError: true };
    }
  }, []);

  /**
   * 加载任务历史
   */
  const loadTaskHistory = useCallback(async () => {
    if (!provider || !stableFilters || !chainId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const addresses = getContractAddresses(chainId);
      const contract = new Contract(
        addresses.taskEscrow,
        TaskEscrowABI.abi,
        provider
      );

      console.log('[useTaskHistory] 🔗 Loading task history from blockchain (chain-first approach)...');

      // P0 Fix: 区块链优先 - 获取任务总数
      const taskCounter = await contract.taskCounter();
      const count = Number(taskCounter);
      console.log(`[useTaskHistory] Found ${taskCounter} tasks on blockchain`);

      // 读取所有任务并筛选
      const taskPromises: Promise<Task | null>[] = [];

      for (let i = 1; i <= count; i++) {
        taskPromises.push(
          (async () => {
            try {
              const taskData = await contract.tasks(i);

              // 根据角色筛选
              const isMatch =
                stableFilters.role === 'creator'
                  ? taskData.creator.toLowerCase() === stableFilters.address.toLowerCase()
                  : taskData.helper.toLowerCase() === stableFilters.address.toLowerCase();

              if (!isMatch) return null;

              // P0 Fix: 验证任务是否真实存在（creator 不为零地址）
              if (taskData.creator === ethers.ZeroAddress) {
                console.warn(`[useTaskHistory] ⚠️ Task ${i} has zero creator address, skipping`);
                return null;
              }

              console.log(`[useTaskHistory] 📋 Task ${i} exists on blockchain, loading metadata...`);

              // P0 Fix: 尝试加载 metadata，如果失败则使用占位符
              const { metadata, metadataError } = await fetchMetadata(i, taskData);

              const task: Task = {
                taskId: taskData.taskId.toString(),
                creator: taskData.creator,
                helper: taskData.helper,
                reward: ethers.formatEther(taskData.reward),
                taskURI: taskData.taskURI,
                status: Number(taskData.status) as TaskStatus,
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

              return task;
            } catch (err) {
              console.error(`Failed to load task ${i}:`, err);
              return null;
            }
          })()
        );
      }

      const loadedTasks = await Promise.all(taskPromises);
      const filteredTasks = loadedTasks.filter((t): t is Task => t !== null);

      // 按创建时间倒序排列
      filteredTasks.sort((a, b) => b.createdAt - a.createdAt);

      console.log(`[useTaskHistory] ✅ Loaded ${filteredTasks.length} valid tasks from blockchain for ${stableFilters.role}`);
      setTasks(filteredTasks);
    } catch (err) {
      console.error('[useTaskHistory] ❌ Load task history failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load task history');
    } finally {
      setLoading(false);
    }
  }, [provider, stableFilters, chainId, fetchMetadata]);

  useEffect(() => {
    loadTaskHistory();
  }, [loadTaskHistory]);

  return {
    tasks,
    loading,
    error,
    reload: loadTaskHistory,
  };
}
