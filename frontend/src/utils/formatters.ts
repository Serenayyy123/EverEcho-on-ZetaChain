import { ethers } from 'ethers';

/**
 * 格式化工具函数
 */

/**
 * 格式化地址（显示前6位和后4位）
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * 格式化 ECHO 数量
 */
export function formatECHO(wei: string | bigint): string {
  try {
    return ethers.formatEther(wei);
  } catch {
    return '0';
  }
}

/**
 * 格式化时间戳
 */
export function formatTimestamp(timestamp: number): string {
  if (!timestamp || timestamp === 0) return '-';
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp || timestamp === 0) return '-';
  
  const now = Date.now();
  const time = timestamp * 1000;
  const diff = now - time;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/**
 * 检查是否超时
 */
export function isTimeout(timestamp: number, duration: number): boolean {
  if (!timestamp || timestamp === 0) return false;
  const now = Math.floor(Date.now() / 1000);
  return now > timestamp + duration;
}
