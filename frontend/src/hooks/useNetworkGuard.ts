// Stage 4.9 - useNetworkGuard: React Hook封装NetworkGuard
// 提供React组件友好的网络管理接口

import { useState, useEffect, useCallback } from 'react';
import NetworkGuard, { NetworkSwitchResult } from '../services/networkGuard';
import { SelectedAsset } from '../stores/crossChainDraftStore';

interface UseNetworkGuardReturn {
  // 状态
  currentChainId: string | null;
  currentNetworkName: string;
  isInFlight: boolean;
  
  // 方法
  ensureNetworkFor: (action: 'deposit' | 'publish', asset?: SelectedAsset) => Promise<NetworkSwitchResult>;
  refreshSigner: () => Promise<any>;
  getNetworkConfigForAsset: (asset: SelectedAsset) => any;
}

export const useNetworkGuard = (): UseNetworkGuardReturn => {
  const [currentChainId, setCurrentChainId] = useState<string | null>(null);
  const [isInFlight, setIsInFlight] = useState(false);
  
  const networkGuard = NetworkGuard.getInstance();

  // 获取当前网络ID
  const updateCurrentChainId = useCallback(async () => {
    try {
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setCurrentChainId(chainId);
      }
    } catch (error) {
      console.error('Failed to get current chain ID:', error);
    }
  }, []);

  // 监听网络切换事件
  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = (chainId: string) => {
      setCurrentChainId(chainId);
    };

    const handleAccountsChanged = () => {
      // 账户切换时也更新网络信息
      updateCurrentChainId();
    };

    (window.ethereum as any).on('chainChanged', handleChainChanged);
    (window.ethereum as any).on('accountsChanged', handleAccountsChanged);

    // 初始化获取当前网络
    updateCurrentChainId();

    return () => {
      (window.ethereum as any)?.removeListener('chainChanged', handleChainChanged);
      (window.ethereum as any)?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [updateCurrentChainId]);

  // 监听NetworkGuard的飞行状态
  useEffect(() => {
    const checkInFlightStatus = () => {
      setIsInFlight(networkGuard.isInFlight());
    };

    // 定期检查状态（简单实现，生产环境可以用事件）
    const interval = setInterval(checkInFlightStatus, 100);
    
    return () => clearInterval(interval);
  }, [networkGuard]);

  // 确保网络正确
  const ensureNetworkFor = useCallback(async (
    action: 'deposit' | 'publish', 
    asset?: SelectedAsset
  ): Promise<NetworkSwitchResult> => {
    setIsInFlight(true);
    try {
      const result = await networkGuard.ensureNetworkFor(action, asset);
      return result;
    } finally {
      setIsInFlight(false);
    }
  }, [networkGuard]);

  // 刷新signer
  const refreshSigner = useCallback(async () => {
    return await networkGuard.refreshSigner();
  }, [networkGuard]);

  // 获取资产网络配置
  const getNetworkConfigForAsset = useCallback((asset: SelectedAsset) => {
    return networkGuard.getNetworkConfigForAsset(asset);
  }, [networkGuard]);

  // 获取当前网络名称
  const currentNetworkName = currentChainId 
    ? networkGuard.getNetworkNameByChainId(currentChainId)
    : 'Unknown Network';

  return {
    currentChainId,
    currentNetworkName,
    isInFlight,
    ensureNetworkFor,
    refreshSigner,
    getNetworkConfigForAsset
  };
};