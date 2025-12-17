// Stage 4.9.x - useZetaRead: 基于 ZetaReadProvider 的稳定读取 Hook
// 不受钱包网络切换影响，永远从 ZetaChain 读取数据

import { useState, useEffect } from 'react';
import { Contract } from 'ethers';
import { getZetaContractsReadOnly, zetaReadProvider } from '../services/zetaReadProvider';

// 使用 ZetaReadProvider 获取合约实例
export function useZetaContracts() {
  const [contracts, setContracts] = useState<{
    taskEscrow: Contract | null;
    gateway: Contract | null;
    universalReward: Contract | null;
    provider: any;
  }>({
    taskEscrow: null,
    gateway: null,
    universalReward: null,
    provider: null
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeContracts = async () => {
      try {
        setLoading(true);
        setError(null);

        // 检查 ZetaChain 连接
        const connected = await zetaReadProvider.checkConnection();
        if (!connected) {
          throw new Error('Failed to connect to ZetaChain');
        }

        // 获取只读合约实例
        const zetaContracts = getZetaContractsReadOnly();
        setContracts(zetaContracts);

        console.log('[useZetaContracts] Contracts initialized successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useZetaContracts] Failed to initialize contracts:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initializeContracts();
  }, []);

  return { contracts, loading, error };
}

// 获取 ZetaChain 网络状态
export function useZetaNetworkStatus() {
  const [status, setStatus] = useState<{
    connected: boolean;
    chainId: number;
    name: string;
    blockNumber?: number;
  }>({
    connected: false,
    chainId: 7001,
    name: 'ZetaChain Athens'
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true);
        
        const networkInfo = await zetaReadProvider.getNetworkInfo();
        const connected = await zetaReadProvider.checkConnection();
        
        let blockNumber;
        if (connected) {
          try {
            blockNumber = await zetaReadProvider.getProvider().getBlockNumber();
          } catch (err) {
            console.warn('[useZetaNetworkStatus] Failed to get block number:', err);
          }
        }

        setStatus({
          connected,
          chainId: networkInfo.chainId,
          name: networkInfo.name,
          blockNumber
        });

        console.log('[useZetaNetworkStatus] Status updated:', { connected, chainId: networkInfo.chainId, blockNumber });
      } catch (err) {
        console.error('[useZetaNetworkStatus] Failed to check status:', err);
        setStatus(prev => ({ ...prev, connected: false }));
      } finally {
        setLoading(false);
      }
    };

    checkStatus();

    // 定期检查连接状态
    const interval = setInterval(checkStatus, 30000); // 30秒检查一次
    return () => clearInterval(interval);
  }, []);

  return { status, loading };
}

// 读取任务数据（使用 ZetaReadProvider）
export function useZetaTaskRead(taskId: string | number) {
  const { contracts } = useZetaContracts();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      if (!contracts.taskEscrow || !taskId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log(`[useZetaTaskRead] Fetching task ${taskId} from ZetaChain...`);
        const taskData = await contracts.taskEscrow.getTask(taskId);
        
        setTask(taskData);
        console.log(`[useZetaTaskRead] Task ${taskId} fetched successfully`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[useZetaTaskRead] Failed to fetch task ${taskId}:`, errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [contracts.taskEscrow, taskId]);

  return { task, loading, error };
}

// 读取跨链奖励状态（使用 ZetaReadProvider）
export function useZetaCrossChainRewardRead(rewardId: string) {
  const { contracts } = useZetaContracts();
  const [reward, setReward] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReward = async () => {
      if (!contracts.universalReward || !rewardId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log(`[useZetaCrossChainRewardRead] Fetching reward ${rewardId} from ZetaChain...`);
        const rewardData = await contracts.universalReward.getRewardPlan(rewardId);
        
        setReward(rewardData);
        console.log(`[useZetaCrossChainRewardRead] Reward ${rewardId} fetched successfully`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[useZetaCrossChainRewardRead] Failed to fetch reward ${rewardId}:`, errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchReward();
  }, [contracts.universalReward, rewardId]);

  return { reward, loading, error };
}