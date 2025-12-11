import React from 'react';
import { CATEGORY_OPTIONS } from '../../types/category';
import { getCategoryTheme } from '../../utils/categoryTheme';

interface TaskFiltersBarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: 'newest' | 'reward' | 'oldest';
  onSortChange: (sort: 'newest' | 'reward' | 'oldest') => void;
  onRefresh?: () => void;
  onPublish?: () => void;
  refreshDisabled?: boolean;
}

export function TaskFiltersBar({
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  onRefresh,
  onPublish,
  refreshDisabled,
}: TaskFiltersBarProps) {
  const statusOptions = [
    { key: 'all', label: 'ALL' },
    { key: 'open', label: 'OPEN' },
    { key: 'active', label: 'ACTIVE' },
    { key: 'completed', label: 'COMPLETED' },
  ];
  return (
    <div style={styles.container}>
      {/* Category Chips */}
      <div style={styles.section}>
        <div style={styles.chipsRow}>
          <button
            style={{
              ...styles.chip,
              ...(selectedCategory === 'all' ? styles.chipActive : {}),
            }}
            onClick={() => onCategoryChange('all')}
          >
            ALL
          </button>
          {CATEGORY_OPTIONS.map((opt) => {
            const theme = getCategoryTheme(opt.key);
            const isSelected = selectedCategory === opt.key;
            
            return (
              <button
                key={opt.key}
                style={{
                  ...styles.chip,
                  ...(isSelected
                    ? {
                        backgroundColor: theme.accent,
                        borderColor: theme.accent,
                        color: '#fff',
                      }
                    : {}),
                }}
                onClick={() => onCategoryChange(opt.key)}
              >
                {opt.label.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Sort & Actions Row */}
      <div style={styles.row}>
        <div style={styles.searchWrapper}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            style={styles.searchInput}
          />
        </div>

        {/* Status Dropdown */}
        <div style={styles.sortWrapper}>
          <label style={styles.label}>STATUS</label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            style={styles.select}
          >
            {statusOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.sortWrapper}>
          <label style={styles.label}>SORT</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            style={styles.select}
          >
            <option value="newest">NEWEST</option>
            <option value="reward">HIGHEST REWARD</option>
            <option value="oldest">OLDEST</option>
          </select>
        </div>

        {onRefresh && (
          <button
            style={styles.actionButton}
            onClick={onRefresh}
            disabled={refreshDisabled}
          >
            ↻ REFRESH
          </button>
        )}

        {onPublish && (
          <button
            style={{ ...styles.actionButton, ...styles.primaryButton }}
            onClick={onPublish}
          >
            📝 PUBLISH TASK
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '24px',
    background: 'rgba(255, 255, 255, 0.5)',
    border: '1px solid rgba(26, 26, 26, 0.08)',
    borderRadius: '16px',
    backdropFilter: 'blur(20px)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#4A4A4A',
  },
  chipsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  chip: {
    padding: '8px 16px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: '#1A1A1A',
    background: 'rgba(26, 26, 26, 0.05)',
    border: '1px solid rgba(26, 26, 26, 0.12)',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  chipActive: {
    backgroundColor: 'rgba(26, 26, 26, 0.15)',
    borderColor: 'rgba(26, 26, 26, 0.3)',
    color: '#1A1A1A',
  },
  statusChip: {
    padding: '8px 16px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: '#1A1A1A',
    background: 'rgba(26, 26, 26, 0.05)',
    border: '1px solid rgba(26, 26, 26, 0.12)',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  statusChipActive: {
    backgroundColor: 'rgba(26, 26, 26, 0.15)',
    borderColor: 'rgba(26, 26, 26, 0.3)',
    color: '#1A1A1A',
  },
  statusChipCompact: {
    padding: '6px 12px',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: '#1A1A1A',
    background: 'rgba(26, 26, 26, 0.05)',
    border: '1px solid rgba(26, 26, 26, 0.12)',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none',
    minWidth: '50px',
    whiteSpace: 'nowrap',
  },
  statusChipCompactActive: {
    backgroundColor: 'rgba(26, 26, 26, 0.15)',
    borderColor: 'rgba(26, 26, 26, 0.3)',
    color: '#1A1A1A',
  },
  row: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    flex: 1,
    maxWidth: '450px',
    minWidth: '250px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: 400,
    color: '#1A1A1A',
    background: 'rgba(26, 26, 26, 0.05)',
    border: '1px solid rgba(26, 26, 26, 0.12)',
    borderRadius: '10px',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  sortWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '160px',
  },
  select: {
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: '#1A1A1A',
    background: 'rgba(26, 26, 26, 0.05)',
    border: '1px solid rgba(26, 26, 26, 0.12)',
    borderRadius: '10px',
    cursor: 'pointer',
    outline: 'none',
  },
  actionButton: {
    padding: '12px 20px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: '#1A1A1A',
    background: 'rgba(26, 26, 26, 0.06)',
    border: '1px solid rgba(26, 26, 26, 0.12)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none',
    whiteSpace: 'nowrap',
  },
  primaryButton: {
    background: 'rgba(26, 26, 26, 0.12)',
    borderColor: 'rgba(26, 26, 26, 0.2)',
  },
};
