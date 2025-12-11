import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'open' | 'inprogress' | 'submitted' | 'completed' | 'cancelled' | 'info' | 'warning' | 'error';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'info', size = 'md' }: BadgeProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    open: {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
    },
    inprogress: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
    },
    submitted: {
      backgroundColor: '#ede9fe',
      color: '#6b21a8',
    },
    completed: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
    },
    cancelled: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
    },
    info: {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
    },
    warning: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
    },
    error: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
    },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: '2px 8px',
      fontSize: '12px',
    },
    md: {
      padding: '4px 12px',
      fontSize: '14px',
    },
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 500,
    borderRadius: '9999px',
    whiteSpace: 'nowrap',
  };

  return (
    <span
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...sizeStyles[size],
      }}
    >
      {children}
    </span>
  );
}
