import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Task } from '../../hooks/useTasks';
import { CardV2 } from './Card.v2';
import { Badge } from './Badge';
import { ButtonV2 } from './Button.v2';
import { getCategoryLabel, getCategoryColor } from '../../types/category';
import { themeV2 } from '../../styles/theme-v2';

export interface TaskCardV2Props {
  task: Task;
}

export function TaskCardV2({ task }: TaskCardV2Props) {
  const navigate = useNavigate();

  const getStatusVariant = (status: number) => {
    const variants: Record<number, 'open' | 'inprogress' | 'submitted' | 'completed' | 'cancelled'> = {
      0: 'open',
      1: 'inprogress',
      2: 'submitted',
      3: 'completed',
      4: 'cancelled',
    };
    return variants[status] || 'open';
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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <CardV2 hover padding="md" glass="medium">
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.titleSection}>
            <div style={styles.titleRow}>
              <h3 style={styles.title}>
                {task.metadata?.title || `Task #${task.taskId}`}
              </h3>
              <div 
                style={{
                  ...styles.categoryBadge,
                  backgroundColor: getCategoryColor(task.metadata?.category),
                }}
              >
                {getCategoryLabel(task.metadata?.category)}
              </div>
            </div>
            <Badge variant={getStatusVariant(task.status)}>
              {getStatusLabel(task.status)}
            </Badge>
          </div>
          <div style={styles.reward}>
            <span style={styles.rewardAmount}>{task.reward}</span>
            <span style={styles.rewardUnit}>ECHO</span>
          </div>
        </div>

        {/* Description */}
        {task.metadata?.description && (
          <p style={styles.description}>
            {task.metadata.description.length > 120
              ? `${task.metadata.description.slice(0, 120)}...`
              : task.metadata.description}
          </p>
        )}

        {/* Metadata Error */}
        {task.metadataError && (
          <div style={styles.metadataError}>
            ⚠️ Metadata failed to load
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.info}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Creator:</span>
              <span style={styles.infoValue}>
                {task.metadata?.creatorNickname 
                  ? `${task.metadata.creatorNickname} (${formatAddress(task.creator)})`
                  : formatAddress(task.creator)}
              </span>
            </div>
            {task.helper !== '0x0000000000000000000000000000000000000000' && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Helper:</span>
                <span style={styles.infoValue}>
                  {task.metadata?.helperNickname
                    ? `${task.metadata.helperNickname} (${formatAddress(task.helper)})`
                    : formatAddress(task.helper)}
                </span>
              </div>
            )}
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Created:</span>
              <span style={styles.infoValue}>{formatTimeAgo(task.createdAt)}</span>
            </div>
          </div>
          <ButtonV2
            variant="primary"
            size="sm"
            onClick={() => navigate(`/tasks/${task.taskId}`)}
          >
            View Details
          </ButtonV2>
        </div>
      </div>
    </CardV2>
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
    gap: '16px',
  },
  titleSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: themeV2.colors.text.primary,
    margin: 0,
    lineHeight: '1.4',
  },
  reward: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  rewardAmount: {
    fontSize: '24px',
    fontWeight: 700,
    background: themeV2.colors.brand.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  rewardUnit: {
    fontSize: '12px',
    color: themeV2.colors.text.muted,
    fontWeight: 500,
  },
  description: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: themeV2.colors.text.tertiary,
    margin: 0,
  },
  metadataError: {
    fontSize: '12px',
    color: themeV2.colors.status.warning,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: '6px 10px',
    borderRadius: themeV2.radius.sm,
    border: `1px solid ${themeV2.colors.border.light}`,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '16px',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  infoItem: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
  },
  infoLabel: {
    color: themeV2.colors.text.muted,
    fontWeight: 500,
    minWidth: '50px',
  },
  infoValue: {
    color: themeV2.colors.text.tertiary,
    fontFamily: 'monospace',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '8px',
    width: '100%',
  },
  categoryBadge: {
    padding: '2px 8px',
    borderRadius: themeV2.radius.full,
    fontSize: '11px',
    fontWeight: 500,
    color: 'white',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
};
