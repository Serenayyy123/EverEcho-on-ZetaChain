import React from 'react';
import { getCategorySuccessTheme } from '../../utils/categoryTheme';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  category?: string; // 可选的category，用于主题色
}

export function Card({ children, className = '', padding = 'lg', hover = false, category }: CardProps) {
  // 如果有category，使用category主题色
  const categoryTheme = category ? getCategorySuccessTheme(category) : null;
  const paddingStyles: Record<string, string> = {
    sm: '16px',
    md: '24px',
    lg: '32px',
  };

  const baseStyles: React.CSSProperties = categoryTheme ? {
    backgroundColor: categoryTheme.background,
    borderRadius: '12px',
    padding: paddingStyles[padding],
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: `1px solid ${categoryTheme.border}`,
    transition: 'all 0.2s',
  } : {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: paddingStyles[padding],
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(26, 26, 26, 0.08)',
    transition: 'all 0.2s',
  };

  const hoverStyles: React.CSSProperties = hover ? {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
    borderColor: 'rgba(26, 26, 26, 0.12)',
  } : {};

  return (
    <div
      className={className}
      style={baseStyles}
      onMouseEnter={(e) => {
        if (hover) {
          Object.assign(e.currentTarget.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.08)';
        }
      }}
    >
      {children}
    </div>
  );
}
