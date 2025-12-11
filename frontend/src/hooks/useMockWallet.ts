import { useState, useEffect } from 'react';
import { getCurrentAddress, setCurrentAddress, getProfile, MOCK_PROFILES } from '../mock/profiles';

/**
 * Mock 钱包 Hook
 * 模拟钱包连接、断开、地址切换
 */
export function useMockWallet() {
  const [address, setAddress] = useState<string | null>(getCurrentAddress());
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setAddress(getCurrentAddress());
  }, []);

  const connect = async (mockAddress?: string) => {
    setIsConnecting(true);
    // 模拟连接延迟
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const addr = mockAddress || '0xAlice'; // 默认连接 Alice
    setCurrentAddress(addr);
    setAddress(addr);
    setIsConnecting(false);
  };

  const disconnect = () => {
    setCurrentAddress(null);
    setAddress(null);
  };

  const switchAccount = (newAddress: string) => {
    if (MOCK_PROFILES[newAddress]) {
      setCurrentAddress(newAddress);
      setAddress(newAddress);
    }
  };

  const profile = address ? getProfile(address) : null;
  const isRegistered = profile?.isRegistered || false;
  const balance = profile?.balance || '0';

  return {
    address,
    isConnecting,
    isRegistered,
    balance,
    connect,
    disconnect,
    switchAccount,
    availableAccounts: Object.keys(MOCK_PROFILES),
  };
}
