import React, { useState, useEffect } from 'react';
import { SUPPORTED_CHAIN_IDS } from '../../contracts/addresses';
import { Alert } from './Alert';
import NetworkGuardService from '../../services/networkGuard';
import { zetaReadProvider } from '../../services/zetaReadProvider';

export interface NetworkGuardProps {
  chainId: number | null;
  children: React.ReactNode;
  // Stage 4.9.x: 新增属性支持跨链模式
  allowCrossChainMode?: boolean;
  expectedNetworks?: string[]; // Currently unused but kept for future extensibility
}

export function NetworkGuard({ 
  chainId, 
  children, 
  allowCrossChainMode = false,
  expectedNetworks: _expectedNetworks
}: NetworkGuardProps) {
  const [systemConnected, setSystemConnected] = useState(true);
  const [shouldTolerate, setShouldTolerate] = useState(false);

  // 检查系统连接状态（ZetaReadProvider）
  useEffect(() => {
    const checkSystemConnection = async () => {
      try {
        const connected = await zetaReadProvider.checkConnection();
        setSystemConnected(connected);
      } catch (error) {
        console.error('[NetworkGuard] System connection check failed:', error);
        setSystemConnected(false);
      }
    };

    checkSystemConnection();
    const interval = setInterval(checkSystemConnection, 30000); // 30秒检查一次
    return () => clearInterval(interval);
  }, []);

  // 检查是否应该容忍当前钱包网络
  useEffect(() => {
    const checkTolerance = async () => {
      try {
        const networkGuard = NetworkGuardService.getInstance();
        const shouldTolerateNetwork = await networkGuard.shouldTolerateWalletNetwork();
        setShouldTolerate(shouldTolerateNetwork);
      } catch (error) {
        console.error('[NetworkGuard] Tolerance check failed:', error);
        setShouldTolerate(false);
      }
    };

    checkTolerance();
    
    // 监听网络变化
    if (window.ethereum) {
      const handleChainChanged = () => {
        setTimeout(checkTolerance, 100);
      };
      
      window.ethereum.on('chainChanged', handleChainChanged);
      return () => {
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [chainId]);

  // 系统连接检查（优先级最高）
  if (!systemConnected) {
    return (
      <Alert variant="error" title="System Connection Failed">
        <p>
          Unable to connect to ZetaChain network. Please check your internet connection.
        </p>
        <p style={{ marginTop: '8px', fontSize: '12px', fontStyle: 'italic' }}>
          System functions may be limited until connection is restored.
        </p>
      </Alert>
    );
  }

  // 钱包连接检查
  if (!chainId) {
    return (
      <Alert variant="warning" title="Network Not Detected">
        Please connect your wallet and select a network.
      </Alert>
    );
  }

  // Stage 4.9.x: 双状态模式 - 检查是否应该容忍当前网络
  if (allowCrossChainMode || shouldTolerate) {
    // 在跨链模式或容忍模式下，不阻断非支持网络
    return <>{children}</>;
  }

  // 传统模式：严格检查网络
  if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
    const chainNames: Record<number, string> = {
      11155111: 'Sepolia Testnet',
      31337: 'Hardhat Local',
      7001: 'ZetaChain Athens',
    };

    return (
      <Alert variant="error" title="Wrong Network">
        <p>
          You are connected to an unsupported network (Chain ID: {chainId}).
        </p>
        <p style={{ marginTop: '8px' }}>
          Please switch to one of the supported networks:
        </p>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          {SUPPORTED_CHAIN_IDS.map(id => (
            <li key={id}>{chainNames[id] || `Chain ${id}`} (ID: {id})</li>
          ))}
        </ul>
        <p style={{ marginTop: '8px', fontSize: '12px', fontStyle: 'italic' }}>
          Write operations require ZetaChain network. Reading functions work on any network.
        </p>
      </Alert>
    );
  }

  return <>{children}</>;
}
