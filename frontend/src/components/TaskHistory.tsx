import { Task, TaskStatus, TaskStatusLabels } from '../types/task';
import { formatAddress, formatTimestamp } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { getCategoryFullTheme } from '../utils/categoryTheme';

/**
 * 任务历史组件 - 竖版卡片布局
 * 冻结点 1.3-13：状态枚举与展示一致
 * UI 升级：Grid 布局 + Category 主题色
 */

interface TaskHistoryProps {
  tasks: Task[];
  role: 'creator' | 'helper';
  loading: boolean;
  error: string | null;
}

export function TaskHistory({ tasks, role, loading, error }: TaskHistoryProps) {
  const navigate = useNavigate();

  if (loading) {
    return <div style={styles.message}>Loading task history...</div>;
  }

  if (error) {
    return <div style={styles.errorMessage}>Error: {error}</div>;
  }

  if (tasks.length === 0) {
    return (
      <div style={styles.message}>
        {role === 'creator' ? 'No tasks created yet' : 'No tasks accepted yet'}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {tasks.map((task) => {
        const theme = getCategoryFullTheme(task.metadata?.category);
        
        return (
          <div
            key={task.taskId}
            style={{
              ...styles.taskCard,
              background: theme.bg,
              borderColor: theme.border,
            }}
            onClick={() => navigate(`/tasks/${task.taskId}`)}
          >
            {/* Category Tag */}
            <div
              style={{
                ...styles.categoryTag,
                backgroundColor: theme.accent,
                color: theme.text,
              }}
            >
              {theme.label}
            </div>

            {/* Status Badge */}
            <span
              style={{
                ...styles.statusBadge,
                backgroundColor: theme.tag,
                color: theme.text,
              }}
            >
              {TaskStatusLabels[task.status]}
            </span>

            {/* Title */}
            <h3 style={{ ...styles.taskTitle, color: theme.text }}>
              {task.metadata?.title || `Task #${task.taskId}`}
            </h3>

            {/* Reward */}
            <div style={styles.rewardSection}>
              <span style={{ ...styles.rewardAmount, color: theme.text }}>
                {task.reward}
              </span>
              <span style={{ ...styles.rewardLabel, color: `${theme.text}99` }}>
                ECHO
              </span>
            </div>

            {/* Divider */}
            <div style={{ ...styles.divider, borderColor: `${theme.border}80` }} />

            {/* Info Section */}
            <div style={styles.infoSection}>
              <div style={styles.infoRow}>
                <span style={{ ...styles.label, color: `${theme.text}99` }}>Task ID:</span>
                <span style={{ ...styles.value, color: theme.text }}>#{task.taskId}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={{ ...styles.label, color: `${theme.text}99` }}>
                  {role === 'creator' ? 'Helper:' : 'Creator:'}
                </span>
                <span style={{ ...styles.value, color: theme.text }}>
                  {role === 'creator'
                    ? task.helper !== '0x0000000000000000000000000000000000000000'
                      ? formatAddress(task.helper)
                      : 'Not assigned'
                    : formatAddress(task.creator)}
                </span>
              </div>

              <div style={styles.infoRow}>
                <span style={{ ...styles.label, color: `${theme.text}99` }}>Created:</span>
                <span style={{ ...styles.value, color: theme.text }}>
                  {formatTimestamp(task.createdAt)}
                </span>
              </div>
            </div>

            {/* Amount Change */}
            <div style={styles.amountChangeSection}>
              <div style={{ ...styles.label, color: `${theme.text}99`, marginBottom: '4px' }}>
                Amount Change:
              </div>
              <div style={{ ...styles.amountChangeText, ...getAmountChangeStyle(task, role) }}>
                {getAmountChangeText(task, role)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 获取金额变动文本
 * 冻结点 1.3-14/15：双向抵押语义
 */
function getAmountChangeText(task: Task, role: 'creator' | 'helper'): string {
  // task.reward 已经是格式化后的字符串（来自 useTaskHistory）
  const reward = task.reward;

  if (role === 'creator') {
    switch (task.status) {
      case TaskStatus.Open:
        return `Deposited ${reward} ECHO`;
      case TaskStatus.InProgress:
        return `Deposited ${reward} ECHO (locked)`;
      case TaskStatus.Submitted:
        return `Deposited ${reward} ECHO (under review)`;
      case TaskStatus.Completed:
        const r = parseFloat(reward);
        const helperPaid = (r * 0.98).toFixed(4);
        const feeBurned = (r * 0.02).toFixed(4);
        return `Paid ${helperPaid} ECHO to Helper (Fee ${feeBurned} burned)`;
      case TaskStatus.Cancelled:
        return `Refunded ${reward} ECHO`;
      default:
        return '-';
    }
  } else {
    // Helper
    switch (task.status) {
      case TaskStatus.Open:
        return '-';
      case TaskStatus.InProgress:
        return `Deposited ${reward} ECHO (locked)`;
      case TaskStatus.Submitted:
        return `Deposited ${reward} ECHO (under review)`;
      case TaskStatus.Completed:
        const r = parseFloat(reward);
        const helperReward = (r * 0.98).toFixed(4);
        const feeBurned = (r * 0.02).toFixed(4);
        return `Received ${helperReward} ECHO + Deposit ${reward} refunded (Fee ${feeBurned} burned)`;
      case TaskStatus.Cancelled:
        return `Refunded ${reward} ECHO`;
      default:
        return '-';
    }
  }
}

/**
 * 获取金额变动样式
 */
function getAmountChangeStyle(task: Task, role: 'creator' | 'helper'): React.CSSProperties {
  if (task.status === TaskStatus.Completed) {
    return role === 'creator'
      ? { color: '#d32f2f' } // 红色（支出）
      : { color: '#388e3c' }; // 绿色（收入）
  }
  if (task.status === TaskStatus.Cancelled) {
    return { color: '#388e3c' }; // 绿色（退款）
  }
  return { color: '#666' }; // 灰色（锁定/待定）
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    padding: '8px',
    alignItems: 'start',
  },
  message: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    color: '#999',
    padding: '40px',
    fontSize: '16px',
  },
  errorMessage: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    color: '#d32f2f',
    padding: '40px',
    fontSize: '16px',
  },
  taskCard: {
    width: '100%',
    minHeight: '320px',
    border: '1px solid',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    position: 'relative',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  categoryTag: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    border: '1px solid rgba(45, 45, 45, 0.15)',
  },
  taskTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
    lineHeight: 1.3,
    minHeight: '48px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rewardSection: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '10px',
    alignSelf: 'flex-start',
  },
  rewardAmount: {
    fontSize: '24px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  rewardLabel: {
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  divider: {
    borderTop: '1px solid',
    margin: '4px 0',
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.03em',
  },
  value: {
    fontSize: '12px',
    fontWeight: 500,
  },
  amountChangeSection: {
    marginTop: 'auto',
    paddingTop: '12px',
    borderTop: '1px solid rgba(45, 45, 45, 0.1)',
  },
  amountChangeText: {
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
};
