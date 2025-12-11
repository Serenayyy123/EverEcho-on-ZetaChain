import { useState } from 'react';
import { Contract, ethers } from 'ethers';
import { TASK_ESCROW_ADDRESS } from '../contracts/addresses';
import TaskEscrowABI from '../contracts/TaskEscrow.json';

/**
 * Request Fix 组件（P1-F7）
 * 冻结点 1.3-17：Submitted 不可取消
 * 冻结点 1.4-20：Request Fix 不刷新 submittedAt
 * 冻结点 3.4：函数名严格一致
 */

interface RequestFixUIProps {
  taskId: string | number;
  creator: string;
  helper: string;
  fixRequested: boolean;
  signer: ethers.Signer | null;
  address: string | null;
  onSuccess?: () => void;
}

export function RequestFixUI({
  taskId,
  creator,
  helper,
  fixRequested,
  signer,
  address,
  onSuccess,
}: RequestFixUIProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!address) return null;

  const isCreator = address.toLowerCase() === creator.toLowerCase();
  const isHelper = address.toLowerCase() === helper.toLowerCase();

  // 只有 Creator 可以看到
  if (!isCreator) {
    // Helper 视角：如果已请求修复，显示提示
    if (isHelper && fixRequested) {
      return (
        <div style={styles.container}>
          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              ⚠️ Creator has requested a fix. Please update your submission.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  // 执行 Request Fix
  const handleRequestFix = async () => {
    if (!signer) return;

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const contract = new Contract(TASK_ESCROW_ADDRESS, TaskEscrowABI.abi, signer);
      const tx = await contract.requestFix(taskId);
      setTxHash(tx.hash);

      console.log('requestFix transaction sent:', tx.hash);
      await tx.wait();
      console.log('requestFix confirmed');

      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('requestFix failed:', err);
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Request Fix</h3>

      {!fixRequested && (
        <div style={styles.section}>
          <p style={styles.description}>
            If the submission needs improvement, you can request a fix. This will extend the review period by 3 days.
          </p>
          <button
            onClick={handleRequestFix}
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Processing...' : 'Request Fix'}
          </button>
        </div>
      )}

      {fixRequested && (
        <div style={styles.successBox}>
          <p style={styles.successText}>
            ✓ Fix requested. Review period has been extended by 3 days.
          </p>
        </div>
      )}

      {txHash && (
        <div style={styles.txBox}>
          <p style={styles.txText}>
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
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: '#fff3e0',
    border: '1px solid #ff9800',
    borderRadius: '8px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#e65100',
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
  button: {
    width: '100%',
    backgroundColor: '#ff9800',
    color: 'white',
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
  successBox: {
    padding: '12px',
    backgroundColor: '#d4edda',
    borderRadius: '6px',
    marginTop: '12px',
  },
  successText: {
    fontSize: '14px',
    color: '#155724',
    margin: 0,
  },
  infoBox: {
    padding: '12px',
    backgroundColor: '#fff3cd',
    borderRadius: '6px',
  },
  infoText: {
    fontSize: '14px',
    color: '#856404',
    margin: 0,
  },
  txBox: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#d4edda',
    borderRadius: '6px',
  },
  txText: {
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
};
