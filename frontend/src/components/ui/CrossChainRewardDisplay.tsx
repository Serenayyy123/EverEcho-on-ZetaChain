import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Alert } from './Alert';
import { ethers } from 'ethers';
import { RewardStatus, SUPPORTED_ASSETS, TARGET_CHAINS } from '../../config/contracts';

interface CrossChainReward {
  rewardId: string;
  asset: string;
  assetSymbol: string;
  amount: string;
  targetChainId: string;
  targetChainName: string;
  status: 'deposited' | 'locked' | 'claimed' | 'refunded' | 'reverted';
  targetAddress?: string;
  txHash?: string;
  error?: string;
}

import { TaskStatus } from '../../types/task';

interface CrossChainRewardDisplayProps {
  taskId: string;
  userRole: 'creator' | 'helper' | 'viewer';
  taskStatus: TaskStatus;
  onRefund?: () => void;
  onWithdraw?: () => void;
}

export function CrossChainRewardDisplay({
  taskId,
  userRole,
  taskStatus,
  onRefund,
  onWithdraw
}: CrossChainRewardDisplayProps) {
  const [reward, setReward] = useState<CrossChainReward | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查钱包连接状态
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkWalletConnection();
  }, []);

  // 加载真实的跨链奖励数据
  useEffect(() => {
    const loadReward = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!taskId) {
          setReward(null);
          return;
        }

        console.log('Loading reward for task:', taskId);
        
        // 获取合约实例
        let provider;
        if (window.ethereum) {
          provider = new ethers.BrowserProvider(window.ethereum);
        } else {
          provider = new ethers.JsonRpcProvider('http://localhost:8545');
        }
        
        const contractABI = [
          "function getRewardByTask(uint256 taskId) external view returns (uint256)",
          "function getRewardPlan(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))"
        ];
        
        const contractAddress = import.meta.env.VITE_UNIVERSAL_REWARD_ADDRESS || '0x9A676e781A523b5d0C0e43731313A708CB607508';
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        
        // 根据任务ID获取奖励ID
        const rewardId = await contract.getRewardByTask(BigInt(taskId));
        
        if (rewardId.toString() !== '0') {
          console.log('Found reward ID:', rewardId.toString());
          
          // 获取奖励计划详情
          const plan = await contract.getRewardPlan(rewardId);
          
          console.log('Reward plan:', plan);
          
          // 获取资产信息
          const asset = SUPPORTED_ASSETS.find(a => a.value.toLowerCase() === plan.asset.toLowerCase()) || SUPPORTED_ASSETS[0];
          const targetChain = TARGET_CHAINS.find(c => c.value === plan.targetChainId.toString()) || TARGET_CHAINS[0];
          
          // 转换状态
          const statusMap: Record<RewardStatus, CrossChainReward['status']> = {
            [RewardStatus.Prepared]: 'deposited',
            [RewardStatus.Deposited]: 'deposited',
            [RewardStatus.Locked]: 'locked',
            [RewardStatus.Claimed]: 'claimed',
            [RewardStatus.Refunded]: 'refunded',
            [RewardStatus.Reverted]: 'reverted'
          };

          const rewardStatus = statusMap[plan.status as RewardStatus] || 'locked';

          setReward({
            rewardId: rewardId.toString(),
            asset: plan.asset,
            assetSymbol: asset.symbol,
            amount: ethers.formatEther(plan.amount),
            targetChainId: plan.targetChainId.toString(),
            targetChainName: targetChain.label,
            status: rewardStatus,
            targetAddress: plan.targetAddress !== '0x0000000000000000000000000000000000000000' ? plan.targetAddress : undefined,
            txHash: plan.lastTxHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? plan.lastTxHash : undefined
          });
        } else {
          console.log('No reward found for task:', taskId);
          setReward(null);
        }
      } catch (error: any) {
        console.error('Failed to load cross-chain reward:', error);
        setError(error.message || 'Failed to load reward data');
        setReward(null);
      } finally {
        setLoading(false);
      }
    };

    loadReward();
  }, [taskId]);

  const handleWithdraw = async () => {
    if (!reward || userRole !== 'helper' || !address || !isConnected) return;

    setActionLoading(true);
    setError(null);
    
    try {
      console.log('Claiming reward to helper:', { rewardId: reward.rewardId, helperAddress: address });
      
      // 获取合约实例
      if (!window.ethereum) {
        throw new Error('请安装 MetaMask');
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const contractABI = [
        "function claimToHelper(uint256 rewardId, address helperAddress) external",
        "event RewardClaimed(uint256 indexed rewardId, address indexed helper, bytes32 txHash)"
      ];
      
      const contractAddress = import.meta.env.VITE_UNIVERSAL_REWARD_ADDRESS || '0x9A676e781A523b5d0C0e43731313A708CB607508';
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      const tx = await contract.claimToHelper(BigInt(reward.rewardId), address);
      const receipt = await tx.wait();
      
      setReward(prev => prev ? {
        ...prev,
        status: 'claimed',
        targetAddress: address,
        txHash: receipt.hash
      } : null);
      
      onWithdraw?.();
      console.log('Reward claimed successfully');
      
    } catch (error: any) {
      console.error('Error claiming reward:', error);
      const errorMessage = error.message || 'Cross-chain transfer failed. Please try again.';
      setError(errorMessage);
      setReward(prev => prev ? {
        ...prev,
        error: errorMessage
      } : null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!reward || userRole !== 'creator' || !isConnected) return;

    setActionLoading(true);
    setError(null);
    
    try {
      console.log('Refunding reward:', { rewardId: reward.rewardId });
      
      // 获取合约实例
      if (!window.ethereum) {
        throw new Error('请安装 MetaMask');
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const contractABI = [
        "function refund(uint256 rewardId) external",
        "event RewardRefunded(uint256 indexed rewardId, address indexed creator)"
      ];
      
      const contractAddress = import.meta.env.VITE_UNIVERSAL_REWARD_ADDRESS || '0x9A676e781A523b5d0C0e43731313A708CB607508';
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      const tx = await contract.refund(BigInt(reward.rewardId));
      await tx.wait();
      
      setReward(prev => prev ? {
        ...prev,
        status: 'refunded'
      } : null);
      
      onRefund?.();
      console.log('Reward refunded successfully');
      
    } catch (error: any) {
      console.error('Error refunding reward:', error);
      const errorMessage = error.message || 'Refund failed. Please try again.';
      setError(errorMessage);
      setReward(prev => prev ? {
        ...prev,
        error: errorMessage
      } : null);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>
          <span style={styles.spinner}>⏳</span>
          <span>Loading cross-chain reward...</span>
        </div>
      </div>
    );
  }

  if (!reward) {
    return null; // 没有跨链奖励就不显示
  }

  const getStatusDisplay = () => {
    switch (reward.status) {
      case 'deposited':
        return { text: '已存入', color: '#3B82F6', icon: '💰' };
      case 'locked':
        return { text: '已锁定', color: '#F59E0B', icon: '🔒' };
      case 'claimed':
        return { text: '已领取', color: '#10B981', icon: '✅' };
      case 'refunded':
        return { text: '已退款', color: '#6B7280', icon: '↩️' };
      case 'reverted':
        return { text: '已回滚', color: '#EF4444', icon: '🔄' };
      default:
        return { text: '未知', color: '#6B7280', icon: '❓' };
    }
  };

  const status = getStatusDisplay();
  const canWithdraw = userRole === 'helper' && taskStatus === TaskStatus.Completed && reward.status === 'locked';
  const canRefund = userRole === 'creator' && (taskStatus === TaskStatus.Cancelled || reward.status === 'reverted');

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.icon}>🌉</span>
          <span style={styles.title}>跨链奖励</span>
        </div>
        <div style={styles.statusBadge} data-status={reward.status}>
          <span style={styles.statusIcon}>{status.icon}</span>
          <span style={styles.statusText}>{status.text}</span>
        </div>
      </div>

      <div style={styles.content}>
        {/* Reward Details */}
        <div style={styles.detailsGrid}>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>资产:</span>
            <span style={styles.detailValue}>{reward.assetSymbol}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>数量:</span>
            <span style={styles.detailValue}>{reward.amount} {reward.assetSymbol}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>目标链:</span>
            <span style={styles.detailValue}>{reward.targetChainName}</span>
          </div>
          {reward.targetAddress && (
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>接收地址:</span>
              <span style={styles.detailValue}>
                {reward.targetAddress.slice(0, 6)}...{reward.targetAddress.slice(-4)}
              </span>
            </div>
          )}
        </div>

        {/* Transaction Hash */}
        {reward.txHash && (
          <div style={styles.txHashSection}>
            <span style={styles.txLabel}>交易哈希:</span>
            <a 
              href={`https://athens.explorer.zetachain.com/tx/${reward.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.txLink}
            >
              {reward.txHash.slice(0, 10)}...{reward.txHash.slice(-8)}
            </a>
            <div style={styles.txNote}>
              <span style={styles.noteIcon}>ℹ️</span>
              <span style={styles.noteText}>在 ZetaChain 浏览器查看跨链交易详情</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {(reward.error || error) && (
          <Alert variant="error">
            {reward.error || error}
          </Alert>
        )}

        {/* Action Buttons */}
        <div style={styles.actionSection}>
          {canWithdraw && (
            <div style={styles.withdrawSection}>
              <div style={styles.withdrawInfo}>
                <span style={styles.withdrawIcon}>🎁</span>
                <div style={styles.withdrawText}>
                  <div style={styles.withdrawTitle}>可以领取跨链奖励</div>
                  <div style={styles.withdrawSubtitle}>
                    将发送到您在 {reward.targetChainName} 的地址
                  </div>
                  <div style={styles.timeWarning}>
                    <span style={styles.warningIcon}>⏰</span>
                    <span>跨链转账需要 5-15 分钟到账，请耐心等待</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleWithdraw}
                loading={actionLoading}
                disabled={actionLoading || !isConnected}
                variant="primary"
                size="sm"
              >
                {actionLoading ? '处理中...' : 'Withdraw 奖励'}
              </Button>
            </div>
          )}

          {canRefund && (
            <div style={styles.refundSection}>
              <div style={styles.refundInfo}>
                <span style={styles.refundIcon}>↩️</span>
                <div style={styles.refundText}>
                  <div style={styles.refundTitle}>
                    {taskStatus === TaskStatus.Cancelled ? '任务已取消，可退回奖励' : '跨链失败，可退回奖励'}
                  </div>
                  <div style={styles.refundSubtitle}>
                    资金将退回到您的原始地址
                  </div>
                </div>
              </div>
              <Button
                onClick={handleRefund}
                loading={actionLoading}
                disabled={actionLoading || !isConnected}
                variant="secondary"
                size="sm"
              >
                {actionLoading ? '退款中...' : '退回奖励'}
              </Button>
            </div>
          )}

          {reward.status === 'claimed' && userRole === 'helper' && (
            <div style={styles.completedSection}>
              <span style={styles.completedIcon}>🎉</span>
              <div style={styles.completedText}>
                <div>跨链奖励已发起转账</div>
                <div style={styles.completedSubtext}>
                  资金正在跨链转账中，预计 5-15 分钟后到达您在 {reward.targetChainName} 的钱包
                </div>
                <div style={styles.processingNote}>
                  <span style={styles.processingIcon}>🔄</span>
                  <span>如果超过 30 分钟未到账，请联系技术支持</span>
                </div>
              </div>
            </div>
          )}

          {reward.status === 'refunded' && userRole === 'creator' && (
            <div style={styles.completedSection}>
              <span style={styles.completedIcon}>✅</span>
              <div style={styles.completedText}>
                <div>跨链奖励已退回</div>
                <div style={styles.completedSubtext}>
                  资金已返回到您的钱包
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Helper Instructions */}
        {reward.status === 'locked' && userRole === 'helper' && taskStatus !== TaskStatus.Completed && (
          <div style={styles.instructionBox}>
            <span style={styles.instructionIcon}>💡</span>
            <div style={styles.instructionText}>
              完成任务后即可领取跨链奖励。奖励将通过 ZetaChain 跨链桥发送到您在 {reward.targetChainName} 的地址，整个过程需要 5-15 分钟。
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '12px',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    overflow: 'hidden',
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '24px',
    fontSize: '14px',
    color: '#6B7280',
  },
  spinner: {
    fontSize: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  icon: {
    fontSize: '18px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#2563EB',
  },
  statusIcon: {
    fontSize: '12px',
  },
  statusText: {},
  content: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    fontSize: '13px',
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#6B7280',
  },
  detailValue: {
    color: '#1A1A1A',
    fontWeight: 500,
  },
  txHashSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
  },
  txLabel: {
    color: '#6B7280',
  },
  txLink: {
    color: '#2563EB',
    textDecoration: 'none',
    fontFamily: 'monospace',
  },
  txNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px',
    fontSize: '11px',
  },
  noteIcon: {
    fontSize: '10px',
  },
  noteText: {
    color: '#6B7280',
  },
  timeWarning: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px',
    fontSize: '11px',
    color: '#F59E0B',
  },
  warningIcon: {
    fontSize: '10px',
  },
  processingNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '6px',
    fontSize: '11px',
    color: '#6B7280',
  },
  processingIcon: {
    fontSize: '10px',
  },
  actionSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  withdrawSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '8px',
  },
  withdrawInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  withdrawIcon: {
    fontSize: '20px',
  },
  withdrawText: {
    fontSize: '13px',
  },
  withdrawTitle: {
    color: '#10B981',
    fontWeight: 500,
  },
  withdrawSubtitle: {
    color: '#6B7280',
    fontSize: '11px',
  },
  refundSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: '8px',
  },
  refundInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  refundIcon: {
    fontSize: '20px',
  },
  refundText: {
    fontSize: '13px',
  },
  refundTitle: {
    color: '#F59E0B',
    fontWeight: 500,
  },
  refundSubtitle: {
    color: '#6B7280',
    fontSize: '11px',
  },
  completedSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '8px',
  },
  completedIcon: {
    fontSize: '20px',
  },
  completedText: {
    fontSize: '13px',
    color: '#10B981',
    fontWeight: 500,
  },
  completedSubtext: {
    fontSize: '11px',
    color: '#6B7280',
    fontWeight: 400,
  },
  instructionBox: {
    display: 'flex',
    gap: '8px',
    padding: '12px',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '6px',
  },
  instructionIcon: {
    fontSize: '14px',
    flexShrink: 0,
  },
  instructionText: {
    fontSize: '12px',
    color: '#2563EB',
    lineHeight: '1.4',
  },
};