import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useTasks, TaskStatus } from '../hooks/useTasks';
import { DarkPageLayout } from '../components/layout/DarkPageLayout';
import { TaskCarousel3D } from '../components/tasksquare/TaskCarousel3D';
import { TaskFiltersBar } from '../components/tasksquare/TaskFiltersBar';
import { getCategoryLabel } from '../types/category';

/**
 * TaskSquare V2 - 3D 卡片展厅风格
 * 纯 UI 升级，不改任何业务逻辑
 */

export function TaskSquareV2() {
  console.log('🎨 TaskSquareV2 LOADED - Category Theme Cards Active');
  const navigate = useNavigate();
  const { address, chainId, provider } = useWallet();
  const { tasks, loading, error, refresh } = useTasks(provider, chainId);

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'reward' | 'oldest'>('newest');

  // 从 sessionStorage 读取偏好（按链隔离）
  useEffect(() => {
    const cid = chainId?.toString() || 'unknown';
    const key = `taskSquare_selectedStatus_${cid}`;
    const saved = sessionStorage.getItem(key);
    setSelectedStatus(saved || 'all');
  }, [chainId]);

  // 保存状态筛选偏好
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    const cid = chainId?.toString() || 'unknown';
    const key = `taskSquare_selectedStatus_${cid}`;
    sessionStorage.setItem(key, status);
  };

  // 过滤任务
  const filteredTasks = useMemo(() => {
    let result = tasks;
    
    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(task => task.metadata?.category === selectedCategory);
    }
    
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(task => {
        const title = task.metadata?.title?.toLowerCase() || '';
        const description = task.metadata?.description?.toLowerCase() || '';
        const categoryLabel = getCategoryLabel(task.metadata?.category).toLowerCase();
        return title.includes(term) || description.includes(term) || categoryLabel.includes(term);
      });
    }
    
    // Status filter
    if (selectedStatus !== 'all') {
      result = result.filter(task => {
        switch (selectedStatus) {
          case 'open':
            return task.status === TaskStatus.Open;
          case 'active':
            return task.status === TaskStatus.InProgress || task.status === TaskStatus.Submitted;
          case 'completed':
            return task.status === TaskStatus.Completed || task.status === TaskStatus.Cancelled;
          default:
            return true;
        }
      });
    }
    
    return result;
  }, [tasks, selectedCategory, searchTerm, selectedStatus]);

  // 排序任务
  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    
    if (sortBy === 'newest') {
      sorted.sort((a, b) => {
        const ta = a.createdAt ?? Number(a.taskId);
        const tb = b.createdAt ?? Number(b.taskId);
        return tb - ta;
      });
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => {
        const ta = a.createdAt ?? Number(a.taskId);
        const tb = b.createdAt ?? Number(b.taskId);
        return ta - tb;
      });
    } else if (sortBy === 'reward') {
      sorted.sort((a, b) => parseFloat(b.reward) - parseFloat(a.reward));
    }
    
    return sorted;
  }, [filteredTasks, sortBy]);

  if (!address) {
    return (
      <DarkPageLayout title="Task Square">
        <div style={styles.centerMessage}>
          <h2 style={styles.messageTitle}>CONNECT WALLET</h2>
          <p style={styles.messageText}>
            Please connect your wallet to view tasks
          </p>
        </div>
      </DarkPageLayout>
    );
  }

  return (
    <DarkPageLayout showNav={true} fullWidth={true}>
      <div style={styles.scrollContainer}>
        <div style={styles.container}>
          {/* Filters */}
          <TaskFiltersBar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedStatus={selectedStatus}
            onStatusChange={handleStatusChange}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onRefresh={refresh}
            onPublish={() => navigate('/publish')}
            refreshDisabled={loading}
          />

          {/* Loading State */}
          {loading && (
            <div style={styles.centerMessage}>
              <div style={styles.loadingSpinner}>⏳</div>
              <p style={styles.messageText}>LOADING TASKS...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div style={styles.centerMessage}>
              <h2 style={styles.messageTitle}>ERROR</h2>
              <p style={styles.messageText}>{error}</p>
              <button style={styles.actionButton} onClick={refresh}>
                RETRY
              </button>
            </div>
          )}

          {/* 3D Carousel */}
          {!loading && !error && (
            <TaskCarousel3D tasks={sortedTasks} />
          )}
        </div>
      </div>
    </DarkPageLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  scrollContainer: {
    width: '100%',
    height: '100vh',
    overflow: 'auto',
    overflowX: 'hidden',
  },
  container: {
    minHeight: '100%',
    background: 'linear-gradient(135deg, #F5F3ED 0%, #E8E6DD 100%)',
    padding: '20px 24px',
    width: '100%',
  },
  centerMessage: {
    textAlign: 'center',
    padding: '80px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  messageTitle: {
    fontSize: '24px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: '#1A1A1A',
    margin: 0,
  },
  messageText: {
    fontSize: '14px',
    color: '#4A4A4A',
    margin: 0,
  },
  loadingSpinner: {
    fontSize: '48px',
    animation: 'pulse 2s ease-in-out infinite',
  },
  actionButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A1A1A',
    background: 'rgba(26, 26, 26, 0.08)',
    border: '1px solid rgba(26, 26, 26, 0.12)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
