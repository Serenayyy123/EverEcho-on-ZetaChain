import React from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { Task } from '../../hooks/useTasks';
import { getCategoryFullTheme, getCategoryAnimation } from '../../utils/categoryTheme';

interface TaskCard3DProps {
  task: Task;
  index: number;
  activeIndex: number;
  totalCards: number;
}

export function TaskCard3D({ task, index, activeIndex, totalCards }: TaskCard3DProps) {
  const navigate = useNavigate();
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
  
  // Debug: 打印任务和主题信息
  if (index === activeIndex) {
    console.log('🎨 Active Card:', {
      taskId: task.taskId,
      category: task.metadata?.category,
      theme: theme,
      animation: animationPath,
    });
  }
  
  const offset = index - activeIndex;
  const absOffset = Math.abs(offset);
  
  // 2D 横向滑动 - 中心最大最亮，两侧缩小变暗
  const isActive = offset === 0;
  const scale = isActive ? 1 : 0.85;
  const opacity = isActive ? 1 : 0.5;
  const translateX = offset * 400;
  
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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'JUST NOW';
    if (diff < 3600) return `${Math.floor(diff / 60)}M AGO`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}H AGO`;
    return `${Math.floor(diff / 86400)}D AGO`;
  };

  return (
    <div
      style={{
        ...styles.cardWrapper,
        transform: `translateX(${translateX}px) scale(${scale})`,
        opacity,
        zIndex: totalCards - absOffset,
        pointerEvents: isActive ? 'auto' : 'none',
      }}
      onClick={() => isActive && navigate(`/tasks/${task.taskId}`)}
    >
      <div
        style={{
          ...styles.card,
          background: theme.bg,
          borderColor: theme.border,
          boxShadow: isActive
            ? `0 12px 40px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)`
            : `0 8px 24px rgba(0,0,0,0.2)`,
          filter: isActive ? 'brightness(1)' : 'brightness(0.85)',
        }}
      >
        {/* Lottie Animation */}
        {animationData && (
          <div style={styles.animationContainer}>
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={isActive}
              style={styles.animation}
            />
          </div>
        )}

        {/* Category Tag */}
        <div
          style={{
            ...styles.categoryTag,
            backgroundColor: theme.accent,
          }}
        >
          {theme.label.toUpperCase()}
        </div>

        {/* Status Badge */}
        <div style={{ ...styles.statusBadge, backgroundColor: theme.tag, color: theme.text }}>
          {getStatusLabel(task.status)}
        </div>

        {/* Title */}
        <h3 style={{ ...styles.title, color: theme.text }}>
          {task.metadata?.title || `Task #${task.taskId}`}
        </h3>

        {/* Description */}
        {task.metadata?.description && (
          <p style={{ ...styles.description, color: `${theme.text}cc` }}>
            {task.metadata.description.length > 100
              ? `${task.metadata.description.slice(0, 100)}...`
              : task.metadata.description}
          </p>
        )}

        {/* Reward - 特殊样式 */}
        <div style={styles.rewardContainer}>
          <div style={styles.rewardBox}>
            <span style={{ ...styles.rewardAmount, color: theme.text }}>{task.reward}</span>
            <span style={{ ...styles.rewardLabel, color: `${theme.text}99` }}>ECHO</span>
          </div>
        </div>

        {/* Meta Info */}
        <div style={styles.metaSection}>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>CREATOR</span>
            <span style={styles.metaValue}>
              {task.metadata?.creatorNickname || formatAddress(task.creator)}
            </span>
          </div>
          {task.helper !== '0x0000000000000000000000000000000000000000' && (
            <div style={styles.metaRow}>
              <span style={styles.metaLabel}>HELPER</span>
              <span style={styles.metaValue}>
                {task.metadata?.helperNickname || formatAddress(task.helper)}
              </span>
            </div>
          )}
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>CREATED</span>
            <span style={styles.metaValue}>{formatTimeAgo(task.createdAt)}</span>
          </div>
        </div>

        {/* Hover Glow Border */}
        {isActive && (
          <div
            style={{
              ...styles.glowBorder,
              boxShadow: `inset 0 0 20px ${theme.glow}`,
            }}
          />
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  cardWrapper: {
    position: 'absolute',
    width: '360px',
    height: '520px',
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    cursor: 'pointer',
  },
  card: {
    width: '100%',
    height: '100%',
    border: '1px solid',
    borderRadius: '24px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.4s ease',
  },
  animationContainer: {
    width: '100%',
    height: '180px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '8px',
  },
  animation: {
    width: '160px',
    height: '160px',
  },
  categoryTag: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    position: 'absolute',
    top: '20px',
    right: '20px',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.05em',
    color: 'rgba(45, 45, 45, 0.8)',
  },
  statusBadge: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    alignSelf: 'flex-start',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    border: '1px solid rgba(45, 45, 45, 0.15)',
  },
  title: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    fontSize: '20px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    margin: 0,
    lineHeight: 1.3,
    minHeight: '54px',
  },
  description: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    fontSize: '14px',
    lineHeight: 1.5,
    margin: 0,
    flex: 1,
  },
  rewardContainer: {
    paddingTop: '16px',
    borderTop: '1px solid rgba(45, 45, 45, 0.12)',
  },
  rewardBox: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: '6px',
    padding: '6px 14px',
    background: 'rgba(255, 255, 255, 0.25)',
    borderRadius: '10px',
    backdropFilter: 'blur(4px)',
  },
  rewardAmount: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    fontSize: '28px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  rewardLabel: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  metaSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.05em',
    color: 'rgba(45, 45, 45, 0.5)',
  },
  metaValue: {
    fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
    fontSize: '11px',
    fontWeight: 500,
    color: 'rgba(45, 45, 45, 0.75)',
  },
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '16px',
    pointerEvents: 'none',
  },
};
