/**
 * UI V2 Theme Tokens
 * 高级科技感设计系统
 */

export const themeV2 = {
  // 色彩系统 - 深色科技感
  colors: {
    // 背景
    bg: {
      primary: '#0a0e1a',      // 深蓝黑背景
      secondary: '#111827',     // 次级背景
      tertiary: '#1a1f2e',      // 三级背景
      card: 'rgba(17, 24, 39, 0.6)',  // 玻璃卡片
      cardHover: 'rgba(17, 24, 39, 0.8)',
      gradient: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 100%)',
    },
    
    // 文字
    text: {
      primary: '#f9fafb',       // 主文字
      secondary: '#d1d5db',     // 次级文字
      tertiary: '#9ca3af',      // 三级文字
      muted: '#6b7280',         // 弱化文字
    },
    
    // 品牌色
    brand: {
      primary: '#3b82f6',       // 主品牌色
      secondary: '#60a5fa',     // 次级品牌色
      accent: '#8b5cf6',        // 强调色
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    },
    
    // 状态色
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    
    // 边框
    border: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.15)',
      strong: 'rgba(255, 255, 255, 0.2)',
    },
  },
  
  // 阴影系统
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
    glow: '0 0 20px rgba(59, 130, 246, 0.3)',
    glowHover: '0 0 30px rgba(59, 130, 246, 0.5)',
  },
  
  // 圆角
  radius: {
    sm: '6px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  
  // 间距
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  // 动画
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
  },
  
  // 玻璃效果
  glass: {
    light: {
      background: 'rgba(17, 24, 39, 0.4)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    medium: {
      background: 'rgba(17, 24, 39, 0.6)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
    },
    strong: {
      background: 'rgba(17, 24, 39, 0.8)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
  },
};

export type ThemeV2 = typeof themeV2;
