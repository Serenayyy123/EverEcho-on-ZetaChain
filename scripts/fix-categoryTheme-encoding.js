const fs = require('fs');
const path = require('path');

const content = `/**
 * Category Theme Colors - Morandi Fresh Colors
 * Each category has a theme color set (for cards and tags)
 */

export interface CategoryTheme {
  accent: string;
  glow: string;
  label: string;
}

// Category Animation Mapping
export const categoryAnimations: Record<string, string> = {
  pet: '/animations/Pet.json',
  exchange: '/animations/Exchange.json',
  hosting: '/animations/Hosting.json',
  coffeechat: '/animations/Coffee Chat.json',
  career: '/animations/Career.json',
  outreach_help: '/animations/Outreach Help.json',
  other: '/animations/Others.json',
};

export interface CategoryFullTheme extends CategoryTheme {
  bg: string;
  border: string;
  text: string;
  tag: string;
  cta: string;
}

export const categoryThemes: Record<string, CategoryTheme> = {
  pet: {
    accent: '#e8b4b8',
    glow: 'rgba(232, 180, 184, 0.3)',
    label: 'Pet',
  },
  exchange: {
    accent: '#f5c7a8',
    glow: 'rgba(245, 199, 168, 0.3)',
    label: 'Exchange',
  },
  hosting: {
    accent: '#a8d5ba',
    glow: 'rgba(168, 213, 186, 0.3)',
    label: 'Hosting',
  },
  coffeechat: {
    accent: '#f5e7b8',
    glow: 'rgba(245, 231, 184, 0.3)',
    label: 'Coffee Chat',
  },
  career: {
    accent: '#a5c5d4',
    glow: 'rgba(165, 197, 212, 0.3)',
    label: 'Career',
  },
  outreach_help: {
    accent: '#c5a5d4',
    glow: 'rgba(197, 165, 212, 0.3)',
    label: 'Outreach Help',
  },
  other: {
    accent: '#d4d4d4',
    glow: 'rgba(212, 212, 212, 0.3)',
    label: 'Other',
  },
};

// Full theme colors (card material - Morandi gradient)
export const CATEGORY_FULL_THEME: Record<string, CategoryFullTheme> = {
  pet: {
    ...categoryThemes.pet,
    bg: 'linear-gradient(135deg, #e8b4b8 0%, #f5c7c7 100%)',
    border: 'rgba(232, 180, 184, 0.4)',
    text: '#2d2d2d',
    tag: 'rgba(232, 180, 184, 0.25)',
    cta: '#e8b4b8',
  },
  exchange: {
    ...categoryThemes.exchange,
    bg: 'linear-gradient(135deg, #f5c7a8 0%, #ffd9b8 100%)',
    border: 'rgba(245, 199, 168, 0.4)',
    text: '#2d2d2d',
    tag: 'rgba(245, 199, 168, 0.25)',
    cta: '#f5c7a8',
  },
  hosting: {
    ...categoryThemes.hosting,
    bg: 'linear-gradient(135deg, #a8d5ba 0%, #b8e6d5 100%)',
    border: 'rgba(168, 213, 186, 0.4)',
    text: '#2d2d2d',
    tag: 'rgba(168, 213, 186, 0.25)',
    cta: '#a8d5ba',
  },
  coffeechat: {
    ...categoryThemes.coffeechat,
    bg: 'linear-gradient(135deg, #f5e7b8 0%, #ffe8c7 100%)',
    border: 'rgba(245, 231, 184, 0.4)',
    text: '#2d2d2d',
    tag: 'rgba(245, 231, 184, 0.25)',
    cta: '#f5e7b8',
  },
  career: {
    ...categoryThemes.career,
    bg: 'linear-gradient(135deg, #a5c5d4 0%, #b8d9e8 100%)',
    border: 'rgba(165, 197, 212, 0.4)',
    text: '#2d2d2d',
    tag: 'rgba(165, 197, 212, 0.25)',
    cta: '#a5c5d4',
  },
  outreach_help: {
    ...categoryThemes.outreach_help,
    bg: 'linear-gradient(135deg, #c5a5d4 0%, #d9b8e8 100%)',
    border: 'rgba(197, 165, 212, 0.4)',
    text: '#2d2d2d',
    tag: 'rgba(197, 165, 212, 0.25)',
    cta: '#c5a5d4',
  },
  other: {
    ...categoryThemes.other,
    bg: 'linear-gradient(135deg, #d4d4d4 0%, #e8e8e8 100%)',
    border: 'rgba(212, 212, 212, 0.4)',
    text: '#2d2d2d',
    tag: 'rgba(212, 212, 212, 0.25)',
    cta: '#d4d4d4',
  },
};

export const getCategoryFullTheme = (category?: string): CategoryFullTheme => {
  if (!category) return CATEGORY_FULL_THEME.other;
  return CATEGORY_FULL_THEME[category.toLowerCase()] || CATEGORY_FULL_THEME.other;
};

export const getCategoryTheme = (category?: string): CategoryTheme => {
  if (!category) return categoryThemes.other;
  return categoryThemes[category.toLowerCase()] || categoryThemes.other;
};

export const getCategoryAnimation = (category?: string): string => {
  if (!category) return categoryAnimations.other;
  return categoryAnimations[category.toLowerCase()] || categoryAnimations.other;
};

// Soft success color configuration (for settlement module)
export interface SuccessTheme {
  background: string;
  border: string;
  text: string;
}

export const categorySuccessThemes: Record<string, SuccessTheme> = {
  pet: {
    background: '#FFF0F2',
    border: '#F5C7C7',
    text: '#8B4A4A',
  },
  exchange: {
    background: '#FFF5ED',
    border: '#FFD9B8',
    text: '#8B5A2B',
  },
  hosting: {
    background: '#F0F8F0',
    border: '#B8E6D5',
    text: '#2D5A3D',
  },
  coffeechat: {
    background: '#FFFBF0',
    border: '#FFE8C7',
    text: '#8B6914',
  },
  career: {
    background: '#F0F7FA',
    border: '#B8D9E8',
    text: '#2D4A5A',
  },
  outreach_help: {
    background: '#F8F0FA',
    border: '#D9B8E8',
    text: '#5A2D6B',
  },
  other: {
    background: '#F5F5F5',
    border: '#E8E8E8',
    text: '#4A4A4A',
  },
};

export const getCategorySuccessTheme = (category?: string): SuccessTheme => {
  if (!category) return categorySuccessThemes.other;
  return categorySuccessThemes[category.toLowerCase()] || categorySuccessThemes.other;
};
`;

const targetPath = path.join(__dirname, '../frontend/src/utils/categoryTheme.ts');
fs.writeFileSync(targetPath, content, { encoding: 'utf8' });
console.log('✅ File written successfully with clean UTF-8 encoding');
