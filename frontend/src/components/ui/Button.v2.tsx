import React from 'react';
import { themeV2 } from '../../styles/theme-v2';

export interface ButtonV2Props {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}

export function ButtonV2({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  style,
}: ButtonV2Props) {
  const [isHovered, setIsHovered] = React.useState(false);

  const sizeStyles = {
    sm: {
      padding: `${themeV2.spacing.sm} ${themeV2.spacing.md}`,
      fontSize: '14px',
    },
    md: {
      padding: `${themeV2.spacing.md} ${themeV2.spacing.lg}`,
      fontSize: '16px',
    },
    lg: {
      padding: `${themeV2.spacing.lg} ${themeV2.spacing.xl}`,
      fontSize: '18px',
    },
  };

  const variantStyles = {
    primary: {
      background: themeV2.colors.brand.gradient,
      color: themeV2.colors.text.primary,
      border: 'none',
      boxShadow: themeV2.shadows.md,
    },
    secondary: {
      background: themeV2.glass.medium.background,
      color: themeV2.colors.text.primary,
      border: themeV2.glass.medium.border,
      backdropFilter: themeV2.glass.medium.backdropFilter,
    },
    ghost: {
      background: 'transparent',
      color: themeV2.colors.text.secondary,
      border: 'none',
    },
    danger: {
      background: themeV2.colors.status.error,
      color: themeV2.colors.text.primary,
      border: 'none',
      boxShadow: themeV2.shadows.md,
    },
  };

  const baseStyles: React.CSSProperties = {
    ...sizeStyles[size],
    ...variantStyles[variant],
    borderRadius: themeV2.radius.md,
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: `all ${themeV2.transitions.normal}`,
    width: fullWidth ? '100%' : 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: themeV2.spacing.sm,
    outline: 'none',
    ...style,
  };

  const hoverStyles: React.CSSProperties =
    isHovered && !disabled && !loading
      ? {
          transform: 'translateY(-2px)',
          boxShadow: variant === 'primary' || variant === 'danger' ? themeV2.shadows.lg : themeV2.shadows.md,
          filter: 'brightness(1.1)',
        }
      : {};

  return (
    <button
      type={type}
      style={{ ...baseStyles, ...hoverStyles }}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {loading && <span>⏳</span>}
      {children}
    </button>
  );
}
