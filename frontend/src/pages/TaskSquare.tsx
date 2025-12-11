import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useTasks, TaskStatus } from '../hooks/useTasks';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { TaskCard } from '../components/ui/TaskCard';
import { NetworkGuard } from '../components/ui/NetworkGuard';
import { CATEGORY_OPTIONS, getCategoryLabel } from '../types/category';
import '../styles/taskSquare.css';

/**
 * 任务广场（P0-F2）
 * 冻结点 2.2-P0-F2：链上读取 + 链下 taskURI
 * Patch：任务广场不显示 Cancelled 状态的任务
 * Chain Isolation: sessionStorage 按链隔离
 */

export function TaskSquare() {
  const navigate = useNavigate();
  const { address, chainId, provider } = useWallet();
  const { tasks, loading, error, refresh } = useTasks(provider, chainId);

  // Community toggle: show ongoing tasks (按链隔离存储)
  const [showOngoing, setShowOngoing] = useState<boolean>(false);

  // 从 sessionStorage 读取偏好（按链隔离，避免初始化时机问题）
  useEffect(() => {
    const cid = chainId?.toString() || 'unknown';
    const key = `taskSquare_showOngoing_${cid}`;
    const saved = sessionStorage.getItem(key);
    setShowOngoing(saved === 'true');
  }, [chainId]);

  // Open-only: 默认只显示 Open 状态任务
  const [selectedStatus, setSelectedStatus] = useState<number | null>(TaskStatus.Open);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 保存 toggle 状态到 sessionStorage（按链隔离）
  const handleToggleOngoing = (checked: boolean) => {
    setShowOngoing(checked);
    const cid = chainId?.toString() || 'unknown';
    const key = `taskSquare_showOngoing_${cid}`;
    sessionStorage.setItem(key, String(checked));
  };

  // 过滤任务（Category + Search，不含 status 过滤）
  const filteredTasks = useMemo(() => {
    let result = tasks;
    
    // 1. Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(task => task.metadata?.category === selectedCategory);
    }
    
    // 2. Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(task => {
        const title = task.metadata?.title?.toLowerCase() || '';
        const description = task.metadata?.description?.toLowerCase() || '';
        const categoryLabel = getCategoryLabel(task.metadata?.category).toLowerCase();
        return title.includes(term) || description.includes(term) || categoryLabel.includes(term);
      });
    }
    
    return result;
  }, [tasks, selectedCategory, searchTerm]);

  // Community toggle: 根据 showOngoing 决定显示哪些任务
  const displayTasks = useMemo(() => {
    if (showOngoing) {
      // 显示所有状态的任务
      return filteredTasks;
    } else {
      // 只显示 Open 任务（默认行为）
      return filteredTasks.filter(task => task.status === TaskStatus.Open);
    }
  }, [filteredTasks, showOngoing]);

  // 排序：最新在上（按 createdAt 倒序）
  const sortedTasks = useMemo(() => {
    return [...displayTasks].sort((a, b) => {
      const ta = a.createdAt ?? Number(a.taskId);
      const tb = b.createdAt ?? Number(b.createdAt);
      return tb - ta; // 倒序：最新在上
    });
  }, [displayTasks]);

  // 判断是否为新任务（24小时内）
  const isNewTask = (task: { createdAt?: number }) => {
    if (!task.createdAt) return false;
    const now = Date.now() / 1000;
    return now - task.createdAt < 24 * 3600;
  };

  if (!address) {
    return (
      <PageLayout title="Task Square">
        <Card>
          <Alert variant="warning">
            Please connect your wallet to view tasks.
          </Alert>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Task Square">
      <NetworkGuard chainId={chainId}>
        <div style={styles.container}>
          {/* Actions */}
          <div style={styles.actions}>
            <Button
              variant="secondary"
              onClick={refresh}
              disabled={loading}
            >
              🔄 Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/publish')}
            >
              ➕ Publish Task
            </Button>
          </div>

          {/* Filter Card - Open Tasks Only */}
          <Card>
            <div style={styles.filterCard}>
              {/* Header Row: Toggle only (title hidden) */}
              <div style={styles.filterCardHeader}>
                {/* Title hidden for cleaner UI */}
                <h3 style={{ ...styles.filterCardTitle, display: 'none' }}>Filter Open Tasks</h3>
                
                {/* Community toggle: show ongoing tasks */}
                <label style={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={showOngoing}
                    onChange={(e) => handleToggleOngoing(e.target.checked)}
                    style={styles.toggleCheckbox}
                  />
                  <span style={styles.toggleText}>Show ongoing</span>
                </label>
              </div>
              
              {/* Toggle hint text - hidden for cleaner UI */}
              {false && showOngoing && (
                <div style={styles.toggleHintText}>
                  Showing all tasks including in-progress and completed
                </div>
              )}
              
              {/* Status Row - Hidden (保留逻辑，隐藏 UI) */}
              <div style={{ display: 'none' }}>
                <label style={styles.filterLabel}>Status</label>
                <div className="status-pills-responsive" style={styles.statusPills}>
                  {[
                    { value: null, label: 'All' },
                    { value: 0, label: 'Open' },
                    { value: 1, label: 'In Progress' },
                    { value: 2, label: 'Submitted' },
                  ].map(option => {
                    const isSelected = selectedStatus === option.value;

                    return (
                      <button
                        key={option.value?.toString() || 'all'}
                        className="status-pill-responsive"
                        onClick={() => setSelectedStatus(option.value)}
                        style={{
                          ...styles.statusPill,
                          ...(isSelected ? styles.statusPillActive : styles.statusPillInactive),
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Controls Row */}
              <div className="controls-row-responsive" style={styles.controlsRow}>
                <div style={styles.controlItem}>
                  <label style={styles.filterLabel}>Filter by Category</label>
                  <select
                    className="control-select-responsive"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={styles.controlSelect}
                  >
                    <option value="all">All Categories</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.controlItem}>
                  <label style={styles.filterLabel}>Search Tasks</label>
                  <input
                    className="control-input-responsive"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title, description, or category..."
                    style={styles.controlInput}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Loading State */}
          {loading && (
            <Card>
              <div style={styles.loadingState}>
                <p style={styles.loadingText}>Loading tasks...</p>
              </div>
            </Card>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert variant="error">
              {error}
              <div style={styles.errorActions}>
                <Button variant="secondary" size="sm" onClick={refresh}>
                  Retry
                </Button>
              </div>
            </Alert>
          )}

          {/* Tasks Grid - Sorted by newest first */}
          {!loading && !error && sortedTasks.length > 0 && (
            <div style={styles.taskGrid}>
              {sortedTasks.map(task => {
                const isOpen = task.status === TaskStatus.Open;
                // 视觉弱化：非 Open 任务在 showOngoing 模式下降低透明度
                const shouldDim = !isOpen && showOngoing;
                
                return (
                  <div 
                    key={task.taskId} 
                    style={{
                      ...styles.taskCardWrapper,
                      ...(shouldDim ? styles.taskCardDimmed : {}),
                    }}
                  >
                    {isNewTask(task) && (
                      <div style={styles.newBadge}>✨ New</div>
                    )}
                    <TaskCard task={task} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && sortedTasks.length === 0 && (
            <Card>
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📋</div>
                <h3 style={styles.emptyTitle}>No open tasks found</h3>
                <p style={styles.emptyText}>
                  {searchTerm || selectedCategory !== 'all'
                    ? 'Try adjusting your filters or search terms.'
                    : 'Be the first to publish a task!'}
                </p>
                {!searchTerm && selectedCategory === 'all' && (
                  <Button
                    variant="primary"
                    onClick={() => navigate('/publish')}
                  >
                    Publish First Task
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </NetworkGuard>
    </PageLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  loadingState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
  },
  errorActions: {
    marginTop: '12px',
  },
  taskGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
  },
  // Unified Filter Card Styles
  filterCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  filterCardHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: '8px',
  },
  filterCardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  // Community toggle styles (in filter card header)
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  toggleCheckbox: {
    cursor: 'pointer',
    width: '16px',
    height: '16px',
    margin: 0,
  },
  toggleText: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#6b7280',
    whiteSpace: 'nowrap',
  },
  toggleHintText: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '-8px',
    marginBottom: '8px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#6b7280',
    marginBottom: '6px',
    display: 'block',
  },
  // Status Pills Row
  statusRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statusPills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    overflowX: 'auto',
  },
  statusPill: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    outline: 'none',
  },
  statusPillActive: {
    backgroundColor: '#3b82f6',
    color: 'white',
  },
  statusPillInactive: {
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
  },
  pillCount: {
    fontSize: '12px',
    opacity: 0.8,
  },
  // Controls Row (Category + Search)
  controlsRow: {
    display: 'grid',
    gridTemplateColumns: '35% 65%',
    gap: '12px',
  },
  controlItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  controlSelect: {
    height: '40px',
    padding: '0 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  controlInput: {
    height: '40px',
    padding: '0 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  // New Task Badge Styles
  taskCardWrapper: {
    position: 'relative',
    transition: 'opacity 0.2s',
  },
  taskCardDimmed: {
    opacity: 0.7,
  },
  newBadge: {
    position: 'absolute',
    top: '-8px',
    right: '12px',
    backgroundColor: '#10b981',
    color: 'white',
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '12px',
    zIndex: 10,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
};
