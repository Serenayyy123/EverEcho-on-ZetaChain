import { useState } from 'react';
import { Contract, ethers } from 'ethers';
import { TASK_ESCROW_ADDRESS } from '../contracts/addresses';
import TaskEscrowABI from '../contracts/TaskEscrow.json';

/**
 * 协商终止组件（P1-F7）
 * 冻结点 1.3-16：InProgress 不可单方取消
 * 冻结点 1.4-19：T_TERMINATE_RESPONSE = 48 hours
 * 冻结点 3.4：函数名严格一致
 */

// 终止响应时间（秒）
const T_TERMINATE_RESPONSE = 48 * 60 * 60;

interface TerminateRequestProps {
  taskId: string | number;
  creator: string;
  helper: string;
  terminateRequestedBy: string;
  terminateRequestedAt: number;
  signer: ethers.Signer | null;
  address: string | null;
  onSuccess?: () => void;
}

export function TerminateRequest({
  taskId,
  creator,
  helper,
  terminateRequestedBy,
  terminateRequestedAt,
  signer,
  address,
  onSuccess,
}: TerminateRequestProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!address) return null;

  const isCreator = address.toLowerCase() === creator.toLowerCase();
  const isHelper = address.toLowerCase() === helper.toLowerCase();

  // 只有参与方可以看到
  if (!isCreator && !isHelper) return null;

  const hasRequest = terminateRequestedBy !== '0x0000000000000000000000000000000000000000';
  const requestedByMe = hasRequest && terminateRequestedBy.toLowerCase() === address.toLowerCase();

  // 检查请求是否超时
  const isRequestExpired = () => {
    if (!hasRequest || terminateRequestedAt === 0) return false;
    const now = Math.floor(Date.now() / 1000);
    return now > terminateRequestedAt + T_TERMINATE_RESPONSE;
  };

  // 执行合约操作
  const executeTerminateAction = async (action: 'request' | 'agree' | 'timeout') => {
    if (!signer) return;

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const contract = new Contract(TASK_ESCROW_ADDRESS, TaskEscrowABI.abi, signer);
      let tx;

      switch (action) {
        case 'request':
          tx = await contract.requestTerminate(taskId);
          break;
        case 'agree':
          tx = await contract.agreeTerminate(taskId);
          break;
        case 'timeout':
          tx = await contract.terminateTimeout(taskId);
          break;
      }

      setTxHash(tx.hash);
      console.log(`${action} terminate transaction sent:`, tx.hash);
      
      await tx.wait();
      console.log(`${action} terminate confirmed`);

      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error(`${action} terminate failed:`, err);
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Terminate Task</h3>

      {!hasRequest && (
        <div style={styles.section}>
          <p style={styles.description}>
            Both parties can request to terminate this task. The other party has 48 hours to agree.
          </p>
          <button
            onClick={() => executeTerminateAction('request')}
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Processing...' : 'Request Terminate'}
          </button>
        </div>
      )}

      {hasRequest && requestedByMe && !isRequestExpired() && (
        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            ✓ Terminate request sent. Waiting for the other party to agree (valid for 48 hours).
          </p>
        </div>
      )}

      {hasRequest && !requestedByMe && !isRequestExpired() && (
        <div style={styles.section}>
          <p style={styles.warningText}>
            The other party has requested to terminate this task. You have 48 hours to respond.
          </p>
          <button
            onClick={() => executeTerminateAction('agree')}
            disabled={loading}
            style={{
              ...styles.button,
              backgroundColor: '#ffc107',
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Processing...' : 'Agree to Terminate'}
          </button>
        </div>
      )}

      {hasRequest && isRequestExpired() && (
        <div style={styles.section}>
          <p style={styles.errorText}>
            The terminate request has expired (48 hours passed). Anyone can reset it.
          </p>
          <button
            onClick={() => executeTerminateAction('timeout')}
            disabled={loading}
            style={{
              ...styles.button,
              backgroundColor: '#6c757d',
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Processing...' : 'Reset Expired Request'}
          </button>
        </div>
      )}

      {txHash && (
        <div style={styles.successBox}>
          <p style={styles.successText}>
            Transaction sent: {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </p>
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>
          <p style={styles.errorBoxText}>{error}</p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: '#fff9e6',
    border: '1px solid #ffc107',
    borderRadius: '8px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#856404',
  },
  section: {
    marginTop: '12px',
  },
  description: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  warningText: {
    fontSize: '14px',
    color: '#856404',
    marginBottom: '12px',
    fontWeight: '500',
  },
  errorText: {
    fontSize: '14px',
    color: '#d32f2f',
    marginBottom: '12px',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    backgroundColor: '#ffc107',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
  },
  infoBox: {
    padding: '12px',
    backgroundColor: '#e3f2fd',
    borderRadius: '6px',
    marginTop: '12px',
  },
  infoText: {
    fontSize: '14px',
    color: '#1976d2',
    margin: 0,
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
  errorBoxText: {
    fontSize: '12px',
    color: '#721c24',
    margin: 0,
  },
};
