import { useState } from 'react';
import { TaskStatus } from '../types/task';
import { useTimeout } from '../hooks/useTimeout';
import { Contract, ethers } from 'ethers';
import { TASK_ESCROW_ADDRESS } from '../contracts/addresses';
import TaskEscrowABI from '../contracts/TaskEscrow.json';

/**
 * 超时指示器组件（P1-F6）
 * 冻结点 1.3-13：状态机枚举一致
 * 冻结点 1.4-19：超时常量固定
 * 冻结点 1.4-20：Request Fix 计时语义
 * 冻结点 3.4：函数名完全一致
 */

interface TimeoutIndicatorProps {
  taskId: string | number;
  status: TaskStatus;
  createdAt: number;
  acceptedAt: number;
  submittedAt: number;
  fixRequested: boolean;
  creator: string;
  helper: string;
  signer: ethers.Signer | null;
  address: string | null;
  onTimeoutTxSuccess?: () => void;
}

export function TimeoutIndicator({
  taskId,
  status,
  createdAt,
  acceptedAt,
  submittedAt,
  fixRequested,
  creator,
  helper,
  signer,
  address,
  onTimeoutTxSuccess,
}: TimeoutIndicatorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const timeoutInfo = useTimeout({
    status,
    createdAt,
    acceptedAt,
    submittedAt,
    fixRequested,
  });

  // 不显示倒计时的状态
  if (!timeoutInfo.timeoutType) {
    return null;
  }

  // 获取超时函数名
  const getTimeoutFunction = (): string | null => {
    switch (status) {
      case TaskStatus.Open:
        return 'cancelTaskTimeout';
      case TaskStatus.InProgress:
        return 'progressTimeout';
      case TaskStatus.Submitted:
        return 'completeTimeout';
      default:
        return null;
    }
  };

  // 检查用户权限
  const canTriggerTimeout = () => {
    if (!address) return false;

    const isCreator = address.toLowerCase() === creator.toLowerCase();
    const isHelper = address.toLowerCase() === helper.toLowerCase();

    switch (status) {
      case TaskStatus.Open:
        return isCreator; // 只有 Creator 可以触发 Open 超时

      case TaskStatus.InProgress:
        return isCreator; // 只有 Creator 可以触发 InProgress 超时

      case TaskStatus.Submitted:
        return isHelper; // 只有 Helper 可以触发 Submitted 超时

      default:
        return false;
    }
  };

  // 触发超时操作
  const handleTimeout = async () => {
    const timeoutFunction = getTimeoutFunction();
    if (!signer || !timeoutFunction) return;

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const contract = new Contract(TASK_ESCROW_ADDRESS, TaskEscrowABI.abi, signer);
      const tx = await contract[timeoutFunction](taskId);
      setTxHash(tx.hash);

      console.log(`${timeoutFunction} transaction sent:`, tx.hash);
      await tx.wait();
      console.log(`${timeoutFunction} confirmed`);

      // 成功后回调
      if (onTimeoutTxSuccess) {
        onTimeoutTxSuccess();
      } else {
        // 默认刷新页面
        window.location.reload();
      }
    } catch (err) {
      console.error(`${timeoutFunction} failed:`, err);
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>{timeoutInfo.timeoutType}:</span>
        {!timeoutInfo.isTimeout ? (
          <span style={styles.countdown}>{timeoutInfo.formatTimeLeft()}</span>
        ) : (
          <span style={styles.expired}>Expired</span>
        )}
      </div>

      {timeoutInfo.isTimeout && canTriggerTimeout() && (
        <div style={styles.actionSection}>
          <button
            onClick={handleTimeout}
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Processing...' : 'Trigger Timeout'}
          </button>

          {txHash && (
            <div style={styles.successBox}>
              <p style={styles.successText}>
                Transaction sent: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </p>
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              <p style={styles.errorText}>{error}</p>
            </div>
          )}
        </div>
      )}

      {timeoutInfo.isTimeout && !canTriggerTimeout() && address && (
        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            Task has expired. Waiting for{' '}
            {status === TaskStatus.Submitted ? 'Helper' : 'Creator'} to trigger timeout.
          </p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#856404',
  },
  countdown: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#856404',
    fontFamily: 'monospace',
  },
  expired: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#d32f2f',
  },
  actionSection: {
    marginTop: '12px',
  },
  button: {
    width: '100%',
    backgroundColor: '#ffc107',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
  },
  successBox: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#d4edda',
    borderRadius: '6px',
  },
  successText: {
    fontSize: '12px',
    color: '#155724',
    margin: 0,
  },
  errorBox: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#f8d7da',
    borderRadius: '6px',
  },
  errorText: {
    fontSize: '12px',
    color: '#721c24',
    margin: 0,
  },
  infoBox: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#e3f2fd',
    borderRadius: '6px',
  },
  infoText: {
    fontSize: '12px',
    color: '#1976d2',
    margin: 0,
  },
};
