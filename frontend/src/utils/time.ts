/**
 * 时间工具函数
 * P1-F6：倒计时与超时提示
 */

/**
 * 格式化倒计时
 * @param milliseconds 剩余毫秒数
 * @returns 格式化的时间字符串（天/小时/分钟/秒）
 */
export function formatCountdown(milliseconds: number | null): string {
  if (milliseconds === null || milliseconds <= 0) {
    return 'Expired';
  }

  const seconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0 || days > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0 || hours > 0 || days > 0) {
    parts.push(`${minutes}m`);
  }
  parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * 计算剩余时间（秒）
 * @param deadline 截止时间戳（秒）
 * @returns 剩余秒数
 */
export function getRemainingTime(deadline: number): number {
  const now = Math.floor(Date.now() / 1000);
  return deadline - now;
}
