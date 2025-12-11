/**
 * Chain Configuration - 严格的 chainId 管理
 * 禁止默认回落，确保链隔离
 * 
 * 冻结点保持：不改变任何业务逻辑，只是配置管理方式
 */

import { ethers } from 'ethers';

/**
 * 获取当前 chainId（严格模式）
 * 如果未配置则抛出错误，避免静默回落
 */
export function getCurrentChainId(): string {
  const chainId = process.env.CHAIN_ID;
  
  if (!chainId) {
    throw new Error(
      '❌ FATAL: CHAIN_ID not configured in environment!\n' +
      'Please set CHAIN_ID in .env file.\n' +
      'Example: CHAIN_ID=84532 (Base Sepolia)'
    );
  }
  
  return chainId;
}

/**
 * 验证 chainId 与 RPC 提供商一致
 * 启动时必须调用，确保配置正确
 */
export async function validateChainId(provider: ethers.Provider): Promise<void> {
  const configuredChainId = getCurrentChainId();
  
  try {
    const network = await provider.getNetwork();
    const actualChainId = network.chainId.toString();
    
    if (configuredChainId !== actualChainId) {
      throw new Error(
        `❌ FATAL: Chain ID mismatch!\n` +
        `  Configured: ${configuredChainId}\n` +
        `  RPC returns: ${actualChainId}\n` +
        `Please check your .env configuration.`
      );
    }
    
    console.log(`✅ Chain ID validated: ${configuredChainId} (${getChainName(configuredChainId)})`);
  } catch (error: any) {
    if (error.message.includes('Chain ID mismatch')) {
      throw error;
    }
    throw new Error(
      `❌ FATAL: Cannot validate chain ID: ${error.message}\n` +
      `Please check your RPC_URL configuration.`
    );
  }
}

/**
 * 获取链名称（用于日志）
 */
export function getChainName(chainId: string): string {
  const names: Record<string, string> = {
    '1': 'Ethereum Mainnet',
    '11155111': 'Ethereum Sepolia',
    '84532': 'Base Sepolia',
    '8453': 'Base Mainnet',
  };
  return names[chainId] || `Chain ${chainId}`;
}
