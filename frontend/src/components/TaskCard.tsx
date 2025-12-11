import { useNavigate } from 'react-router-dom';
import { Task } from '../hooks/useTasks';
import { TaskStatusLabels } from '../types/task';
import { formatAddress, formatECHO, formatRelativeTime } from '../utils/formatters';

/**
 * 任务卡片组件
 */

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/tasks/${task.taskId}`);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        ...styles.card,
        cursor: 'pointer',
      }}
    >
      {/* 标题 */}
      <h3 style={styles.title}>
        {task.metadata?.title || `Task #${task.taskId}`}
      </h3>

      {/* 描述 */}
      {task.metadata?.description && (
        <p style={styles.description}>
          {task.metadata.description.slice(0, 100)}
          {task.metadata.description.length > 100 ? '...' : ''}
        </p>
      )}

      {/* 信息行 */}
      <div style={styles.info}>
        <div style={styles.infoItem}>
          <span style={styles.label}>Reward:</span>
          <span style={styles.value}>{formatECHO(task.reward)} ECHO</span>
        </div>

        <div style={styles.infoItem}>
          <span style={styles.label}>Creator:</span>
          <span style={styles.value}>{formatAddress(task.creator)}</span>
        </div>

        <div style={styles.infoItem}>
          <span style={styles.label}>Status:</span>
          <span
            style={{
              ...styles.status,
              ...getStatusStyle(task.status),
            }}
          >
            {TaskStatusLabels[task.status]}
          </span>
        </div>

        <div style={styles.infoItem}>
          <span style={styles.label}>Created:</span>
          <span style={styles.value}>{formatRelativeTime(task.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

function getStatusStyle(status: number): React.CSSProperties {
  const colors: Record<number, { bg: string; color: string }> = {
    0: { bg: '#e3f2fd', color: '#1976d2' }, // Open - blue
    1: { bg: '#fff3e0', color: '#f57c00' }, // InProgress - orange
    2: { bg: '#f3e5f5', color: '#7b1fa2' }, // Submitted - purple
    3: { bg: '#e8f5e9', color: '#388e3c' }, // Completed - green
    4: { bg: '#ffebee', color: '#d32f2f' }, // Cancelled - red
  };

  const style = colors[status] || colors[0];
  return {
    backgroundColor: style.bg,
    color: style.color,
  };
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'box-shadow 0.2s',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#333',
  },
  description: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
  },
  label: {
    color: '#999',
  },
  value: {
    color: '#333',
    fontWeight: '500',
  },
  status: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
};
