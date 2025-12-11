import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContractAddresses, SUPPORTED_CHAIN_IDS, DEFAULT_CHAIN_ID } from '../contracts/addresses';
import RegisterABI from '../contracts/Register.json';
import EOCHOTokenABI from '../contracts/EOCHOToken.json';

/**
 * 真实钱包 Hook
 * 使用 MetaMask 连接
 */
export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true); // 初始为 true，表示还未检查
  const [balance, setBalance] = useState<string>('0');
  
  // 从 localStorage 读取断开状态
  const [_manuallyDisconnected, setManuallyDisconnected] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wallet_manually_disconnected') === 'true';
    }
    return false;
  });

  // 检查是否已连接（仅在非手动断开时）
  useEffect(() => {
    const isDisconnected = localStorage.getItem('wallet_manually_disconnected') === 'true';
    if (!isDisconnected) {
      checkConnection();
    } else {
      console.log('[useWallet] Skipping auto-connect: wallet was manually disconnected');
      setIsCheckingRegistration(false);
    }
  }, []);

  // 监听账户和网络变化
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('[useWallet] accountsChanged:', accounts);
      if (accounts.length === 0) {
        // 等价于 disconnect
        disconnect();
      } else {
        // 切换账户：立即清空旧账户的状态，避免显示错误信息
        console.log('[useWallet] Switching account, clearing old state');
        setIsCheckingRegistration(true); // 重新开始检查
        setIsRegistered(false);
        setBalance('0');
        setAddress(accounts[0]);
        // updateUserInfo() 会在 useEffect 中自动触发，重新读取链上状态
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // 当地址或 chainId 变化时，更新注册状态和余额
  useEffect(() => {
    if (address && chainId && provider) {
      updateUserInfo();
    }
  }, [address, chainId, provider]);

  const checkConnection = async () => {
    if (!window.ethereum) {
      setIsCheckingRegistration(false);
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        // 重置检查状态，准备检查注册
        setIsCheckingRegistration(true);
        
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();
        
        setProvider(provider);
        setSigner(signer);
        setAddress(address);
        setChainId(Number(network.chainId));
      } else {
        setIsCheckingRegistration(false);
      }
    } catch (err) {
      console.error('Check connection failed:', err);
      setIsCheckingRegistration(false);
    }
  };

  const connect = async (forceSelect = false) => {
    if (!window.ethereum) {
      setError('Please install MetaMask');
      return;
    }

    setIsConnecting(true);
    setError(null);
    
    // 清除手动断开标志
    setManuallyDisconnected(false);
    localStorage.removeItem('wallet_manually_disconnected');
    
    // 重置注册检查状态，准备重新检查
    setIsCheckingRegistration(true);
    setIsRegistered(false);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // 如果 forceSelect 为 true，尝试请求权限以弹出账号选择器
      if (forceSelect) {
        try {
          // 请求权限会弹出 MetaMask 窗口，让用户选择账号
          await window.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }],
          });
        } catch (permErr) {
          // 如果用户取消或不支持，回退到标准连接
          console.log('Permission request cancelled or not supported, using standard connect');
        }
      }
      
      await provider.send('eth_requestAccounts', []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);

      // 检查网络
      if (!SUPPORTED_CHAIN_IDS.includes(currentChainId)) {
        await switchNetwork(DEFAULT_CHAIN_ID);
        return;
      }

      setProvider(provider);
      setSigner(signer);
      setAddress(address);
      setChainId(currentChainId);
      setIsConnecting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnecting(false);
      setIsCheckingRegistration(false);
    }
  };

  const disconnect = () => {
    console.log('[useWallet] Disconnecting wallet...');
    
    // 设置手动断开标志到 localStorage，阻止自动重连
    setManuallyDisconnected(true);
    localStorage.setItem('wallet_manually_disconnected', 'true');
    
    // 清空所有前端状态（冻结点要求）
    setAddress(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setIsRegistered(false);
    setIsCheckingRegistration(false); // 重置检查状态
    setBalance('0');
    setError(null);
    
    console.log('[useWallet] Wallet disconnected, all state cleared');
    console.log('[useWallet] Auto-reconnect disabled. Click "Connect Wallet" to reconnect.');
    
    // Disconnect 后导航到首页，让用户重新连接
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  const switchNetwork = async (targetChainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (err: any) {
      // 如果网络不存在，尝试添加
      if (err.code === 4902) {
        await addNetwork(targetChainId);
      } else {
        throw err;
      }
    }
  };

  const addNetwork = async (targetChainId: number) => {
    if (!window.ethereum) return;

    const networkConfigs: Record<number, any> = {
      84532: {
        chainId: '0x14a34',
        chainName: 'Base Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://sepolia.base.org'],
        blockExplorerUrls: ['https://sepolia.basescan.org'],
      },
    };

    const config = networkConfigs[targetChainId];
    if (!config) {
      throw new Error(`Network ${targetChainId} not configured`);
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [config],
    });
  };

  const updateUserInfo = async () => {
    if (!address || !chainId || !provider) {
      setIsCheckingRegistration(false);
      return;
    }

    setIsCheckingRegistration(true);
    
    try {
      const addresses = getContractAddresses(chainId);
      console.log('[useWallet] Checking registration for:', address);
      console.log('[useWallet] Register contract:', addresses.register);
      
      // 检查注册状态
      const registerContract = new ethers.Contract(
        addresses.register,
        RegisterABI.abi,
        provider
      );
      const registered = await registerContract.isRegistered(address);
      console.log('[useWallet] isRegistered result:', registered);
      
      setIsRegistered(registered);

      // 获取余额
      const tokenContract = new ethers.Contract(
        addresses.echoToken,
        EOCHOTokenABI.abi,
        provider
      );
      const bal = await tokenContract.balanceOf(address);
      const formattedBalance = ethers.formatEther(bal);
      console.log('[useWallet] Balance:', formattedBalance, 'ECHO');
      
      setBalance(formattedBalance);
      setIsCheckingRegistration(false);
    } catch (err) {
      console.error('[useWallet] Update user info failed:', err);
      // 如果是网络错误，设置错误状态但不阻塞应用
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('missing revert data')) {
          setError('Network connection failed. Please check your RPC endpoint.');
          console.warn('[useWallet] RPC connection issue detected. User can still use the app with limited functionality.');
        }
      }
      // 设置默认值，允许用户继续使用应用
      setIsRegistered(false);
      setBalance('0');
      setIsCheckingRegistration(false);
    }
  };

  const refreshUserInfo = () => {
    updateUserInfo();
  };

  return {
    address,
    chainId,
    provider,
    signer,
    isConnecting,
    error,
    isRegistered,
    isCheckingRegistration,
    balance,
    connect,
    disconnect,
    switchNetwork,
    refreshUserInfo,
  };
}

// 扩展 Window 接口
declare global {
  interface Window {
    ethereum?: any;
  }
}
