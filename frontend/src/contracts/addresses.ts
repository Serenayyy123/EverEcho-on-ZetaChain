/**
 * 合约地址配置
 * 根据环境变量或 chainId 返回对应的合约地址
 */

export interface ContractAddresses {
  echoToken: string;
  register: string;
  taskEscrow: string;
}

// Base Sepolia Testnet (84532)
const BASE_SEPOLIA_ADDRESSES: ContractAddresses = {
  echoToken: import.meta.env.VITE_EOCHO_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
  register: import.meta.env.VITE_REGISTER_ADDRESS || '0x0000000000000000000000000000000000000000',
  taskEscrow: import.meta.env.VITE_TASK_ESCROW_ADDRESS || '0x0000000000000000000000000000000000000000',
};

// Hardhat Local (31337)
const HARDHAT_ADDRESSES: ContractAddresses = {
  echoToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  register: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  taskEscrow: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
};

export function getContractAddresses(chainId: number): ContractAddresses {
  switch (chainId) {
    case 84532: // Base Sepolia
      return BASE_SEPOLIA_ADDRESSES;
    case 31337: // Hardhat Local
      return HARDHAT_ADDRESSES;
    default:
      console.warn(`Unknown chainId ${chainId}, using Base Sepolia addresses`);
      return BASE_SEPOLIA_ADDRESSES;
  }
}

// 导出常量
export const SUPPORTED_CHAIN_IDS = [84532, 31337];
export const DEFAULT_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '84532');

// 导出单个合约地址（用于向后兼容）
export const EOCHO_TOKEN_ADDRESS = import.meta.env.VITE_EOCHO_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';
export const REGISTER_ADDRESS = import.meta.env.VITE_REGISTER_ADDRESS || '0x0000000000000000000000000000000000000000';
export const TASK_ESCROW_ADDRESS = import.meta.env.VITE_TASK_ESCROW_ADDRESS || '0x0000000000000000000000000000000000000000';
