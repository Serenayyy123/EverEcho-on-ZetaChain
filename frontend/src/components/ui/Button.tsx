import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  theme?: 'dark' | 'light'; // 新增：支持主题切换
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  theme = 'dark', // 默认深色主题
  ...props
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: '8px',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled || loading ? 0.6 : 1,
  };

  // 深色主题样式（原有样式）
  const darkVariantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'rgba(102, 126, 234, 0.8)',
      color: 'white',
      border: '1px solid rgba(102, 126, 234, 0.5)',
    },
    secondary: {
      backgroundColor: 'rgba(107, 114, 128, 0.3)',
      color: '#e5e7eb',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    success: {
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      color: 'white',
      border: '1px solid rgba(16, 185, 129, 0.5)',
    },
    danger: {
      backgroundColor: 'rgba(239, 68, 68, 0.8)',
      color: 'white',
      border: '1px solid rgba(239, 68, 68, 0.5)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'rgba(255, 255, 255, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
  };

  // 浅色主题样式（适配 TaskSquareV2 风格）
  const lightVariantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#2563eb',
      color: 'white',
      border: '1px solid #2563eb',
    },
    secondary: {
      backgroundColor: 'rgba(26, 26, 26, 0.08)',
      color: '#1A1A1A',
      border: '1px solid rgba(26, 26, 26, 0.12)',
    },
    success: {
      backgroundColor: '#FF6B35',
      color: 'white',
      border: '1px solid #FF6B35',
    },
    danger: {
      backgroundColor: '#ef4444',
      color: 'white',
      border: '1px solid #ef4444',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#1A1A1A',
      border: '1px solid rgba(26, 26, 26, 0.12)',
    },
  };

  const variantStyles = theme === 'light' ? lightVariantStyles : darkVariantStyles;

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: '6px 12px',
      fontSize: '14px',
    },
    md: {
      padding: '10px 20px',
      fontSize: '16px',
    },
    lg: {
      padding: '14px 28px',
      fontSize: '18px',
    },
  };

  const hoverStyles: React.CSSProperties = !disabled && !loading ? {
    filter: 'brightness(0.9)',
  } : {};

  return (
    <button
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...sizeStyles[size],
      }}
      disabled={disabled || loading}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.filter = 'none';
        }
      }}
      {...props}
    >
      {loading && (
        <span style={{ marginRight: '8px' }}>
          <Spinner />
        </span>
      )}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      style={{
        animation: 'spin 1s linear infinite',
        width: '16px',
        height: '16px',
      }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        style={{ opacity: 0.25 }}
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        style={{ opacity: 0.75 }}
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}
