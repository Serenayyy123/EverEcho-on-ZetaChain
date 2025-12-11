import React from 'react';
import { getCategorySuccessTheme } from '../../utils/categoryTheme';

export interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onClose?: () => void;
  category?: string; // 可选的category，用于success variant的主题色
}

export function Alert({ children, variant = 'info', title, onClose, category }: AlertProps) {
  // 如果是success variant，使用category主题色（没有category时使用默认的other灰色）
  const successTheme = variant === 'success' 
    ? getCategorySuccessTheme(category)
    : null;
  const variantStyles: Record<string, React.CSSProperties> = {
    info: {
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      borderColor: 'rgba(37, 99, 235, 0.3)',
      color: '#93c5fd',
    },
    success: {
      backgroundColor: successTheme?.background || '#F5F5F5',
      borderColor: successTheme?.border || '#E8E8E8',
      color: successTheme?.text || '#4A4A4A',
    },
    warning: {
      backgroundColor: 'rgba(245, 158, 11, 0.08)',
      borderColor: 'rgba(245, 158, 11, 0.2)',
      color: '#d97706',
    },
    error: {
      backgroundColor: 'rgba(234, 88, 12, 0.06)',
      borderColor: 'rgba(234, 88, 12, 0.15)',
      color: '#c2410c',
    },
  };

  const icons: Record<string, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  const baseStyles: React.CSSProperties = {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid',
    marginBottom: '16px',
    position: 'relative',
  };

  return (
    <div
      style={{
        ...baseStyles,
        ...variantStyles[variant],
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <span style={{ fontSize: '16px', flexShrink: 0 }}>{icons[variant]}</span>
        <div style={{ flex: 1 }}>
          {title && (
            <p style={{ fontWeight: 600, marginBottom: '4px', fontSize: '14px' }}>
              {title}
            </p>
          )}
          <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
            {children}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0 4px',
              color: 'inherit',
              opacity: 0.6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6';
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
