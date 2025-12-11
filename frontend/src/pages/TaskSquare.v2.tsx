import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useTasks, TaskStatus } from '../hooks/useTasks';
import { PageLayoutV2 } from '../components/layout/PageLayout.v2';
import { CardV2 } from '../components/ui/Card.v2';
import { ButtonV2 } from '../components/ui/Button.v2';
import { Alert } from '../components/ui/Alert';
import { TaskCardV2 } from '../components/ui/TaskCard.v2';
import { NetworkGuard } from '../components/ui/NetworkGuard';
import { CATEGORY_OPTIONS, getCategoryLabel } from '../types/category';
import { themeV2 } from '../styles/theme-v2';

/**
 * 任务广场 V2 - 高级科技感设计
 * 保持所有原有逻辑不变，只升级视觉
 */

export function TaskSquareV2() {
  const navigate = useNavigate();
  const { address, chainId, provider } = useWallet();
  const { tasks, loading, error, refresh } = useTasks(provider, chainId);

  // 所有逻辑保持不变
  const [showOngoing, setShowOngoing] = useState<boolean>(false);

  useEffect(() => {
    const cid = chainId?.toString() || 'unknown';
    const key = `taskSquare_showOngoing_${cid}`;
    const saved = sessionStorage.getItem(key);
    setShowOngoing(saved === 'true');
  }, [chainId]);

  // Status filter removed from UI but kept for potential future use
  // const [selectedStatus, setSelectedStatus] = useState<number | null>(TaskStatus.Open);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggleOngoing = (checked: boolean) => {
    setShowOngoing(checked);
    const cid = chainId?.toString() || 'unknown';
    const key = `taskSquare_showOngoing_${cid}`;
    sessionStorage.setItem(key, String(checked));
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    
    if (selectedCategory !== 'all') {
      result = result.filter(task => task.metadata?.category === selectedCategory);
    }
    
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

  const displayTasks = useMemo(() => {
    if (showOngoing) {
      return filteredTasks;
    } else {
      return filteredTasks.filter(task => task.status === TaskStatus.Open);
    }
  }, [filteredTasks, showOngoing]);

  const sortedTasks = useMemo(() => {
    return [...displayTasks].sort((a, b) => {
      const ta = a.createdAt ?? Number(a.taskId);
      const tb = b.createdAt ?? Number(b.createdAt);
      return tb - ta;
    });
  }, [displayTasks]);

  const isNewTask = (task: { createdAt?: number }) => {
    if (!task.createdAt) return false;
    const now = Date.now() / 1000;
    return now - task.createdAt < 24 * 3600;
  };

  if (!address) {
    return (
      <PageLayoutV2 title="Task Square">
        <CardV2>
          <Alert variant="warning">
            Please connect your wallet to view tasks.
          </Alert>
        </CardV2>
      </PageLayoutV2>
    );
  }

  return (
    <PageLayoutV2 title="Task Square">
      <NetworkGuard chainId={chainId}>
        <div style={styles.container}>
          {/* Actions */}
          <div style={styles.actions}>
            <ButtonV2
              variant="secondary"
              onClick={refresh}
              disabled={loading}
            >
              🔄 Refresh
            </ButtonV2>
            <ButtonV2
              variant="primary"
              onClick={() => navigate('/publish')}
            >
              ➕ Publish Task
            </ButtonV2>
          </div>

          {/* Filter Card */}
          <CardV2 glass="medium">
            <div style={styles.filterCard}>
              {/* Header Row */}
              <div style={styles.filterCardHeader}>
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
              
              {/* Controls Row */}
              <div style={styles.controlsRow}>
                <div style={styles.controlItem}>
                  <label style={styles.filterLabel}>Filter by Category</label>
                  <select
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
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title, description, or category..."
                    style={styles.controlInput}
                  />
                </div>
              </div>
            </div>
          </CardV2>

          {/* Loading State */}
          {loading && (
            <CardV2>
              <div style={styles.loadingState}>
                <div style={styles.loadingSpinner}>⏳</div>
                <p style={styles.loadingText}>Loading tasks...</p>
              </div>
            </CardV2>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert variant="error">
              {error}
              <div style={styles.errorActions}>
                <ButtonV2 variant="secondary" size="sm" onClick={refresh}>
                  Retry
                </ButtonV2>
              </div>
            </Alert>
          )}

          {/* Tasks Grid */}
          {!loading && !error && sortedTasks.length > 0 && (
            <div style={styles.taskGrid}>
              {sortedTasks.map(task => {
                const isOpen = task.status === TaskStatus.Open;
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
                    <TaskCardV2 task={task} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && sortedTasks.length === 0 && (
            <CardV2>
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📋</div>
                <h3 style={styles.emptyTitle}>No open tasks found</h3>
                <p style={styles.emptyText}>
                  {searchTerm || selectedCategory !== 'all'
                    ? 'Try adjusting your filters or search terms.'
                    : 'Be the first to publish a task!'}
                </p>
                {!searchTerm && selectedCategory === 'all' && (
                  <ButtonV2
                    variant="primary"
                    onClick={() => navigate('/publish')}
                  >
                    Publish First Task
                  </ButtonV2>
                )}
              </div>
            </CardV2>
          )}
        </div>
      </NetworkGuard>
    </PageLayoutV2>
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  loadingSpinner: {
    fontSize: '32px',
    animation: 'pulse 2s ease-in-out infinite',
  },
  loadingText: {
    fontSize: '16px',
    color: themeV2.colors.text.secondary,
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
    filter: 'grayscale(1) opacity(0.5)',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: themeV2.colors.text.primary,
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: themeV2.colors.text.tertiary,
    marginBottom: '24px',
  },
  filterCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  filterCardHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
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
    color: themeV2.colors.text.secondary,
    whiteSpace: 'nowrap',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: themeV2.colors.text.muted,
    marginBottom: '6px',
    display: 'block',
  },
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
    border: themeV2.colors.border.light,
    borderRadius: themeV2.radius.sm,
    background: themeV2.glass.light.background,
    backdropFilter: themeV2.glass.light.backdropFilter,
    color: themeV2.colors.text.primary,
    cursor: 'pointer',
    outline: 'none',
    transition: `all ${themeV2.transitions.normal}`,
  },
  controlInput: {
    height: '40px',
    padding: '0 12px',
    fontSize: '14px',
    border: themeV2.colors.border.light,
    borderRadius: themeV2.radius.sm,
    background: themeV2.glass.light.background,
    backdropFilter: themeV2.glass.light.backdropFilter,
    color: themeV2.colors.text.primary,
    outline: 'none',
    transition: `all ${themeV2.transitions.normal}`,
    boxSizing: 'border-box',
  },
  taskCardWrapper: {
    position: 'relative',
    transition: `opacity ${themeV2.transitions.normal}`,
  },
  taskCardDimmed: {
    opacity: 0.6,
  },
  newBadge: {
    position: 'absolute',
    top: '-8px',
    right: '12px',
    backgroundColor: themeV2.colors.status.success,
    color: 'white',
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: themeV2.radius.full,
    zIndex: 10,
    boxShadow: themeV2.shadows.md,
  },
};
