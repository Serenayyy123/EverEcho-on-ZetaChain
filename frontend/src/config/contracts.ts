import { ethers } from 'ethers';
import EverEchoUniversalRewardABI from '../contracts/EverEchoUniversalReward.json';

// 合约地址配置
export const CONTRACT_ADDRESSES = {
  // 本地开发环境 (Updated after TaskEscrow double charging fix)
  localhost: {
    UNIVERSAL_REWARD: import.meta.env.VITE_UNIVERSAL_REWARD_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    TASK_ESCROW: import.meta.env.VITE_TASK_ESCROW_ADDRESS || '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  },
  // ZetaChain Athens 测试网 (Updated after complete system redeploy to fix confirm complete issue)
  zetachainAthens: {
    UNIVERSAL_REWARD: import.meta.env.VITE_ZETA_UNIVERSAL_REWARD_ADDRESS || import.meta.env.VITE_UNIVERSAL_REWARD_ADDRESS || '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3',
    TASK_ESCROW: import.meta.env.VITE_ZETA_TASK_ESCROW_ADDRESS || import.meta.env.VITE_TASK_ESCROW_ADDRESS || '0x69B200141cF9553C2D17834AF149248A035Dc52B',
  }
};

// 网络配置
export const NETWORKS = {
  localhost: {
    chainId: 31337,
    name: 'Localhost',
    rpcUrl: 'http://localhost:8545',
  },
  zetachainAthens: {
    chainId: 7001,
    name: 'ZetaChain Athens',
    rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
  }
};

// 获取当前网络的合约地址
export function getContractAddresses(chainId: number) {
  switch (chainId) {
    case 31337:
      return CONTRACT_ADDRESSES.localhost;
    case 7001:
      return CONTRACT_ADDRESSES.zetachainAthens;
    default:
      console.warn(`Unknown chainId: ${chainId}, using localhost addresses`);
      return CONTRACT_ADDRESSES.localhost;
  }
}

// 创建合约实例
export function createUniversalRewardContract(
  provider: ethers.Provider | ethers.Signer,
  chainId: number
) {
  const addresses = getContractAddresses(chainId);
  return new ethers.Contract(
    addresses.UNIVERSAL_REWARD,
    EverEchoUniversalRewardABI.abi,
    provider
  );
}

// 奖励状态枚举
export enum RewardStatus {
  Prepared = 0,
  Deposited = 1,
  Locked = 2,
  Claimed = 3,
  Refunded = 4,
  Reverted = 5
}

// 奖励计划接口
export interface RewardPlan {
  rewardId: bigint;
  creator: string;
  taskId: bigint;
  asset: string;
  amount: bigint;
  targetChainId: bigint;
  targetAddress: string;
  status: RewardStatus;
  createdAt: bigint;
  updatedAt: bigint;
  lastTxHash: string;
}

// 支持的资产配置（跨链奖励）
export const SUPPORTED_ASSETS = [
  { 
    value: 'ETH_SEPOLIA', 
    label: 'ETH (Sepolia)', 
    symbol: 'ETH',
    decimals: 18,
    description: 'Sepolia 测试网原生 ETH'
  },
  { 
    value: 'USDC_SEPOLIA',
    label: 'USDC (Sepolia)', 
    symbol: 'USDC',
    decimals: 6,
    description: 'Sepolia 测试网 USDC 代币'
  },
  { 
    value: 'ZETA_NATIVE',
    label: 'ZETA (原生代币)', 
    symbol: 'ZETA',
    decimals: 18,
    description: 'ZetaChain 原生 ZETA 代币'
  }
];

// 目标链配置
export const TARGET_CHAINS = [
  { value: '11155111', label: 'ETH Sepolia' },
  { value: '7001', label: 'ZetaChain Testnet' }
];

// 获取资产对应的源网络链ID
export function getSourceNetworkForAsset(assetValue: string): number {
  // 根据资产值直接映射到对应的源网络
  switch (assetValue) {
    case 'ETH_SEPOLIA':
      return 11155111; // ETH Sepolia (原生ETH)
    case 'USDC_SEPOLIA':
      return 11155111; // ETH Sepolia (USDC代币)
    case 'ZETA_NATIVE':
      return 7001; // ZetaChain (原生ZETA)
    default:
      return 7001; // 默认ZetaChain
  }
}

// ZetaChain Athens 测试网上的 ZRC20 代币地址映射
const ZRC20_ADDRESSES = {
  // Sepolia ETH -> ZetaChain ETH ZRC20
  'ETH_SEPOLIA': '0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf', // ETH ZRC20 on ZetaChain Athens
  // Sepolia USDC -> ZetaChain USDC ZRC20  
  'USDC_SEPOLIA': '0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb', // USDC ZRC20 on ZetaChain Athens
  // ZetaChain 原生 ZETA -> 零地址（原生代币）
  'ZETA_NATIVE': '0x0000000000000000000000000000000000000000', // Native ZETA on ZetaChain
};

// 将资产值转换为合约调用格式（ZRC20 地址）
export function getContractAssetAddress(assetValue: string): string {
  const zrc20Address = ZRC20_ADDRESSES[assetValue as keyof typeof ZRC20_ADDRESSES];
  
  if (!zrc20Address) {
    console.warn(`Unknown asset: ${assetValue}, using zero address as fallback`);
    return '0x0000000000000000000000000000000000000000';
  }
  
  console.log(`[getContractAssetAddress] ${assetValue} -> ${zrc20Address}`);
  return zrc20Address;
}

// 网络切换辅助函数
export async function switchToNetwork(chainId: number): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const chainIdHex = `0x${chainId.toString(16)}`;
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (error: any) {
    // 如果网络不存在，可以在这里添加网络
    if (error.code === 4902) {
      // 网络不存在的处理逻辑可以在这里添加
      throw new Error(`Network ${chainId} not found in wallet`);
    }
    throw error;
  }
}