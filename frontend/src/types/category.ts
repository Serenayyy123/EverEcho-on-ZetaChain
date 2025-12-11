/**
 * Task Category Types and Constants
 * 
 * 纯前端 metadata 扩展，不影响合约和后端
 */

export type TaskCategoryKey =
  | 'pet'
  | 'exchange'
  | 'hosting'
  | 'coffeechat'
  | 'career'
  | 'outreach_help';

export interface CategoryOption {
  key: TaskCategoryKey;
  label: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: 'pet', label: 'Pet / 宠物' },
  { key: 'exchange', label: 'Exchange / 交换' },
  { key: 'hosting', label: 'Hosting / 借宿' },
  { key: 'coffeechat', label: 'Coffee Chat / Coffeechat' },
  { key: 'career', label: 'Career Growth / 职业发展' },
  { key: 'outreach_help', label: 'Outreach Help / 在外互助' },
];

/**
 * Get category label by key
 */
export function getCategoryLabel(key?: string): string {
  if (!key) return 'Uncategorized';
  const option = CATEGORY_OPTIONS.find(opt => opt.key === key);
  return option?.label || 'Uncategorized';
}

/**
 * Get category badge color
 */
export function getCategoryColor(key?: string): string {
  if (!key) return '#9ca3af'; // gray
  
  const colors: Record<TaskCategoryKey, string> = {
    pet: '#f59e0b', // amber
    exchange: '#10b981', // emerald
    hosting: '#3b82f6', // blue
    coffeechat: '#8b5cf6', // violet
    career: '#ef4444', // red
    outreach_help: '#ec4899', // pink
  };
  
  return colors[key as TaskCategoryKey] || '#9ca3af';
}
