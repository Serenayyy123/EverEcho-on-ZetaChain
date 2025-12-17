// Stage 4.9.x - ZetaReadProvider: 稳定的 ZetaChain 读取服务
// 永远连接 ZetaChain Athens RPC，不依赖钱包网络状态

import { JsonRpcProvider, Contract } from 'ethers';
import { getContractAddresses } from '../contracts/addresses';
import TaskEscrowABI from '../contracts/TaskEscrow.json';
import EverEchoUniversalRewardABI from '../contracts/EverEchoUniversalReward.json';

// 环境变量配置
const ZETA_RPC_URL = import.meta.env.VITE_ZETA_RPC_URL || 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';
const ZETA_CHAIN_ID = 7001;

class ZetaReadProvider {
  private static instance: ZetaReadProvider;
  private provider: JsonRpcProvider;
  private contracts: {
    taskEscrow?: Contract;
    universalReward?: Contract;
  } = {};

  private constructor() {
    // 创建稳定的 ZetaChain RPC 连接
    this.provider = new JsonRpcProvider(ZETA_RPC_URL, ZETA_CHAIN_ID, {
      staticNetwork: true // 避免网络检测请求
    });
    
    console.log('[ZetaReadProvider] Initialized with RPC:', ZETA_RPC_URL);
  }

  static getInstance(): ZetaReadProvider {
    if (!ZetaReadProvider.instance) {
      ZetaReadProvider.instance = new ZetaReadProvider();
    }
    return ZetaReadProvider.instance;
  }

  // 获取稳定的 ZetaChain provider
  getProvider(): JsonRpcProvider {
    return this.provider;
  }

  // 获取只读合约实例
  getTaskEscrowReadOnly(): Contract {
    if (!this.contracts.taskEscrow) {
      const addresses = getContractAddresses(ZETA_CHAIN_ID);
      this.contracts.taskEscrow = new Contract(addresses.taskEscrow, TaskEscrowABI.abi, this.provider);
      console.log('[ZetaReadProvider] TaskEscrow read-only contract created:', addresses.taskEscrow);
    }
    return this.contracts.taskEscrow;
  }



  getUniversalRewardReadOnly(): Contract {
    if (!this.contracts.universalReward) {
      const addresses = getContractAddresses(ZETA_CHAIN_ID);
      this.contracts.universalReward = new Contract(addresses.universalReward, EverEchoUniversalRewardABI.abi, this.provider);
      console.log('[ZetaReadProvider] UniversalReward read-only contract created:', addresses.universalReward);
    }
    return this.contracts.universalReward;
  }

  // 获取所有只读合约
  getZetaContractsReadOnly() {
    return {
      taskEscrow: this.getTaskEscrowReadOnly(),
      universalReward: this.getUniversalRewardReadOnly(),
      provider: this.provider
    };
  }

  // 检查 ZetaChain 连接状态
  async checkConnection(): Promise<boolean> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      console.log('[ZetaReadProvider] Connection OK, latest block:', blockNumber);
      return true;
    } catch (error) {
      console.error('[ZetaReadProvider] Connection failed:', error);
      return false;
    }
  }

  // 获取网络信息
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      return {
        chainId: Number(network.chainId),
        name: network.name,
        connected: true
      };
    } catch (error) {
      console.error('[ZetaReadProvider] Failed to get network info:', error);
      return {
        chainId: ZETA_CHAIN_ID,
        name: 'ZetaChain Athens',
        connected: false
      };
    }
  }
}

// 导出单例实例和便捷函数
export const zetaReadProvider = ZetaReadProvider.getInstance();

export function getZetaReadProvider(): JsonRpcProvider {
  return zetaReadProvider.getProvider();
}

export function getZetaContractsReadOnly() {
  return zetaReadProvider.getZetaContractsReadOnly();
}

export default ZetaReadProvider;