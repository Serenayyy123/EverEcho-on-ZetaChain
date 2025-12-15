/**
 * Cross-chain Reward Display Component
 * Stage 4.7: ZRC20 跨链奖励显示和操作
 * 
 * 🎯 Purpose: 显示和管理 ZRC20 跨链奖励
 * ✅ 支持存入、领取跨链奖励
 * ⚠️ 明确标注为 ZRC20 形式，不保证自动桥回原链
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from './Button';
import { Alert } from './Alert';
import { useWallet } from '../../hooks/useWallet';
import { getContractAddresses } from '../../contracts/addresses';
import EverEchoGatewayABI from '../../contracts/EverEchoGateway.json';

interface CrossChainRewardDisplayProps {
  taskId: string;
  rewardAsset: string;
  rewardAmount: string;
  taskStatus: number;
  isCreator: boolean;
  isHelper: boolean;
  className?: string;
}

interface RewardInfo {
  asset: string;
  amount: string;
  deposited: boolean;
  claimed: boolean;
  depositor: string;
}

export function CrossChainRewardDisplay({
  taskId,
  rewardAsset,
  rewardAmount,
  taskStatus,
  isCreator,
  isHelper,
  className = ''
}: CrossChainRewardDisplayProps) {
  const { provider, signer, chainId } = useWallet();
  const [rewardInfo, setRewardInfo] = useState<RewardInfo | null>(null);
  const [tokenSymbol, setTokenSymbol] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // 检查是否有跨链奖励
  const hasReward = rewardAsset !== ethers.ZeroAddress && parseFloat(rewardAmount) > 0;

  // 加载跨链奖励信息
  useEffect(() => {
    if (!provider || !chainId || !hasReward) return;

    const loadRewardInfo = async () => {
      try {
        const addresses = getContractAddresses(chainId);
        const gateway = new ethers.Contract(addresses.gateway, EverEchoGatewayABI.abi, provider);
        
        const info = await gateway.getRewardInfo(taskId);
        setRewardInfo({
          asset: info[0],
          amount: info[1].toString(),
          deposited: info[2],
          claimed: info[3],
          depositor: info[4]
        });

        // 尝试获取代币符号
        try {
          const tokenContract = new ethers.Contract(rewardAsset, [
            'function symbol() view returns (string)'
          ], provider);
          const symbol = await tokenContract.symbol();
          setTokenSymbol(symbol);
        } catch {
          setTokenSymbol('TOKEN');
        }
      } catch (err) {
        console.error('Failed to load reward info:', err);
      }
    };

    loadRewardInfo();
  }, [provider, chainId, taskId, rewardAsset, hasReward]);

  // 存入跨链奖励
  const handleDepositReward = async () => {
    if (!signer || !chainId) return;

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const addresses = getContractAddresses(chainId);
      
      // 1. Approve token
      const tokenContract = new ethers.Contract(rewardAsset, [
        'function approve(address spender, uint256 amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)'
      ], signer);

      const currentAllowance = await tokenContract.allowance(await signer.getAddress(), addresses.gateway);
      if (currentAllowance < BigInt(rewardAmount)) {
        setError('Approving tokens...');
        const approveTx = await tokenContract.approve(addresses.gateway, rewardAmount);
        await approveTx.wait();
      }

      // 2. Deposit reward
      setError('Depositing cross-chain reward...');
      const gateway = new ethers.Contract(addresses.gateway, EverEchoGatewayABI.abi, signer);
      const depositTx = await gateway.depositReward(taskId, rewardAsset, rewardAmount);
      const receipt = await depositTx.wait();
      
      setTxHash(receipt.hash);
      setError(null);

      // 刷新奖励信息
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      console.error('Deposit reward failed:', err);
      setError(err.message || 'Failed to deposit cross-chain reward');
    } finally {
      setLoading(false);
    }
  };

  // 领取跨链奖励
  const handleClaimReward = async () => {
    if (!signer || !chainId) return;

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const addresses = getContractAddresses(chainId);
      const gateway = new ethers.Contract(addresses.gateway, EverEchoGatewayABI.abi, signer);
      
      setError('Claiming cross-chain reward...');
      const claimTx = await gateway.claimReward(taskId);
      const receipt = await claimTx.wait();
      
      setTxHash(receipt.hash);
      setError(null);

      // 刷新奖励信息
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      console.error('Claim reward failed:', err);
      setError(err.message || 'Failed to claim cross-chain reward');
    } finally {
      setLoading(false);
    }
  };

  // 如果没有跨链奖励，不显示
  if (!hasReward) {
    return null;
  }

  return (
    <div className={className} style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>🌉 Cross-chain Reward (ZRC20)</h3>
        <div style={styles.disclaimer}>
          <span style={styles.disclaimerIcon}>⚠️</span>
          <span style={styles.disclaimerText}>
            ZRC20 tokens on Athens chain. Bridge back to original chain manually if needed.
          </span>
        </div>
      </div>

      <div style={styles.rewardInfo}>
        <div style={styles.rewardAmount}>
          <span style={styles.amount}>{ethers.formatEther(rewardAmount)}</span>
          <span style={styles.symbol}>{tokenSymbol || 'TOKEN'}</span>
        </div>
        <div style={styles.assetAddress}>
          <span style={styles.addressLabel}>Asset:</span>
          <span style={styles.address}>
            {rewardAsset.slice(0, 6)}...{rewardAsset.slice(-4)}
          </span>
        </div>
      </div>

      {rewardInfo && (
        <div style={styles.status}>
          <div style={styles.statusItem}>
            <span style={styles.statusLabel}>Deposited:</span>
            <span style={rewardInfo.deposited ? styles.statusYes : styles.statusNo}>
              {rewardInfo.deposited ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div style={styles.statusItem}>
            <span style={styles.statusLabel}>Claimed:</span>
            <span style={rewardInfo.claimed ? styles.statusYes : styles.statusNo}>
              {rewardInfo.claimed ? '✅ Yes' : '❌ No'}
            </span>
          </div>
        </div>
      )}

      {/* Creator 操作：存入跨链奖励 */}
      {isCreator && rewardInfo && !rewardInfo.deposited && (
        <div style={styles.actions}>
          <Button
            variant="secondary"
            onClick={handleDepositReward}
            loading={loading}
            disabled={loading}
            theme="light"
          >
            Deposit Cross-chain Reward
          </Button>
        </div>
      )}

      {/* Helper 操作：领取跨链奖励 */}
      {isHelper && rewardInfo && rewardInfo.deposited && !rewardInfo.claimed && taskStatus === 3 && (
        <div style={styles.actions}>
          <Button
            variant="primary"
            onClick={handleClaimReward}
            loading={loading}
            disabled={loading}
            theme="light"
          >
            Claim Cross-chain Reward
          </Button>
        </div>
      )}

      {/* 状态消息 */}
      {error && (
        <Alert variant={txHash ? "info" : "error"}>
          {error}
        </Alert>
      )}

      {txHash && (
        <Alert variant="success">
          Transaction sent: {txHash.slice(0, 10)}...{txHash.slice(-8)}
          <br />
          <small>Page will refresh automatically...</small>
        </Alert>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '12px',
    marginTop: '16px',
  },
  header: {
    marginBottom: '16px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 8px 0',
  },
  disclaimer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '6px',
  },
  disclaimerIcon: {
    fontSize: '12px',
  },
  disclaimerText: {
    fontSize: '11px',
    color: '#92400E',
    fontWeight: 500,
  },
  rewardInfo: {
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  rewardAmount: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '8px',
  },
  amount: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#2563EB',
  },
  symbol: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#6B7280',
  },
  assetAddress: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  addressLabel: {
    fontSize: '12px',
    color: '#6B7280',
    fontWeight: 500,
  },
  address: {
    fontSize: '12px',
    color: '#1A1A1A',
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  status: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusLabel: {
    fontSize: '12px',
    color: '#6B7280',
    fontWeight: 500,
  },
  statusYes: {
    fontSize: '12px',
    color: '#059669',
    fontWeight: 600,
  },
  statusNo: {
    fontSize: '12px',
    color: '#DC2626',
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
};