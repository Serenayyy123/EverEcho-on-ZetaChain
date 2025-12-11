import React from 'react';
import Lottie from 'lottie-react';
import { getCategoryFullTheme, getCategoryAnimation } from '../../utils/categoryTheme';

interface Task {
  taskId: string;
  status: number;
  reward: string;
  metadata?: {
    title?: string;
    category?: string;
    description?: string;
  };
}

interface TaskDetailHeroProps {
  task: Task;
  children?: React.ReactNode;
}

export function TaskDetailHero({ task, children }: TaskDetailHeroProps) {
  const theme = getCategoryFullTheme(task.metadata?.category);
  const animationPath = getCategoryAnimation(task.metadata?.category);
  const [animationData, setAnimationData] = React.useState<any>(null);

  // 加载动画数据
  React.useEffect(() => {
    fetch(animationPath)
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error('Failed to load animation:', err));
  }, [animationPath]);

  const getStatusLabel = (status: number) => {
    const labels: Record<number, string> = {
      0: 'OPEN',
      1: 'IN PROGRESS',
      2: 'SUBMITTED',
      3: 'COMPLETED',
      4: 'CANCELLED',
    };
    return labels[status] || 'UNKNOWN';
  };

  return (
    <div
      style={{
        ...styles.heroCard,
        background: theme.bg,
        borderColor: theme.border,
      }}
    >
      {/* Category Tag */}
      <div
        style={{
          ...styles.categoryTag,
          backgroundColor: theme.accent,
        }}
      >
        {theme.label.toUpperCase()}
      </div>

      {/* Lottie Animation */}
      {animationData && (
        <div style={styles.animationContainer}>
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={styles.animation}
          />
        </div>
      )}

      {/* Title & Status */}
      <div style={styles.titleSection}>
        <h1 style={{ ...styles.title, color: theme.text }}>
          {task.metadata?.title || `Task #${task.taskId}`}
        </h1>
        <div style={{ ...styles.statusBadge, backgroundColor: theme.tag, color: theme.text }}>
          {getStatusLabel(task.status)}
        </div>
      </div>

      {/* Reward Display */}
      <div style={styles.rewardContainer}>
        <div style={styles.rewardBox}>
          <span style={{ ...styles.rewardAmount, color: theme.text }}>{task.reward}</span>
          <span style={{ ...styles.rewardLabel, color: `${theme.text}99` }}>ECHO</span>
        </div>
      </div>

      {/* Description (if exists) */}
      {task.metadata?.description && (
        <div style={styles.descriptionSection}>
          <h3 style={{ ...styles.sectionTitle, color: theme.text }}>Description</h3>
          <p style={{ ...styles.descriptionText, color: `${theme.text}dd` }}>
            {task.metadata.description}
          </p>
        </div>
      )}

      {/* Content Area - All other components */}
      {children && (
        <div style={styles.contentArea}>
          {children}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heroCard: {
    maxWidth: '800px',
    width: '100%',
    margin: '0 auto 24px auto',
    border: '1px solid',
    borderRadius: '24px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    position: 'relative',
    overflow: 'visible',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
  },
  categoryTag: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    position: 'absolute',
    top: '24px',
    right: '24px',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0.05em',
    color: 'rgba(45, 45, 45, 0.8)',
  },
  animationContainer: {
    width: '100%',
    height: '160px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '140px',
    height: '140px',
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  },
  title: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    fontSize: '32px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    margin: 0,
    textAlign: 'center',
    lineHeight: 1.3,
  },
  statusBadge: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    padding: '6px 16px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    border: '1px solid rgba(45, 45, 45, 0.15)',
  },
  rewardContainer: {
    paddingTop: '16px',
    borderTop: '1px solid rgba(45, 45, 45, 0.12)',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  rewardBox: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: '8px',
    padding: '8px 20px',
    background: 'rgba(255, 255, 255, 0.25)',
    borderRadius: '12px',
    backdropFilter: 'blur(4px)',
  },
  rewardAmount: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    fontSize: '36px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  rewardLabel: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  descriptionSection: {
    width: '100%',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.25)',
    borderRadius: '12px',
    backdropFilter: 'blur(4px)',
  },
  sectionTitle: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 12px 0',
    letterSpacing: '0.02em',
  },
  descriptionText: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    fontSize: '14px',
    lineHeight: 1.6,
    margin: 0,
  },
  contentArea: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
};
