import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers, Contract } from 'ethers';
import { TASK_ESCROW_ADDRESS } from '../contracts/addresses';
import TaskEscrowABI from '../contracts/TaskEscrow.json';
import { Task, TaskStatus } from '../types/task';
import { apiClient } from '../api/client';

/**
 * 任务历史 Hook
 * 冻结点 2.3-P0-F3：任务历史来自链上 TaskEscrow
 */

export interface TaskHistoryFilters {
  role: 'creator' | 'helper';
  address: string;
}

export function useTaskHistory(
  provider: ethers.Provider | null,
  filters: TaskHistoryFilters | null
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
   * 从 taskURI 获取元数据
   */
  const fetchMetadata = useCallback(async (taskURI: string) => {
    try {
      return await apiClient.getTask(taskURI);
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      return undefined;
    }
  }, []);

  /**
   * 加载任务历史
   */
  const loadTaskHistory = useCallback(async () => {
    if (!provider || !stableFilters) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const contract = new Contract(
        TASK_ESCROW_ADDRESS,
        TaskEscrowABI.abi,
        provider
      );

      // 获取任务总数
      const taskCounter = await contract.taskCounter();
      const count = Number(taskCounter);

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
              };

              // 获取链下元数据
              const metadata = await fetchMetadata(taskData.taskURI);
              if (metadata) {
                task.metadata = metadata;
              }

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

      setTasks(filteredTasks);
    } catch (err) {
      console.error('Failed to load task history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load task history');
    } finally {
      setLoading(false);
    }
  }, [provider, stableFilters, fetchMetadata]);

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
