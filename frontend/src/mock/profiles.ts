import { Profile } from './types';

/**
 * Mock 用户数据
 */
export const MOCK_PROFILES: Record<string, Profile> = {
  '0xAlice': {
    address: '0xAlice',
    profileURI: 'https://api.everecho.io/profile/alice.json',
    isRegistered: true,
    balance: '100',
  },
  '0xBob': {
    address: '0xBob',
    profileURI: 'https://api.everecho.io/profile/bob.json',
    isRegistered: true,
    balance: '100',
  },
  '0xCharlie': {
    address: '0xCharlie',
    profileURI: 'https://api.everecho.io/profile/charlie.json',
    isRegistered: true,
    balance: '100',
  },
};

// 当前连接的钱包地址（可切换）
let currentAddress: string | null = null;

export const getCurrentAddress = () => currentAddress;

export const setCurrentAddress = (address: string | null) => {
  currentAddress = address;
  if (address) {
    localStorage.setItem('mockAddress', address);
  } else {
    localStorage.removeItem('mockAddress');
  }
};

export const getProfile = (address: string): Profile | null => {
  return MOCK_PROFILES[address] || null;
};

export const registerProfile = (address: string, profileURI: string): Profile => {
  const profile: Profile = {
    address,
    profileURI,
    isRegistered: true,
    balance: '100', // 初始 mint
  };
  MOCK_PROFILES[address] = profile;
  return profile;
};

// 初始化：从 localStorage 恢复地址
const savedAddress = localStorage.getItem('mockAddress');
if (savedAddress && MOCK_PROFILES[savedAddress]) {
  currentAddress = savedAddress;
}
