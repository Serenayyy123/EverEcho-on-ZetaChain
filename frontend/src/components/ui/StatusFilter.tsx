import React from 'react';
import { Button } from './Button';

export interface StatusFilterProps {
  selectedStatus: number | null;
  onStatusChange: (status: number | null) => void;
  taskCounts?: Record<number, number>;
}

export function StatusFilter({ selectedStatus, onStatusChange, taskCounts = {} }: StatusFilterProps) {
  const statusOptions = [
    { value: null, label: 'All', variant: 'secondary' as const },
    { value: 0, label: 'Open', variant: 'primary' as const },
    { value: 1, label: 'In Progress', variant: 'secondary' as const },
    { value: 2, label: 'Submitted', variant: 'secondary' as const },
    { value: 3, label: 'Completed', variant: 'success' as const },
    { value: 4, label: 'Cancelled', variant: 'secondary' as const },
  ];

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Filter by Status</h3>
      <div style={styles.buttonGroup}>
        {statusOptions.map(option => {
          const isSelected = selectedStatus === option.value;
          const count = option.value === null 
            ? Object.values(taskCounts).reduce((sum, count) => sum + count, 0)
            : taskCounts[option.value] || 0;

          return (
            <Button
              key={option.value?.toString() || 'all'}
              variant={isSelected ? option.variant : 'ghost'}
              size="sm"
              onClick={() => onStatusChange(option.value)}
              style={{
                ...styles.filterButton,
                ...(isSelected ? styles.filterButtonActive : {}),
              }}
            >
              {option.label}
              {count > 0 && (
                <span style={styles.count}>({count})</span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '12px',
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  filterButton: {
    position: 'relative',
  },
  filterButtonActive: {
    fontWeight: 600,
  },
  count: {
    marginLeft: '6px',
    fontSize: '12px',
    opacity: 0.8,
  },
};
