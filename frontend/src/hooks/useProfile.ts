import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Profile } from '../types/profile';
import { getProfile } from '../utils/api';
import { getContractAddresses } from '../contracts/addresses';
import RegisterABI from '../contracts/Register.json';
import EOCHOTokenABI from '../contracts/EOCHOToken.json';

/**
 * Profile Hook
 * 冻结点 2.3-P0-F3：Profile 数据来源
 * - nickname/city/skills 来自 Backend API
 * - ECHO 余额来自链上 Token 合约
 * - contacts 来自 Backend API（从 profileURI 获取）
 */

export function useProfile(address: string | null, provider: ethers.Provider | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !provider) {
      setProfile(null);
      setBalance('0');
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);
        const addresses = getContractAddresses(chainId);

        // 1. 从链上获取 profileURI
        const registerContract = new ethers.Contract(
          addresses.register,
          RegisterABI.abi,
          provider
        );
        const profileURI = await registerContract.profileURI(address);
        
        if (!profileURI) {
          throw new Error('Profile not found. Please register first.');
        }

        // 2. 从后端获取 Profile 信息（包含 contacts）
        const profileData = await getProfile(address);
        setProfile(profileData);

        // 3. 获取 ECHO 余额（链上）
        const tokenContract = new ethers.Contract(
          addresses.echoToken,
          EOCHOTokenABI.abi,
          provider
        );
        const balanceWei = await tokenContract.balanceOf(address);
        setBalance(balanceWei.toString());
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [address, provider]);

  return {
    profile,
    balance,
    loading,
    error,
  };
}
