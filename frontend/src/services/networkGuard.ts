// Stage 4.9.x - NetworkGuard: 稳健双网络管理器
// 修复版：区分「系统链」(永远 ZetaChain) 和「钱包链」(临时切换)
// 支持动作级容忍 + 切链稳健性 + 互斥锁

import { Signer } from 'ethers';
import { getSignerFresh } from './walletWriteProvider';

interface NetworkConfig {
  chainId: string;
  chainName: string;
  rpcUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrls?: string[];
}

interface NetworkSwitchResult {
  ok: boolean;
  switched: boolean;
  fromChainId?: string;
  toChainId?: string;
  reason?: string;
}

// 修复版：明确的资产类型定义
export interface SelectedAsset {
  key: string;                 // e.g. 'ZETA_ATHENS_NATIVE' | 'ETH_SEPOLIA_NATIVE' | 'USDT_SEPOLIA_ERC20'
  displayName: string;         // e.g. 'ZETA (Athens)' | 'ETH (Sepolia)'
  symbol: string;              // 'ZETA' | 'ETH' | 'USDT'
  sourceChainId: number;       // 7001 for ZetaChain Athens, 11155111 for Sepolia
  kind: 'native' | 'erc20' | 'zrc20';
  tokenAddress?: string;       // erc20 address on source chain when needed
}

type NetworkMode = 'idle' | 'depositing' | 'depositReady' | 'publishing';

class NetworkGuard {
  private static instance: NetworkGuard;
  private inFlightLock = false; // 互斥锁：防止并发切链
  private switchTimeout = 30000; // 30秒超时
  
  // 双状态管理
  private readonly systemChainId = '0x1b59'; // 7001 - ZetaChain Athens (永远)
  private mode: NetworkMode = 'idle';

  // 修复版：资产到链ID的明确映射
  private readonly ASSET_CHAIN_MAPPING: Record<string, number> = {
    'ZETA (Athens)': 7001,           // ZetaChain native
    'ZetaChain Testnet': 7001,       // ZetaChain native (alternative name)
    'ETH Sepolia': 11155111,         // Sepolia ETH
    'USDT Sepolia': 11155111,        // Sepolia USDT
    'BNB Testnet': 97                // BSC Testnet
  };

  // 网络配置映射
  private readonly NETWORK_CONFIGS: Record<string, NetworkConfig> = {
    '0x1b59': { // 7001 - ZetaChain Athens
      chainId: '0x1b59',
      chainName: 'ZetaChain Athens Testnet',
      rpcUrls: ['https://zetachain-athens-evm.blockpi.network/v1/rpc/public'],
      nativeCurrency: { name: 'ZETA', symbol: 'ZETA', decimals: 18 },
      blockExplorerUrls: ['https://athens.explorer.zetachain.com']
    },
    '0xaa36a7': { // 11155111 - Sepolia
      chainId: '0xaa36a7',
      chainName: 'Sepolia test network',
      rpcUrls: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      blockExplorerUrls: ['https://sepolia.etherscan.io']
    },
    '0x61': { // 97 - BSC Testnet
      chainId: '0x61',
      chainName: 'Binance Smart Chain Testnet',
      rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      blockExplorerUrls: ['https://testnet.bscscan.com']
    }
  };

  static getInstance(): NetworkGuard {
    if (!NetworkGuard.instance) {
      NetworkGuard.instance = new NetworkGuard();
    }
    return NetworkGuard.instance;
  }

  // 核心方法：动作级网络保证（修复版）
  async ensureNetworkFor(
    action: 'deposit' | 'publish',
    asset?: SelectedAsset
  ): Promise<NetworkSwitchResult> {
    // 互斥锁：防止并发切链
    if (this.inFlightLock) {
      return { ok: false, switched: false, reason: 'Another network switch in progress' };
    }

    try {
      this.inFlightLock = true;

      const currentChainId = await this.getWalletChainId();
      const targetChainId = this.getDepositTargetChainId(action, asset);

      console.log(`[NetworkGuard] ensureNetworkFor: action=${action}, current=${currentChainId}, target=${targetChainId}`);

      if (currentChainId === targetChainId) {
        // 设置正确的模式
        if (action === 'deposit') {
          this.setMode('depositReady');
        } else if (action === 'publish') {
          this.setMode('publishing');
        }
        return { ok: true, switched: false, fromChainId: currentChainId, toChainId: targetChainId };
      }

      // 需要切链
      const networkConfig = this.getNetworkConfigByChainId(targetChainId);
      if (!networkConfig) {
        throw new Error(`Network config not found for chainId: ${targetChainId}`);
      }

      // 设置切链模式
      if (action === 'deposit') {
        this.setMode('depositing');
      }

      await this.switchToNetwork(targetChainId, networkConfig);

      // 切链成功后设置就绪模式
      if (action === 'deposit') {
        this.setMode('depositReady');
      } else if (action === 'publish') {
        this.setMode('publishing');
      }

      return {
        ok: true,
        switched: true,
        fromChainId: currentChainId,
        toChainId: targetChainId
      };

    } catch (error) {
      console.error('[NetworkGuard] ensureNetworkFor failed:', error);
      return {
        ok: false,
        switched: false,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.inFlightLock = false;
    }
  }

  // 自动切链 + 自动添加网络
  private async switchToNetwork(chainId: string, config: NetworkConfig): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      // 1. 尝试切换网络
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });

      // 2. 等待切链确认（带超时）
      await this.waitForChainChange(chainId);

    } catch (switchError: any) {
      // 3. 如果网络不存在（4902），自动添加
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [config],
          });
          // 添加成功后再次等待切链确认
          await this.waitForChainChange(chainId);
        } catch (addError) {
          throw new Error(`Failed to add network: ${addError instanceof Error ? addError.message : 'Unknown error'}`);
        }
      } else {
        throw new Error(`Failed to switch network: ${switchError.message || 'User rejected'}`);
      }
    }
  }

  // 等待切链确认（带超时）
  private async waitForChainChange(expectedChainId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Network switch timeout'));
      }, this.switchTimeout);

      const handleChainChanged = (chainId: string) => {
        if (chainId === expectedChainId) {
          cleanup();
          resolve();
        }
      };

      const cleanup = () => {
        clearTimeout(timeout);
        if (window.ethereum?.removeListener) {
          (window.ethereum as any).removeListener('chainChanged', handleChainChanged);
        }
      };

      if (window.ethereum?.on) {
        (window.ethereum as any).on('chainChanged', handleChainChanged);
      }

      // 立即检查一次当前链ID
      this.getCurrentChainId().then(currentChainId => {
        if (currentChainId === expectedChainId) {
          cleanup();
          resolve();
        }
      });
    });
  }

  // 切链后必须重新获取signer（使用 WalletWriteProvider）
  async refreshSigner(): Promise<Signer> {
    console.log('[NetworkGuard] Refreshing signer after network switch...');
    return await getSignerFresh();
  }

  // 新增：获取当前模式
  getMode(): NetworkMode {
    return this.mode;
  }

  // 新增：设置模式
  setMode(mode: NetworkMode): void {
    console.log(`[NetworkGuard] Mode changed: ${this.mode} → ${mode}`);
    this.mode = mode;
  }

  // 新增：获取系统期望的链ID（永远是 ZetaChain）
  getSystemChainId(): string {
    return this.systemChainId;
  }

  // 新增：获取当前钱包链ID
  async getWalletChainId(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }
    
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return chainId;
  }

  // 修复版：动作级容忍机制
  shouldTolerateWrongNetwork(): boolean {
    // 在存入模式或存入完成模式下，容忍非 ZetaChain 网络
    if (this.mode === 'depositing' || this.mode === 'depositReady') {
      console.log('[NetworkGuard] Tolerating wrong network in deposit mode');
      return true;
    }
    
    // 发布模式下必须在 ZetaChain，不容忍
    if (this.mode === 'publishing') {
      return false;
    }
    
    // 空闲模式下不强制，但建议在 ZetaChain
    return true;
  }

  // 新增：检查钱包是否在正确网络（异步版本）
  async shouldTolerateWalletNetwork(): Promise<boolean> {
    const walletChainId = await this.getWalletChainId();
    
    // 在存入模式或存入完成模式下，容忍非 ZetaChain 网络
    if (this.mode === 'depositing' || this.mode === 'depositReady') {
      console.log('[NetworkGuard] Tolerating non-ZetaChain network in deposit mode');
      return true;
    }
    
    // 发布模式下必须在 ZetaChain
    if (this.mode === 'publishing') {
      return walletChainId === this.systemChainId;
    }
    
    // 空闲模式下建议在 ZetaChain，但不强制
    return true;
  }

  // 新增：确保钱包在发布网络（ZetaChain）
  async ensurePublishWalletNetwork(): Promise<NetworkSwitchResult> {
    console.log('[NetworkGuard] Ensuring wallet on publish network (ZetaChain)...');
    
    const currentChainId = await this.getWalletChainId();
    if (currentChainId === this.systemChainId) {
      return { ok: true, switched: false, fromChainId: currentChainId, toChainId: this.systemChainId };
    }

    // 需要切回 ZetaChain
    const networkConfig = this.getNetworkConfigByChainId(this.systemChainId);
    if (!networkConfig) {
      throw new Error(`Network config not found for ZetaChain: ${this.systemChainId}`);
    }
    try {
      await this.switchToNetwork(this.systemChainId, networkConfig);
      return {
        ok: true,
        switched: true,
        fromChainId: currentChainId,
        toChainId: this.systemChainId
      };
    } catch (error) {
      return {
        ok: false,
        switched: false,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 新增：确保钱包在存入网络（根据资产决定）
  async ensureDepositWalletNetwork(asset: SelectedAsset): Promise<NetworkSwitchResult> {
    console.log(`[NetworkGuard] Ensuring wallet on deposit network for asset: ${asset}...`);
    
    const targetChainId = this.getDepositTargetChainId('deposit', asset);
    const currentChainId = await this.getWalletChainId();
    
    if (currentChainId === targetChainId) {
      return { ok: true, switched: false, fromChainId: currentChainId, toChainId: targetChainId };
    }

    // 需要切到源链
    const networkConfig = this.getNetworkConfigByChainId(targetChainId);
    if (!networkConfig) {
      throw new Error(`Network config not found for chainId: ${targetChainId}`);
    }
    try {
      await this.switchToNetwork(targetChainId, networkConfig);
      return {
        ok: true,
        switched: true,
        fromChainId: currentChainId,
        toChainId: targetChainId
      };
    } catch (error) {
      return {
        ok: false,
        switched: false,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 获取当前链ID
  private async getCurrentChainId(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }
    return await window.ethereum.request({ method: 'eth_chainId' });
  }

  // 修复版：根据动作和资产确定目标链ID
  getDepositTargetChainId(action: 'deposit' | 'publish', asset?: SelectedAsset): string {
    if (action === 'publish') {
      return this.systemChainId; // 发布必须在 ZetaChain
    }
    
    if (action === 'deposit' && asset) {
      // 从资产对象中直接获取 sourceChainId
      if (typeof asset === 'object' && 'sourceChainId' in asset) {
        return '0x' + asset.sourceChainId.toString(16);
      }
      
      // 兼容旧的字符串格式
      if (typeof asset === 'string') {
        const chainId = this.ASSET_CHAIN_MAPPING[asset];
        if (chainId) {
          return '0x' + chainId.toString(16);
        }
      }
    }
    
    throw new Error(`Cannot determine target chain for action: ${action}, asset: ${JSON.stringify(asset)}`);
  }

  // 修复版：根据链ID获取网络配置
  private getNetworkConfigByChainId(chainId: string): NetworkConfig | null {
    const config = this.NETWORK_CONFIGS[chainId];
    return config || null;
  }

  // 修复版：根据资产获取网络配置
  getNetworkConfigForAsset(asset: SelectedAsset | string): NetworkConfig {
    let chainId: string;
    
    if (typeof asset === 'object' && 'sourceChainId' in asset) {
      chainId = '0x' + asset.sourceChainId.toString(16);
    } else if (typeof asset === 'string') {
      const numericChainId = this.ASSET_CHAIN_MAPPING[asset];
      if (!numericChainId) {
        throw new Error(`Asset not found in mapping: ${asset}`);
      }
      chainId = '0x' + numericChainId.toString(16);
    } else {
      throw new Error(`Invalid asset format: ${JSON.stringify(asset)}`);
    }
    
    const config = this.NETWORK_CONFIGS[chainId];
    if (!config) {
      throw new Error(`Network config not found for chainId: ${chainId}`);
    }
    return config;
  }

  // 获取网络名称（用于UI显示）
  getNetworkNameByChainId(chainId: string): string {
    for (const config of Object.values(this.NETWORK_CONFIGS)) {
      if (config.chainId === chainId) {
        return config.chainName;
      }
    }
    return `Unknown Network (${chainId})`;
  }

  // 检查是否在飞行中（用于UI状态）
  isInFlight(): boolean {
    return this.inFlightLock;
  }
}

export default NetworkGuard;
export type { NetworkSwitchResult, NetworkConfig };