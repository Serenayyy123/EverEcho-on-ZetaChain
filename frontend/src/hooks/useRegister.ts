import { useState } from 'react';
import { ethers } from 'ethers';
import { apiClient, ProfileData } from '../api/client';
import { getContractAddresses, SUPPORTED_CHAIN_IDS } from '../contracts/addresses';
import RegisterABI from '../contracts/Register.json';
import EOCHOTokenABI from '../contracts/EOCHOToken.json';

/**
 * 真实注册 Hook
 * 流程：前端 → POST /api/profile → profileURI → register(profileURI)
 * 冻结点 1.2-8：检测 CAP 满时 mintedAmount=0 并提示
 */
export function useRegister(
  signer: ethers.Signer | null,
  chainId: number | null,
  onSuccess?: (mintedAmount: string) => void
) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [capReached, setCapReached] = useState(false);

  const register = async (profileData: ProfileData) => {
    if (!signer || !chainId) {
      setError('Wallet not connected');
      return false;
    }

    // chainId guard: 检查是否在支持的网络上
    if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
      setError('Wrong network. Please switch to Sepolia or Hardhat Local.');
      console.error(`register blocked: unsupported chainId ${chainId}`);
      return false;
    }

    setIsRegistering(true);
    setError(null);
    setTxHash(null);
    setCapReached(false);

    try {
      const addresses = getContractAddresses(chainId);
      const userAddress = await signer.getAddress();

      // Step 0: 记录注册前余额（冻结点 1.2-8）
      const tokenContract = new ethers.Contract(
        addresses.echoToken,
        EOCHOTokenABI.abi,
        signer
      );
      const balanceBefore: bigint = await tokenContract.balanceOf(userAddress);
      console.log('Balance before registration:', ethers.formatEther(balanceBefore));

      // Step 1: 上传 profile 到后端，获取 profileURI
      console.log('Uploading profile to backend...');
      const { profileURI } = await apiClient.createProfile(profileData);
      console.log('Profile URI:', profileURI);

      if (!profileURI) {
        throw new Error('Failed to get profileURI from backend');
      }

      // Step 2: 调用 Register 合约
      const registerContract = new ethers.Contract(
        addresses.register,
        RegisterABI.abi,
        signer
      );

      console.log('Calling register contract...');
      const tx = await registerContract.register(profileURI);
      setTxHash(tx.hash);
      console.log('Transaction sent:', tx.hash);

      // 等待确认
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);

      // Step 3: 检查注册后余额变化（冻结点 1.2-8）
      const balanceAfter: bigint = await tokenContract.balanceOf(userAddress);
      const mintedAmount = balanceAfter - balanceBefore;
      const mintedAmountFormatted = ethers.formatEther(mintedAmount);
      
      console.log('Balance after registration:', ethers.formatEther(balanceAfter));
      console.log('Minted amount:', mintedAmountFormatted);

      // Step 4: 检测 CAP 满（冻结点 1.2-8）
      if (mintedAmount === 0n) {
        console.warn('CAP reached: no ECHO minted');
        setCapReached(true);
      }

      setIsRegistering(false);
      
      if (onSuccess) {
        onSuccess(mintedAmountFormatted);
      }

      return true;
    } catch (err: any) {
      console.error('Registration failed:', err);
      
      let errorMessage = 'Registration failed';
      if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsRegistering(false);
      return false;
    }
  };

  return {
    register,
    isRegistering,
    error,
    txHash,
    capReached,
  };
}
