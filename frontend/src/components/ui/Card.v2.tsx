import React from 'react';
import { themeV2 } from '../../styles/theme-v2';

export interface CardV2Props {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glass?: 'light' | 'medium' | 'strong';
  glow?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function CardV2({
  children,
  padding = 'md',
  hover = false,
  glass = 'medium',
  glow = false,
  onClick,
  style,
}: CardV2Props) {
  const paddingValues = {
    none: '0',
    sm: themeV2.spacing.md,
    md: themeV2.spacing.lg,
    lg: themeV2.spacing.xl,
  };

  const glassStyle = themeV2.glass[glass];

  const baseStyles: React.CSSProperties = {
    background: glassStyle.background,
    backdropFilter: glassStyle.backdropFilter,
    WebkitBackdropFilter: glassStyle.backdropFilter,
    border: glassStyle.border,
    borderRadius: themeV2.radius.lg,
    padding: paddingValues[padding],
    boxShadow: glow ? themeV2.shadows.glow : themeV2.shadows.md,
    transition: `all ${themeV2.transitions.normal}`,
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const finalStyles: React.CSSProperties = {
    ...baseStyles,
    ...(hover && isHovered
      ? {
          transform: 'translateY(-4px)',
          boxShadow: glow ? themeV2.shadows.glowHover : themeV2.shadows.lg,
          background: themeV2.colors.bg.cardHover,
        }
      : {}),
  };

  return (
    <div
      style={finalStyles}
      onClick={onClick}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
    >
      {children}
    </div>
  );
}
