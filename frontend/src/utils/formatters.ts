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
/**
 * Stage 4: 跨链奖励显示工具
 */

/**
 * 格式化跨链奖励显示
 */
export function formatCrossChainReward(rewardAsset: string, rewardAmount: string): {
  hasReward: boolean;
  displayText: string;
  isPlaceholder: boolean;
} {
  const isZeroAddress = !rewardAsset || rewardAsset === ethers.ZeroAddress;
  const isZeroAmount = !rewardAmount || rewardAmount === '0' || rewardAmount === '0.0';
  
  if (isZeroAddress || isZeroAmount) {
    return {
      hasReward: false,
      displayText: '跨链奖励：未设置（占位）',
      isPlaceholder: true,
    };
  }
  
  return {
    hasReward: true,
    displayText: `跨链奖励（占位）：${rewardAmount} @ ${formatAddress(rewardAsset)}`,
    isPlaceholder: true,
  };
}

/**
 * 获取跨链奖励免责声明
 */
export function getCrossChainDisclaimer(): string {
  return '跨链奖励当前仅为展示/记录，占位功能，本阶段不做真实跨链转账。';
}

/**
 * 计算任务总成本（reward + postFee）
 */
export function calculateTaskTotalCost(reward: string): {
  rewardECHO: string;
  postFeeECHO: string;
  totalECHO: string;
  totalWei: bigint;
} {
  const rewardWei = ethers.parseUnits(reward, 18);
  const postFeeWei = ethers.parseUnits("10", 18); // TASK_POST_FEE constant
  const totalWei = rewardWei + postFeeWei;
  
  return {
    rewardECHO: reward,
    postFeeECHO: "10",
    totalECHO: ethers.formatEther(totalWei),
    totalWei,
  };
}

/**
 * 格式化任务收益说明（给 Helper）
 */
export function formatHelperEarnings(reward: string): {
  rewardReturn: string; // 保证金退回
  actualReward: string; // 实际奖励（扣除2%手续费）
  postFee: string; // 发布费
  totalEarnings: string; // 总收益
  burnFee: string; // 销毁费用
} {
  const rewardWei = ethers.parseUnits(reward, 18);
  const burnFeeWei = rewardWei * BigInt(200) / BigInt(10000); // 2%
  const actualRewardWei = rewardWei - burnFeeWei;
  const postFeeWei = ethers.parseUnits("10", 18);
  const totalEarningsWei = actualRewardWei + rewardWei + postFeeWei; // 98 + 100 + 10
  
  return {
    rewardReturn: ethers.formatEther(rewardWei), // 100 ECHO 保证金退回
    actualReward: ethers.formatEther(actualRewardWei), // 98 ECHO 实际奖励
    postFee: "10", // 10 ECHO 发布费
    totalEarnings: ethers.formatEther(totalEarningsWei), // 208 ECHO 总收益
    burnFee: ethers.formatEther(burnFeeWei), // 2 ECHO 销毁
  };
}