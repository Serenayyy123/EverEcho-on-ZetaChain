// Stage 4.9.x - WalletWriteProvider: 专用于写交易的钱包 Provider
// 每次切链后必须重新获取 signer，避免 signer 失效问题

import { BrowserProvider, Signer } from 'ethers';

class WalletWriteProvider {
  private static instance: WalletWriteProvider;

  private constructor() {
    console.log('[WalletWriteProvider] Initialized');
  }

  static getInstance(): WalletWriteProvider {
    if (!WalletWriteProvider.instance) {
      WalletWriteProvider.instance = new WalletWriteProvider();
    }
    return WalletWriteProvider.instance;
  }

  // 获取当前的 BrowserProvider（基于 window.ethereum）
  getBrowserProvider(): BrowserProvider {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }
    
    // 每次都创建新的 provider，确保获取最新的网络状态
    return new BrowserProvider(window.ethereum);
  }

  // 获取新鲜的 signer（切链后必须调用）
  async getSignerFresh(): Promise<Signer> {
    console.log('[WalletWriteProvider] Getting fresh signer...');
    
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      // 关键：每次都重新创建 provider 和 signer
      const provider = this.getBrowserProvider();
      const signer = await provider.getSigner();
      
      // 验证 signer 可用性
      const address = await signer.getAddress();
      const chainId = await signer.provider?.getNetwork().then(n => Number(n.chainId)) || 0;
      
      console.log('[WalletWriteProvider] Fresh signer obtained:', {
        address: address.slice(0, 6) + '...' + address.slice(-4),
        chainId
      });
      
      return signer;
    } catch (error) {
      console.error('[WalletWriteProvider] Failed to get fresh signer:', error);
      throw new Error(`Failed to get wallet signer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 在当前网络执行交易（包装函数）
  async sendTxOnCurrentNetwork<T>(
    txFunction: (signer: Signer) => Promise<T>
  ): Promise<T> {
    console.log('[WalletWriteProvider] Executing transaction on current network...');
    
    try {
      const signer = await this.getSignerFresh();
      const result = await txFunction(signer);
      
      console.log('[WalletWriteProvider] Transaction executed successfully');
      return result;
    } catch (error) {
      console.error('[WalletWriteProvider] Transaction failed:', error);
      throw error;
    }
  }

  // 获取当前钱包网络信息
  async getCurrentWalletNetwork() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      return {
        chainId,
        connected: accounts.length > 0,
        address: accounts[0] || null
      };
    } catch (error) {
      console.error('[WalletWriteProvider] Failed to get wallet network:', error);
      return {
        chainId: null,
        connected: false,
        address: null
      };
    }
  }

  // 验证 signer 是否在指定网络
  async validateSignerNetwork(signer: Signer, expectedChainId: number): Promise<boolean> {
    try {
      if (!signer.provider) {
        console.error('[WalletWriteProvider] Signer has no provider');
        return false;
      }
      
      const network = await signer.provider.getNetwork();
      const actualChainId = Number(network.chainId);
      
      const isValid = actualChainId === expectedChainId;
      console.log('[WalletWriteProvider] Signer network validation:', {
        expected: expectedChainId,
        actual: actualChainId,
        valid: isValid
      });
      
      return isValid;
    } catch (error) {
      console.error('[WalletWriteProvider] Signer validation failed:', error);
      return false;
    }
  }
}

// 导出单例实例和便捷函数
export const walletWriteProvider = WalletWriteProvider.getInstance();

export function getBrowserProvider(): BrowserProvider {
  return walletWriteProvider.getBrowserProvider();
}

export function getSignerFresh(): Promise<Signer> {
  return walletWriteProvider.getSignerFresh();
}

export async function sendTxOnCurrentNetwork<T>(
  txFunction: (signer: Signer) => Promise<T>
): Promise<T> {
  return walletWriteProvider.sendTxOnCurrentNetwork(txFunction);
}

export default WalletWriteProvider;