import { useState, useEffect, useCallback } from 'react';
import { ethers, Contract } from 'ethers';
import { TASK_ESCROW_ADDRESS } from '../contracts/addresses';
import TaskEscrowABI from '../contracts/TaskEscrow.json';

/**
 * Lightweight hook for Profile stats only
 * Counts tasks from chain WITHOUT fetching metadata
 * Does NOT replace useTaskHistory (which is for task lists)
 */

export interface TaskStats {
  createdCount: number;
  helpedCount: number;
}

export function useTaskStats(
  provider: ethers.Provider | null,
  address: string | null
): {
  stats: TaskStats;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
} {
  const [stats, setStats] = useState<TaskStats>({ createdCount: 0, helpedCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!provider || !address) {
      setStats({ createdCount: 0, helpedCount: 0 });
      setLoading(false);
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

      const taskCounter = await contract.taskCounter();
      const count = Number(taskCounter);
      const lowerAddr = address.toLowerCase();

      let created = 0;
      let helped = 0;

      // Single pass over all tasks - count only, no metadata
      for (let i = 1; i <= count; i++) {
        try {
          const taskData = await contract.tasks(i);

          // Count as creator
          if (taskData.creator?.toLowerCase() === lowerAddr) {
            created++;
          }

          // Count as helper (exclude zero address)
          if (
            taskData.helper &&
            taskData.helper !== ethers.ZeroAddress &&
            taskData.helper.toLowerCase() === lowerAddr
          ) {
            helped++;
          }
        } catch (innerErr) {
          console.error(`[useTaskStats] Failed to read task ${i}:`, innerErr);
          // Continue counting other tasks
        }
      }

      setStats({ createdCount: created, helpedCount: helped });
    } catch (err) {
      console.error('[useTaskStats] Failed to load stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      setStats({ createdCount: 0, helpedCount: 0 });
    } finally {
      setLoading(false);
    }
  }, [provider, address]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    reload: loadStats,
  };
}
