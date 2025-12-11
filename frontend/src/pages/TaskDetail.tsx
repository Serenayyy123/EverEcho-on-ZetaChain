import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { Task, TaskStatus } from '../types/task';
import { formatAddress, formatTimestamp } from '../utils/formatters';
import { Contract, ethers } from 'ethers';
import { getContractAddresses } from '../contracts/addresses';
import TaskEscrowABI from '../contracts/TaskEscrow.json';
import EOCHOTokenABI from '../contracts/EOCHOToken.json';
import { DarkPageLayout } from '../components/layout/DarkPageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { NetworkGuard } from '../components/ui/NetworkGuard';
import { apiClient } from '../api/client';
import { TimeoutIndicator } from '../components/TimeoutIndicator';
import { TerminateRequest } from '../components/TerminateRequest';
import { RequestFixUI } from '../components/RequestFixUI';
import { ContactsDisplay } from '../components/ContactsDisplay';
import { TaskDetailHero } from '../components/taskdetail/TaskDetailHero';

/**
 * 任务详情页（P0-F2 + P1-F5 + P1-F6 + P1-F7）
 * 冻结点 1.3-16/17：按状态+角色显示操作按钮
 */

export function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { address, chainId, provider, signer } = useWallet();
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // 加载任务详情
  useEffect(() => {
    if (!provider || !taskId || !chainId) return;

    const loadTask = async () => {
      try {
        const addresses = getContractAddresses(chainId);
        const contract = new Contract(addresses.taskEscrow, TaskEscrowABI.abi, provider);
        const taskData = await contract.tasks(taskId);

        const onChainTask: Task = {
          taskId: taskData.taskId.toString(),
          creator: taskData.creator,
          helper: taskData.helper,
          reward: ethers.formatEther(taskData.reward),
          taskURI: taskData.taskURI,
          status: Number(taskData.status) as TaskStatus,
          createdAt: Number(taskData.createdAt),
          acceptedAt: Number(taskData.acceptedAt),
          submittedAt: Number(taskData.submittedAt),
          terminateRequestedBy: taskData.terminateRequestedBy,
          terminateRequestedAt: Number(taskData.terminateRequestedAt),
          fixRequested: taskData.fixRequested,
          fixRequestedAt: Number(taskData.fixRequestedAt),
        };

        // 获取元数据
        try {
          onChainTask.metadata = await apiClient.getTask(taskData.taskURI);
          setMetadataError(false);
        } catch (e) {
          console.error('Failed to fetch metadata:', e);
          setMetadataError(true);
        }

        setTask(onChainTask);
      } catch (error) {
        console.error('Failed to load task:', error);
        setError(error instanceof Error ? error.message : 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [provider, chainId, taskId]);

  // 执行合约操作
  const executeAction = async (actionName: string, contractMethod: string) => {
    if (!signer || !task || !chainId || !address) {
      setError('Wallet not connected or task not loaded');
      return;
    }

    setActionLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const addresses = getContractAddresses(chainId);
      
      // 检查合约地址是否有效
      if (addresses.taskEscrow === '0x0000000000000000000000000000000000000000') {
        throw new Error('TaskEscrow contract not deployed. Please check your .env configuration.');
      }

      // 如果是 acceptTask，先检查并处理授权
      if (contractMethod === 'acceptTask') {
        const tokenContract = new Contract(addresses.echoToken, EOCHOTokenABI.abi, signer);
        const allowance = await tokenContract.allowance(address, addresses.taskEscrow);
        const requiredAmount = ethers.parseEther(task.reward);
        
        console.log('[TaskDetail] Checking allowance:', {
          current: ethers.formatEther(allowance),
          required: task.reward
        });
        
        // 如果授权不足，先发起 approve
        if (allowance < requiredAmount) {
          console.log('[TaskDetail] Insufficient allowance, requesting approval...');
          setError(`Approving ${task.reward} ECHO for TaskEscrow contract...`);
          
          const approveTx = await tokenContract.approve(addresses.taskEscrow, requiredAmount);
          console.log('[TaskDetail] Approve transaction sent:', approveTx.hash);
          setTxHash(approveTx.hash);
          
          await approveTx.wait();
          console.log('[TaskDetail] Approval confirmed');
          setError(null);
          setTxHash(null);
        }
      }

      const contract = new Contract(addresses.taskEscrow, TaskEscrowABI.abi, signer);
      
      // 验证任务状态（前置检查）
      try {
        const taskData = await contract.tasks(task.taskId);
        const currentStatus = Number(taskData.status);
        
        // Accept Task 只能在 Open 状态
        if (contractMethod === 'acceptTask' && currentStatus !== TaskStatus.Open) {
          throw new Error(`Cannot accept task. Current status: ${getStatusLabel(currentStatus)}`);
        }
        
        // Submit Work 只能在 InProgress 状态
        if (contractMethod === 'submitWork' && currentStatus !== TaskStatus.InProgress) {
          throw new Error(`Cannot submit work. Current status: ${getStatusLabel(currentStatus)}`);
        }
        
        // Confirm Complete 只能在 Submitted 状态
        if (contractMethod === 'confirmComplete' && currentStatus !== TaskStatus.Submitted) {
          throw new Error(`Cannot confirm complete. Current status: ${getStatusLabel(currentStatus)}`);
        }
      } catch (verifyError) {
        console.warn('Pre-check failed:', verifyError);
        // 继续执行，让合约返回具体错误
      }

      console.log(`Executing ${actionName} for task ${task.taskId}...`);
      const tx = await contract[contractMethod](task.taskId);
      setTxHash(tx.hash);
      
      console.log(`${actionName} transaction sent:`, tx.hash);
      await tx.wait();
      console.log(`${actionName} confirmed`);
      
      // 如果是 acceptTask，通知后端更新 Helper 信息并重新加密联系方式
      if (contractMethod === 'acceptTask') {
        try {
          console.log('[TaskDetail] Notifying backend to update helper encryption...');
          await apiClient.post('/task/update-helper', {
            taskId: task.taskId,
            helperAddress: address,
            creatorAddress: task.creator,
          });
          console.log('[TaskDetail] Helper encryption updated successfully');
        } catch (updateError) {
          console.error('[TaskDetail] Failed to update helper encryption:', updateError);
          // 不阻塞流程，只记录错误
        }
      }
      
      // 重新加载任务
      window.location.reload();
    } catch (error: any) {
      console.error(`${actionName} failed:`, error);
      
      let errorMessage = `${actionName} failed`;
      
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas';
      } else if (error.message?.includes('TaskEscrow contract not deployed')) {
        errorMessage = error.message;
      } else if (error.message?.includes('Cannot accept task')) {
        errorMessage = error.message;
      } else if (error.message?.includes('missing revert data')) {
        // 提供更详细的错误说明
        if (contractMethod === 'acceptTask') {
          errorMessage = `❌ Failed to accept task. Most likely cause:\n\n🔑 You need to APPROVE the TaskEscrow contract to spend your ECHO tokens first!\n\nRequired amount: ${task.reward} ECHO\n\nPlease go to your Profile page and approve the contract, then try again.`;
        } else {
          errorMessage = 'Contract call failed. Please check the console for details and try again.';
        }
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusLabel = (status: number) => {
    const labels: Record<number, string> = {
      0: 'Open',
      1: 'In Progress',
      2: 'Submitted',
      3: 'Completed',
      4: 'Cancelled',
    };
    return labels[status] || 'Unknown';
  };

  // 渲染操作按钮
  const renderActions = () => {
    if (!task || !address) return null;

    const isCreator = address.toLowerCase() === task.creator.toLowerCase();
    const isHelper = address.toLowerCase() === task.helper.toLowerCase();

    // Open 状态
    if (task.status === TaskStatus.Open) {
      return (
        <div style={styles.actionsSection}>
          {!isCreator && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={actionLoading}
              onClick={() => executeAction('Accept Task', 'acceptTask')}
              theme="light"
            >
              Accept Task
            </Button>
          )}
          
          {isCreator && (
            <Button
              variant="danger"
              size="lg"
              fullWidth
              loading={actionLoading}
              onClick={() => executeAction('Cancel Task', 'cancelTask')}
              theme="light"
            >
              Cancel Task
            </Button>
          )}
        </div>
      );
    }

    // InProgress 状态
    if (task.status === TaskStatus.InProgress && isHelper) {
      return (
        <div style={styles.actionsSection}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={actionLoading}
            onClick={() => executeAction('Submit Work', 'submitWork')}
            theme="light"
          >
            Submit Work
          </Button>
        </div>
      );
    }

    // Submitted 状态
    if (task.status === TaskStatus.Submitted) {
      if (isCreator) {
        return (
          <div style={styles.actionsSection}>
            <Button
              variant="success"
              size="lg"
              fullWidth
              loading={actionLoading}
              onClick={() => executeAction('Confirm Complete', 'confirmComplete')}
              theme="light"
            >
              ✓ Confirm Complete
            </Button>
          </div>
        );
      }

      if (isHelper) {
        return (
          <Alert variant="info">
            Waiting for Creator to review your submission...
          </Alert>
        );
      }
    }

    return null;
  };

  if (loading) {
    return (
      <DarkPageLayout title="Task Detail" theme="light">
        <Card>
          <div style={styles.centerText}>
            <p style={styles.loadingText}>Loading task...</p>
          </div>
        </Card>
      </DarkPageLayout>
    );
  }

  if (error || !task) {
    return (
      <DarkPageLayout title="Task Detail" theme="light">
        <Card>
          <Alert variant="error">
            {error || 'Task not found'}
          </Alert>
          <div style={styles.centerActions}>
            <Button variant="secondary" onClick={() => navigate('/tasks')} theme="light">
              ← Back to Task Square
            </Button>
          </div>
        </Card>
      </DarkPageLayout>
    );
  }

  return (
    <DarkPageLayout title="Task Detail" theme="light">
      <NetworkGuard chainId={chainId}>
        <div style={styles.container}>
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/tasks')}
            theme="light"
          >
            ← Back to Task Square
          </Button>

          {/* Unified Color Card */}
          <TaskDetailHero task={task}>
            {/* Metadata Error Warning */}
            {metadataError && (
              <Alert variant="warning" title="Metadata Load Failed">
                Failed to load task metadata from taskURI. Title and description may be unavailable.
              </Alert>
            )}

            {/* Task Information */}
            <div style={styles.coloredSection}>
              <h3 style={styles.coloredSectionTitle}>Task Information</h3>
              <div style={styles.infoGrid}>
                <InfoRow label="Task ID" value={task.taskId} />
                <InfoRow label="Creator" value={formatAddress(task.creator)} />
                <InfoRow 
                  label="Helper" 
                  value={task.helper !== '0x0000000000000000000000000000000000000000' 
                    ? formatAddress(task.helper) 
                    : 'Not assigned'
                  } 
                />
                <InfoRow label="Created" value={formatTimestamp(task.createdAt)} />
                {task.acceptedAt > 0 && (
                  <InfoRow label="Accepted" value={formatTimestamp(task.acceptedAt)} />
                )}
                {task.submittedAt > 0 && (
                  <InfoRow label="Submitted" value={formatTimestamp(task.submittedAt)} />
                )}
              </div>
            </div>

            {/* Settlement Details (Completed only) */}
            {task.status === TaskStatus.Completed && (
              <Alert variant="success" title="💰 Settlement Completed" category={task.metadata?.category}>
                <div style={styles.settlementGrid}>
                  <div style={styles.settlementRow}>
                    <span>Helper received:</span>
                    <strong>{(parseFloat(task.reward) * 0.98).toFixed(2)} ECHO</strong>
                  </div>
                  <div style={styles.settlementRow}>
                    <span>Burned (2% fee):</span>
                    <strong>{(parseFloat(task.reward) * 0.02).toFixed(2)} ECHO</strong>
                  </div>
                  <div style={styles.settlementRow}>
                    <span>Deposit returned:</span>
                    <strong>{parseFloat(task.reward).toFixed(2)} ECHO</strong>
                  </div>
                </div>
                <p style={styles.settlementNote}>
                  Helper received 98% of reward. 2% was burned as protocol fee.
                </p>
              </Alert>
            )}

            {/* Transaction Hash */}
            {txHash && (
              <Alert variant="info">
                Transaction sent: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                <br />
                <small>Waiting for confirmation...</small>
              </Alert>
            )}

            {/* Error */}
            {error && (
              <Alert variant="error">
                {error}
              </Alert>
            )}

            {/* Timeout Indicator */}
            <TimeoutIndicator
              taskId={task.taskId}
              status={task.status}
              createdAt={task.createdAt}
              acceptedAt={task.acceptedAt}
              submittedAt={task.submittedAt}
              fixRequested={task.fixRequested}
              creator={task.creator}
              helper={task.helper}
              signer={signer}
              address={address}
              onTimeoutTxSuccess={() => window.location.reload()}
            />

            {/* Terminate Request (InProgress only) */}
            {task.status === TaskStatus.InProgress && (
              <TerminateRequest
                taskId={task.taskId}
                creator={task.creator}
                helper={task.helper}
                terminateRequestedBy={task.terminateRequestedBy}
                terminateRequestedAt={task.terminateRequestedAt}
                signer={signer}
                address={address}
                onSuccess={() => window.location.reload()}
              />
            )}

            {/* Request Fix UI (Submitted only) */}
            {task.status === TaskStatus.Submitted && (
              <RequestFixUI
                taskId={task.taskId}
                creator={task.creator}
                helper={task.helper}
                fixRequested={task.fixRequested}
                signer={signer}
                address={address}
                onSuccess={() => window.location.reload()}
              />
            )}

            {/* Actions */}
            {renderActions()}

            {/* Contacts Display */}
            <ContactsDisplay task={task} signer={signer} address={address} />
          </TaskDetailHero>
        </div>
      </NetworkGuard>
    </DarkPageLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid rgba(26, 26, 26, 0.12)',
  },
  titleSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1A1A1A',
    margin: 0,
    lineHeight: '1.3',
  },
  rewardSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },
  rewardAmount: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#2563eb',
  },
  rewardLabel: {
    fontSize: '14px',
    color: '#2D2D2D',
    fontWeight: 500,
  },
  section: {
    marginBottom: '24px',
  },
  coloredSection: {
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.25)',
    borderRadius: '12px',
    backdropFilter: 'blur(4px)',
    marginBottom: '0',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1A1A1A',
    marginBottom: '12px',
  },
  coloredSectionTitle: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    fontSize: '16px',
    fontWeight: 600,
    color: 'rgba(45, 45, 45, 0.9)',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  description: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#2D2D2D',
    margin: 0,
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: '8px',
  },
  infoLabel: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    fontSize: '12px',
    color: 'rgba(45, 45, 45, 0.7)',
    fontWeight: 500,
    letterSpacing: '0.02em',
  },
  infoValue: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    fontSize: '13px',
    color: 'rgba(45, 45, 45, 0.9)',
    fontWeight: 600,
  },
  settlementGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
    marginBottom: '12px',
  },
  settlementRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
  },
  settlementNote: {
    fontSize: '12px',
    marginTop: '8px',
    marginBottom: 0,
    opacity: 0.8,
  },
  actionsSection: {
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.25)',
    borderRadius: '12px',
    backdropFilter: 'blur(4px)',
  },
  centerText: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#2D2D2D',
  },
  centerActions: {
    marginTop: '16px',
    display: 'flex',
    justifyContent: 'center',
  },
};
