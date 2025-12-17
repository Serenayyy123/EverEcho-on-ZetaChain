// Stage 4.9.x - NetworkStatusIndicator: 双状态网络提示组件
// 显示系统链（ZetaChain）和钱包链状态，轻量级提示

import React, { useState, useEffect } from 'react';
import NetworkGuard from '../../services/networkGuard';
import { zetaReadProvider } from '../../services/zetaReadProvider';
import { SelectedAsset } from '../../stores/crossChainDraftStore';

interface NetworkStatusIndicatorProps {
  currentAction?: 'deposit' | 'publish';
  selectedAsset?: SelectedAsset;
  depositStatus?: 'idle' | 'switching' | 'depositing' | 'deposited' | 'failed';
  publishStep?: 'idle' | 'switching' | 'publishing';
  className?: string;
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  currentAction: _currentAction,
  selectedAsset: _selectedAsset,
  depositStatus,
  publishStep,
  className = ''
}) => {
  const [systemStatus, setSystemStatus] = useState<{
    connected: boolean;
    chainId: number;
    name: string;
  }>({
    connected: false,
    chainId: 7001,
    name: 'ZetaChain Athens'
  });

  const [walletStatus, setWalletStatus] = useState<{
    chainId: string | null;
    name: string;
  }>({
    chainId: null,
    name: 'Unknown'
  });

  const [networkMode, setNetworkMode] = useState<string>('idle');

  // 获取系统网络状态（ZetaChain）
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const networkInfo = await zetaReadProvider.getNetworkInfo();
        setSystemStatus(networkInfo);
      } catch (error) {
        console.error('[NetworkStatusIndicator] Failed to get system status:', error);
      }
    };

    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 10000); // 10秒检查一次
    return () => clearInterval(interval);
  }, []);

  // 获取钱包网络状态
  useEffect(() => {
    const checkWalletStatus = async () => {
      try {
        const networkGuard = NetworkGuard.getInstance();
        const walletChainId = await networkGuard.getWalletChainId();
        const walletName = networkGuard.getNetworkNameByChainId(walletChainId);
        const mode = networkGuard.getMode();

        setWalletStatus({
          chainId: walletChainId,
          name: walletName
        });
        setNetworkMode(mode);
      } catch (error) {
        console.error('[NetworkStatusIndicator] Failed to get wallet status:', error);
      }
    };

    checkWalletStatus();
    
    // 监听网络变化
    if (window.ethereum) {
      const handleChainChanged = () => {
        setTimeout(checkWalletStatus, 100); // 延迟一点确保状态更新
      };
      
      window.ethereum.on('chainChanged', handleChainChanged);
      return () => {
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [depositStatus, publishStep]);

  // 获取状态提示信息
  const getStatusInfo = () => {
    if (networkMode === 'depositReady') {
      return {
        icon: '✅',
        text: '跨链奖励已存入',
        hint: '发布任务时将自动切回 ZetaChain，无需手动操作'
      };
    }
    
    if (depositStatus === 'switching' || publishStep === 'switching') {
      return {
        icon: '🔄',
        text: publishStep === 'switching' ? '切换到 ZetaChain...' : '切换网络中...',
        hint: null
      };
    }
    
    if (depositStatus === 'depositing' || publishStep === 'publishing') {
      return {
        icon: '⏳',
        text: publishStep === 'publishing' ? '发布中...' : '存入中...',
        hint: null
      };
    }
    
    if (depositStatus === 'deposited') {
      return {
        icon: '✅',
        text: '跨链奖励已存入',
        hint: '发布任务时将自动切回 ZetaChain'
      };
    }
    
    return null;
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={className} style={{
      background: '#f8f9fa',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      padding: '12px',
      margin: '8px 0',
      fontSize: '14px'
    }}>
      {/* 双状态网络显示 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#6c757d', fontWeight: 500 }}>系统网络（读）:</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>
            {systemStatus.name} {systemStatus.connected ? '✅' : '❌'}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#6c757d', fontWeight: 500 }}>钱包网络（写）:</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>
            {walletStatus.name}
          </span>
        </div>
      </div>

      {/* 状态提示 */}
      {statusInfo && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '8px',
          padding: '8px',
          background: '#e3f2fd',
          borderRadius: '4px'
        }}>
          <span style={{ fontSize: '16px' }}>{statusInfo.icon}</span>
          <span style={{ color: '#1976d2', fontWeight: 500 }}>{statusInfo.text}</span>
        </div>
      )}

      {/* 成功提示 */}
      {statusInfo?.hint && (
        <div className="success-message">
          <div className="hint-text">
            {statusInfo.hint}
          </div>
        </div>
      )}


    </div>
  );
};

export default NetworkStatusIndicator;