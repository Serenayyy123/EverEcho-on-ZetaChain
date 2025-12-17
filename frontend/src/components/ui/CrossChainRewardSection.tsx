import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Alert } from './Alert';
import { ethers } from 'ethers';
import { SUPPORTED_ASSETS, TARGET_CHAINS, createUniversalRewardContract, getContractAssetAddress } from '../../config/contracts';
import NetworkStatusIndicator from './NetworkStatusIndicator';
import { SelectedAsset } from '../../stores/crossChainDraftStore';
import CrossChainDraftStore from '../../stores/crossChainDraftStore';
import NetworkGuard from '../../services/networkGuard';
// import { getSignerFresh } from '../../services/walletWriteProvider'; // 已通过 networkGuard.refreshSigner() 替代

// 辅助函数：检查 ZRC20 代币余额（在 ZetaChain 上）
async function checkZRC20TokenBalance(address: string, tokenAddress: string): Promise<bigint> {
  console.log(`🔍 Checking ZRC20 token balance on ZetaChain for token ${tokenAddress}`);
  
  const rpcUrl = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';
  
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl, 7001, {
      staticNetwork: true
    });
    
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
      provider
    );
    
    const [balance, decimals] = await Promise.race([
      Promise.all([
        tokenContract.balanceOf(address),
        tokenContract.decimals()
      ]),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('RPC timeout')), 15000)
      )
    ]);
    
    console.log(`✅ ZRC20 balance on ZetaChain: ${ethers.formatUnits(balance, decimals)} tokens`);
    return balance;
  } catch (error: any) {
    console.error(`❌ Failed to check ZRC20 balance:`, error.message);
    throw new Error(`Failed to check ZRC20 balance: ${error.message}`);
  }
}

// 辅助函数：检查原生代币余额
async function checkNativeTokenBalance(address: string, chainId: number): Promise<bigint> {
  console.log(`🔍 Checking native token balance on chain ${chainId} for address ${address}`);
  
  // 使用多个RPC端点作为备选，提高可靠性
  const rpcUrls: Record<number, string[]> = {
    11155111: [
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://sepolia.gateway.tenderly.co',
      'https://rpc.sepolia.org'
    ],
    7001: [
      'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
      'https://rpc.ankr.com/zetachain_evm_athens_testnet'
    ]
  };
  
  const urls = rpcUrls[chainId];
  if (!urls || urls.length === 0) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  
  // 尝试多个RPC端点，直到成功
  for (let i = 0; i < urls.length; i++) {
    const rpcUrl = urls[i];
    try {
      console.log(`🔗 Trying RPC endpoint ${i + 1}/${urls.length}: ${rpcUrl}`);
      
      const provider = new ethers.JsonRpcProvider(rpcUrl, chainId, {
        staticNetwork: true // 避免网络检测请求
      });
      
      // 设置超时
      const balance = await Promise.race([
        provider.getBalance(address),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('RPC timeout')), 10000)
        )
      ]);
      
      console.log(`✅ Balance on chain ${chainId}: ${ethers.formatEther(balance)} native token`);
      return balance;
    } catch (error: any) {
      console.warn(`⚠️ RPC endpoint ${i + 1} failed:`, error.message);
      
      // 如果是最后一个端点，抛出错误
      if (i === urls.length - 1) {
        console.error(`❌ All RPC endpoints failed for chain ${chainId}`);
        throw new Error(`Failed to check balance on chain ${chainId}: ${error.message}`);
      }
      
      // 否则继续尝试下一个端点
      continue;
    }
  }
  
  throw new Error(`No working RPC endpoint found for chain ${chainId}`);
}

// 辅助函数：检查ERC20代币余额
async function checkERC20TokenBalance(address: string, tokenAddress: string, chainId: number): Promise<bigint> {
  console.log(`🔍 Checking ERC20 token balance on chain ${chainId} for token ${tokenAddress}`);
  
  // 使用多个RPC端点作为备选，提高可靠性
  const rpcUrls: Record<number, string[]> = {
    11155111: [
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://sepolia.gateway.tenderly.co',
      'https://rpc.sepolia.org'
    ],
    7001: [
      'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
      'https://rpc.ankr.com/zetachain_evm_athens_testnet'
    ]
  };
  
  const urls = rpcUrls[chainId];
  if (!urls || urls.length === 0) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  
  // 尝试多个RPC端点，直到成功
  for (let i = 0; i < urls.length; i++) {
    const rpcUrl = urls[i];
    try {
      console.log(`🔗 Trying RPC endpoint ${i + 1}/${urls.length} for ERC20: ${rpcUrl}`);
      
      const provider = new ethers.JsonRpcProvider(rpcUrl, chainId, {
        staticNetwork: true // 避免网络检测请求
      });
      
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
        provider
      );
      
      // 设置超时并并行查询
      const [balance, decimals] = await Promise.race([
        Promise.all([
          tokenContract.balanceOf(address),
          tokenContract.decimals()
        ]),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('RPC timeout')), 15000)
        )
      ]);
      
      console.log(`✅ ERC20 balance on chain ${chainId}: ${ethers.formatUnits(balance, decimals)} tokens`);
      return balance;
    } catch (error: any) {
      console.warn(`⚠️ ERC20 RPC endpoint ${i + 1} failed:`, error.message);
      
      // 如果是最后一个端点，抛出错误
      if (i === urls.length - 1) {
        console.error(`❌ All ERC20 RPC endpoints failed for chain ${chainId}`);
        throw new Error(`Failed to check ERC20 balance on chain ${chainId}: ${error.message}`);
      }
      
      // 否则继续尝试下一个端点
      continue;
    }
  }
  
  throw new Error(`No working RPC endpoint found for ERC20 on chain ${chainId}`);
}

interface CrossChainRewardSectionProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onRewardPrepared: (rewardId: string) => void;
  disabled?: boolean;
}

interface RewardPlan {
  asset: string;
  amount: string;
  targetChainId: string;
  status: 'none' | 'preparing' | 'prepared' | 'deposited' | 'error' | 'switching' | 'depositing';
  rewardId?: string;
  error?: string;
}

// 修复版：资产映射配置
const ASSET_MAPPING: Record<string, SelectedAsset> = {
  'ETH_SEPOLIA': {
    key: 'ETH_SEPOLIA_NATIVE',
    displayName: 'ETH Sepolia',
    symbol: 'ETH',
    sourceChainId: 11155111,
    kind: 'native'
  },
  'USDC_SEPOLIA': {
    key: 'USDC_SEPOLIA_ERC20',
    displayName: 'USDC Sepolia',
    symbol: 'USDC',
    sourceChainId: 11155111,
    kind: 'erc20',
    tokenAddress: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238'
  },
  'ZETA_NATIVE': {
    key: 'ZETA_ATHENS_NATIVE',
    displayName: 'ZetaChain Testnet',
    symbol: 'ZETA',
    sourceChainId: 7001,
    kind: 'native'
  }
};



export function CrossChainRewardSection({ 
  isEnabled, 
  onToggle, 
  onRewardPrepared, 
  disabled = false 
}: CrossChainRewardSectionProps) {
  const [rewardPlan, setRewardPlan] = useState<RewardPlan>({
    asset: SUPPORTED_ASSETS[0].value,
    amount: '0.01',
    targetChainId: TARGET_CHAINS[0].value,
    status: 'none'
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [userBalance, setUserBalance] = useState<string>('0');
  const [address, setAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stage 4.9.x: 集成持久化存储和网络管理
  const networkGuard = NetworkGuard.getInstance();
  const draftStore = CrossChainDraftStore.getInstance();

  // 修复版：初始化和状态恢复
  useEffect(() => {
    const initializeComponent = async () => {
      // 1. 检查钱包连接状态
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }

      // 2. 从持久化存储恢复状态
      const draft = draftStore.getDraft();
      if (draft.enabled && isEnabled) {
        console.log('[CrossChainRewardSection] Restoring from draft store:', draft);
        
        if (draft.asset) {
          // 从 SelectedAsset 恢复到 UI 状态
          const assetValue = Object.keys(ASSET_MAPPING).find(
            key => ASSET_MAPPING[key].key === draft.asset!.key
          );
          if (assetValue) {
            setRewardPlan(prev => ({ ...prev, asset: assetValue }));
          }
        }
        
        if (draft.amount) {
          setRewardPlan(prev => ({ ...prev, amount: draft.amount! }));
        }
        
        // 恢复存入状态 - 添加时间验证和用户确认，防止恢复虚假状态
        if (draft.depositStatus === 'confirmed' && draft.lastUpdatedAt) {
          const timeSinceUpdate = Date.now() - draft.lastUpdatedAt;
          const MAX_RESTORE_TIME = 3 * 60 * 1000; // 进一步缩短到3分钟，减少误恢复
          
          if (timeSinceUpdate < MAX_RESTORE_TIME) {
            console.log('[CrossChainRewardSection] Restoring recent confirmed deposit');
            console.warn('⚠️ 如果您没有实际存入跨链奖励，请使用重置按钮清理状态');
            setRewardPlan(prev => ({ 
              ...prev, 
              status: 'deposited',
              rewardId: 'restored' // 标记为已恢复状态
            }));
            
            // 显示用户确认对话框
            setTimeout(() => {
              const userConfirm = window.confirm(
                '检测到之前的跨链奖励状态。\n\n' +
                '如果您确实在3分钟内存入了跨链奖励，请点击"确定"继续。\n' +
                '如果您没有实际存入奖励，请点击"取消"清理状态。'
              );
              
              if (!userConfirm) {
                console.log('[CrossChainRewardSection] User chose to clear restored state');
                draftStore.reset();
                setRewardPlan(prev => ({
                  ...prev,
                  status: 'none',
                  rewardId: undefined,
                  error: undefined
                }));
              }
            }, 1000);
          } else {
            console.log('[CrossChainRewardSection] Deposit status too old, clearing...');
            draftStore.reset(); // 清理过期状态
          }
        }
      }
    };

    initializeComponent();

    // 监听账户变化
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          // 账户变化时重新获取余额
          updateBalance(accounts[0]);
        } else {
          setAddress('');
          setIsConnected(false);
          setUserBalance('0');
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [isEnabled]);

  // 更新余额的辅助函数 - 检查用户在源网络上的实际余额
  const updateBalance = async (walletAddress?: string, assetOverride?: string) => {
    if (!window.ethereum) return;
    
    try {
      const targetAddress = walletAddress || address;
      if (!targetAddress) return;

      const currentAsset = assetOverride || rewardPlan.asset;
      const selectedAsset = SUPPORTED_ASSETS.find(asset => asset.value === currentAsset) || SUPPORTED_ASSETS[0];
      const selectedAssetObj = ASSET_MAPPING[currentAsset];
      let balance: bigint;
      
      console.log(`🔄 Updating balance for asset: ${selectedAsset.label} on source network ${selectedAssetObj.sourceChainId}`);
      
      // 修复：检查用户在源网络上的实际余额，而不是 ZetaChain 上的 ZRC20 余额
      if (selectedAssetObj.kind === 'native') {
        // 检查源网络上的原生代币余额
        console.log(`📡 Checking native token balance on chain ${selectedAssetObj.sourceChainId}...`);
        balance = await checkNativeTokenBalance(targetAddress, selectedAssetObj.sourceChainId);
      } else if (selectedAssetObj.kind === 'erc20' && selectedAssetObj.tokenAddress) {
        // 检查源网络上的 ERC20 代币余额
        console.log(`📡 Checking ERC20 token balance on chain ${selectedAssetObj.sourceChainId} for token ${selectedAssetObj.tokenAddress}...`);
        balance = await checkERC20TokenBalance(targetAddress, selectedAssetObj.tokenAddress, selectedAssetObj.sourceChainId);
      } else {
        throw new Error(`Unsupported asset configuration: ${currentAsset}`);
      }
      
      const balanceFormatted = parseFloat(ethers.formatUnits(balance, selectedAsset.decimals));
      setUserBalance(balanceFormatted.toFixed(6));
      console.log(`✅ Balance updated: ${balanceFormatted.toFixed(6)} ${selectedAsset.symbol} on chain ${selectedAssetObj.sourceChainId}`);
      
    } catch (error: any) {
      console.error('Error updating balance:', error);
      
      // 设置错误状态但不显示错误消息（这是后台更新）
      setUserBalance('--');
      
      // 如果是JSON解析错误，记录详细信息
      if (error.message && error.message.includes('JSON')) {
        console.error('JSON parsing error details:', {
          message: error.message,
          asset: assetOverride || rewardPlan.asset,
          address: walletAddress || address
        });
      }
    }
  };

  // 连接钱包函数
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('请安装 MetaMask 钱包');
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        
        // 连接成功后获取余额
        await updateBalance(accounts[0]);
        
        setError(null);
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setError('连接钱包失败: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };



  // 重置状态当禁用时
  useEffect(() => {
    if (!isEnabled) {
      setRewardPlan(prev => ({
        ...prev,
        status: 'none',
        rewardId: undefined,
        error: undefined
      }));
    }
  }, [isEnabled]);

  const handleToggle = () => {
    const newEnabled = !isEnabled;
    onToggle(newEnabled);
    setIsExpanded(newEnabled);
    
    // 修复版：同步到持久化存储
    draftStore.setEnabled(newEnabled);
    
    if (!newEnabled) {
      // 禁用时重置网络模式
      networkGuard.setMode('idle');
    }
  };

  const handlePrepareReward = async () => {
    if (!isEnabled || disabled || !isConnected) return;
    setLoading(true);
    setError(null);
    setRewardPlan(prev => ({ ...prev, status: 'preparing', error: undefined }));

    try {
      if (!window.ethereum) {
        throw new Error('请安装 MetaMask');
      }

      const amount = parseFloat(rewardPlan.amount);

      // 1. 检查用户在源网络上的实际余额
      console.log(`Checking source network balance for asset: ${rewardPlan.asset}...`);
      
      const selectedAsset = getSelectedAsset();
      const selectedAssetObj = getSelectedAssetObject();
      let balance: bigint;
      
      try {
        if (selectedAssetObj.kind === 'native') {
          // 检查源网络上的原生代币余额
          console.log(`📡 Checking native token balance on source chain ${selectedAssetObj.sourceChainId}...`);
          balance = await checkNativeTokenBalance(address, selectedAssetObj.sourceChainId);
        } else if (selectedAssetObj.kind === 'erc20' && selectedAssetObj.tokenAddress) {
          // 检查源网络上的 ERC20 代币余额
          console.log(`📡 Checking ERC20 token balance on source chain ${selectedAssetObj.sourceChainId} for token ${selectedAssetObj.tokenAddress}...`);
          balance = await checkERC20TokenBalance(address, selectedAssetObj.tokenAddress, selectedAssetObj.sourceChainId);
        } else {
          throw new Error(`Unsupported asset configuration: ${rewardPlan.asset}`);
        }
      } catch (balanceError: any) {
        console.error('Balance check failed:', balanceError);
        
        // 提供更友好的错误信息
        let errorMessage = '无法获取余额';
        if (balanceError.message.includes('timeout')) {
          errorMessage = '网络请求超时，请稍后重试';
        } else if (balanceError.message.includes('Failed to check balance')) {
          errorMessage = '网络连接失败，请检查网络连接后重试';
        } else if (balanceError.message.includes('Invalid JSON')) {
          errorMessage = 'RPC服务暂时不可用，请稍后重试';
        } else {
          errorMessage = `余额查询失败: ${balanceError.message}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const balanceFormatted = parseFloat(ethers.formatUnits(balance, selectedAsset.decimals));
      console.log(`Balance check: ${balanceFormatted} ${selectedAsset.symbol}, required: ${amount} ${selectedAsset.symbol}`);
      
      // 更新UI显示的余额
      setUserBalance(balanceFormatted.toFixed(6));
      console.log(`✅ Updated UI balance: ${balanceFormatted.toFixed(6)} ${selectedAsset.symbol}`);
      
      // 检查余额是否充足
      if (balanceFormatted < amount) {
        throw new Error(`余额不足。当前余额: ${balanceFormatted.toFixed(4)} ${selectedAsset.symbol}，需要: ${amount} ${selectedAsset.symbol}`);
      }

      // 3. 余额检查通过，准备就绪
      console.log(`Balance check passed. Ready for deposit.`);
      
      setRewardPlan(prev => ({
        ...prev,
        status: 'prepared' // 余额检查通过，等待存入
      }));
      
      console.log('Balance check completed. User can now deposit funds.');
      
    } catch (error: any) {
      console.error('Error preparing reward plan:', error);
      let errorMessage = error.message || 'Failed to prepare reward';
      
      // 处理常见的网络切换错误
      if (errorMessage.includes('user rejected') || errorMessage.includes('User rejected')) {
        errorMessage = '用户取消了网络切换';
      } else if (errorMessage.includes('missing revert data')) {
        errorMessage = '网络切换失败，请手动切换到正确的网络后重试';
      }
      
      setError(errorMessage);
      setRewardPlan(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!isConnected) return;

    setLoading(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error('请安装 MetaMask');
      }

      // 修复版：1. 获取选中的资产对象
      const selectedAssetObj = getSelectedAssetObject();
      console.log('[CrossChainRewardSection] Selected asset:', selectedAssetObj);

      // 修复版：2. 跨链奖励需要在 ZetaChain 上调用合约
      setRewardPlan(prev => ({ ...prev, status: 'switching' }));
      
      // 对于跨链奖励，我们需要切换到 ZetaChain 来调用 UniversalReward 合约
      const switchResult = await networkGuard.ensureNetworkFor('publish'); // 切换到 ZetaChain
      
      if (!switchResult.ok) {
        throw new Error(switchResult.reason || 'Failed to switch to ZetaChain');
      }

      setRewardPlan(prev => ({ ...prev, status: 'depositing' }));

      // 修复版：3. 切链成功后，获取新鲜的 signer（在 ZetaChain 上）
      console.log('🔄 Getting fresh signer on ZetaChain...');
      const signer = await networkGuard.refreshSigner();
      
      // 4. 创建UniversalReward合约实例（在 ZetaChain 上）
      const contract = createUniversalRewardContract(signer, 7001); // 合约在ZetaChain上
      
      // 5. 准备合约调用参数
      const amountWei = ethers.parseEther(rewardPlan.amount);
      const targetChain = BigInt(rewardPlan.targetChainId);
      const contractAssetAddress = getContractAssetAddress(rewardPlan.asset);
      
      console.log('Creating and depositing reward plan:', { 
        originalAsset: rewardPlan.asset, 
        zrc20Asset: contractAssetAddress, 
        amount: rewardPlan.amount, 
        targetChainId: rewardPlan.targetChainId
      });
      
      // 修复版：使用一步流程 - preparePlan() 自动处理存入
      let rewardId: string;
      let prepareTx: any;
      
      console.log('🔄 Creating and depositing reward plan in one step...');
      
      if (contractAssetAddress === '0x0000000000000000000000000000000000000000') {
        // 原生 ZETA 代币：发送 value 到 preparePlan 函数
        console.log('🔄 Preparing plan with native ZETA...');
        prepareTx = await contract.preparePlan(contractAssetAddress, amountWei, targetChain, { value: amountWei });
      } else {
        // ZRC20 代币：需要先 approve，然后调用 preparePlan
        console.log('🔄 Preparing plan with ZRC20 token:', contractAssetAddress);
        
        // 首先 approve ZRC20 代币给 UniversalReward 合约
        const zrc20Contract = new ethers.Contract(
          contractAssetAddress,
          ['function approve(address spender, uint256 amount) returns (bool)'],
          signer
        );
        
        const universalRewardAddress = contract.target;
        console.log('🔄 Approving ZRC20 token...');
        const approveTx = await zrc20Contract.approve(universalRewardAddress, amountWei);
        await approveTx.wait();
        console.log('✅ ZRC20 approval successful');
        
        // 然后调用 preparePlan（不需要发送 value）
        prepareTx = await contract.preparePlan(contractAssetAddress, amountWei, targetChain);
      }
      
      const prepareReceipt = await prepareTx.wait();
      
      // 解析 RewardPlanCreated 事件获取 rewardId
      const createEvent = prepareReceipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'RewardPlanCreated';
        } catch {
          return false;
        }
      });

      if (!createEvent) {
        throw new Error('Failed to get reward ID from preparePlan transaction');
      }

      const parsedCreateEvent = contract.interface.parseLog(createEvent);
      rewardId = parsedCreateEvent?.args?.rewardId?.toString();
      
      if (!rewardId) {
        throw new Error('Failed to parse reward ID from event');
      }
      
      // 检查是否同时有 RewardDeposited 事件（一步流程的证据）
      const depositEvent = prepareReceipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'RewardDeposited';
        } catch {
          return false;
        }
      });
      
      if (depositEvent) {
        console.log('✅ One-step flow: Reward plan created and deposited with ID:', rewardId);
      } else {
        console.log('✅ Reward plan created with ID:', rewardId, '(deposit may be needed separately)');
      }
      
      console.log('✅ Reward preparation completed successfully');
      
      // 8. 更新状态
      setRewardPlan(prev => ({
        ...prev,
        status: 'deposited',
        rewardId
      }));
      
      // 修复版：9. 保存到持久化存储
      draftStore.updateDraft({
        enabled: true,
        asset: selectedAssetObj,
        amount: rewardPlan.amount,
        depositStatus: 'confirmed',
        depositTxHash: prepareReceipt.hash
      });
      
      onRewardPrepared(rewardId);
      console.log('✅ Reward plan created and deposited with ID:', rewardId);
      
      // Stage 4.9.x: 存入成功，设置为 depositReady 模式
      networkGuard.setMode('depositReady');
      
      // 10. 更新余额
      await updateBalance();
      
    } catch (error: any) {
      console.error('Error depositing reward:', error);
      let errorMessage = error.message || 'Failed to deposit reward';
      
      // 处理常见的网络切换错误
      if (errorMessage.includes('user rejected') || errorMessage.includes('User rejected')) {
        errorMessage = '用户取消了操作';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = '余额不足，请检查您的余额';
      }
      
      setError(errorMessage);
      setRewardPlan(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
      
      // 修复版：失败时保存错误状态
      draftStore.setDepositStatus('failed');
      
      // 失败时重置模式
      networkGuard.setMode('idle');
    } finally {
      setLoading(false);
    }
  };



  const getSelectedAsset = () => {
    return SUPPORTED_ASSETS.find(asset => asset.value === rewardPlan.asset) || SUPPORTED_ASSETS[0];
  };

  // 修复版：获取选中资产的完整对象
  const getSelectedAssetObject = (): SelectedAsset => {
    const mapping = ASSET_MAPPING[rewardPlan.asset];
    if (!mapping) {
      throw new Error(`Asset mapping not found for: ${rewardPlan.asset}`);
    }
    return mapping;
  };

  const getSelectedChain = () => {
    return TARGET_CHAINS.find(chain => chain.value === rewardPlan.targetChainId) || TARGET_CHAINS[0];
  };

  return (
    <div style={styles.container}>
      {/* Toggle Header */}
      <div style={styles.header} onClick={handleToggle}>
        <div style={styles.headerLeft}>
          <span style={styles.toggleIcon}>
            {isEnabled ? '✅' : '⬜'}
          </span>
          <span style={styles.headerTitle}>
            跨链奖励 (可选)
          </span>
          {rewardPlan.status === 'deposited' && (
            <span style={styles.statusBadge}>已准备</span>
          )}
        </div>
        <span style={styles.expandIcon}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={styles.content}>
          <div style={styles.description}>
            <p style={styles.descriptionText}>
              为任务添加跨链奖励，Helper 完成任务后可在目标链领取
            </p>
            <div style={styles.warningBox}>
              <span style={styles.warningIcon}>⚠️</span>
              <div style={styles.warningText}>
                <div>• 跨链奖励需要您在源网络上有足够的代币余额</div>
                <div>• 系统会自动将资产转移到 ZetaChain 进行跨链处理</div>
                <div>• 发布后不可撤回，Helper 完成任务后可在目标链领取</div>
                <div>• 跨链转账需要 5-15 分钟，请确保有足够的 Gas 费用</div>
                <div>• 交易记录可在 ZetaChain Athens 浏览器查看</div>
              </div>
            </div>
          </div>

          {isEnabled && (
            <>
              {/* Stage 4.9: 网络状态指示器 */}
              <NetworkStatusIndicator 
                currentAction="deposit"
                selectedAsset={getSelectedAssetObject()}
                depositStatus={rewardPlan.status as any}
              />

              {/* 钱包连接状态 */}
              {!isConnected && (
                <div style={styles.walletSection}>
                  <div style={styles.warningBox}>
                    <span style={styles.warningIcon}>⚠️</span>
                    <div style={styles.warningText}>
                      请先连接钱包以使用跨链奖励功能
                    </div>
                  </div>
                  <Button
                    onClick={connectWallet}
                    disabled={loading}
                    style={styles.connectButton}
                  >
                    {loading ? '连接中...' : '连接钱包'}
                  </Button>
                </div>
              )}



            <div style={styles.form}>
              {/* Asset Selection */}
              <div style={styles.formGroup}>
                <label style={styles.label}>奖励资产</label>
                <select
                  value={rewardPlan.asset}
                  onChange={async (e) => {
                    const newAsset = e.target.value;
                    setRewardPlan(prev => ({ ...prev, asset: newAsset }));
                    
                    // 修复版：同步到持久化存储
                    const assetObj = ASSET_MAPPING[newAsset];
                    if (assetObj) {
                      draftStore.setAsset(assetObj);
                    }
                    
                    // 资产变化时，如果已连接钱包，则立即更新对应网络的余额
                    if (isConnected && address) {
                      setUserBalance('0'); // 先重置为0，显示加载状态
                      try {
                        await updateBalance(address, newAsset);
                      } catch (error) {
                        console.error('Error updating balance after asset change:', error);
                        setUserBalance('0');
                      }
                    }
                  }}
                  style={styles.select}
                  disabled={disabled || rewardPlan.status !== 'none'}
                >
                  {SUPPORTED_ASSETS.map(asset => (
                    <option key={asset.value} value={asset.value}>
                      {asset.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  奖励数量 ({getSelectedAsset().symbol})
                </label>
                <Input
                  type="number"
                  value={rewardPlan.amount}
                  onChange={(e) => {
                    const newAmount = e.target.value;
                    setRewardPlan(prev => ({ ...prev, amount: newAmount }));
                    
                    // 修复版：同步到持久化存储
                    draftStore.setAmount(newAmount);
                  }}
                  placeholder="0.01"
                  step="0.001"
                  min="0"
                  disabled={disabled || rewardPlan.status !== 'none'}
                />
                {isConnected && (
                  <div style={styles.balanceInfo}>
                    <span style={styles.balanceLabel}>源网络余额:</span>
                    <span style={styles.balanceValue}>{userBalance} {getSelectedAsset().symbol}</span>
                    <button
                      type="button"
                      onClick={() => updateBalance()}
                      style={styles.refreshButton}
                      disabled={loading}
                    >
                      🔄
                    </button>
                  </div>
                )}
              </div>

              {/* Target Chain */}
              <div style={styles.formGroup}>
                <label style={styles.label}>目标链</label>
                <select
                  value={rewardPlan.targetChainId}
                  onChange={(e) => setRewardPlan(prev => ({ ...prev, targetChainId: e.target.value }))}
                  style={styles.select}
                  disabled={disabled || rewardPlan.status !== 'none'}
                >
                  {TARGET_CHAINS.map(chain => (
                    <option key={chain.value} value={chain.value}>
                      {chain.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status and Actions */}
              <div style={styles.statusSection}>
                {rewardPlan.status === 'none' && (
                  <Button
                    onClick={handlePrepareReward}
                    disabled={disabled || !isConnected || !rewardPlan.amount || parseFloat(rewardPlan.amount) <= 0 || loading}
                    loading={loading}
                    variant="secondary"
                    size="sm"
                  >
                    准备跨链奖励
                  </Button>
                )}

                {(rewardPlan.status === 'preparing' || rewardPlan.status === 'switching' || rewardPlan.status === 'depositing' || loading) && (
                  <div style={styles.loadingState}>
                    <span style={styles.spinner}>⏳</span>
                    <span>
                      {rewardPlan.status === 'switching' && '切换到 ZetaChain 网络中...'}
                      {rewardPlan.status === 'depositing' && '在 ZetaChain 上存入资金中...'}
                      {(rewardPlan.status === 'preparing' || loading) && '准备跨链奖励中...'}
                    </span>
                  </div>
                )}

                {rewardPlan.status === 'prepared' && (
                  <div style={styles.actionGroup}>
                    <Button
                      onClick={handleDeposit}
                      disabled={disabled || !isConnected || loading}
                      loading={loading}
                      variant="primary"
                      size="sm"
                    >
                      存入资金
                    </Button>
                    <div style={styles.preparedHint}>
                      <span style={styles.checkIcon}>✅</span>
                      <span>余额检查通过，可以存入资金</span>
                    </div>
                  </div>
                )}

                {rewardPlan.status === 'deposited' && (
                  <div style={styles.successState}>
                    <span style={styles.successIcon}>✅</span>
                    <div style={styles.successText}>
                      <div>跨链奖励已准备就绪</div>
                      <div style={styles.successDetails}>
                        {rewardPlan.amount} {getSelectedAsset().symbol} → {getSelectedChain().label}
                      </div>
                      <div style={styles.crossChainNote}>
                        <span style={styles.noteIcon}>🌉</span>
                        <span>资金已锁定在 ZetaChain，Helper 完成任务后可跨链领取</span>
                      </div>
                    </div>
                  </div>
                )}

                {(rewardPlan.status === 'error' && rewardPlan.error) || error ? (
                  <Alert variant="error">
                    {rewardPlan.error || error}
                  </Alert>
                ) : null}
              </div>

              {/* Summary */}
              {rewardPlan.status === 'deposited' && (
                <div style={styles.summary}>
                  <div style={styles.summaryTitle}>奖励摘要</div>
                  <div style={styles.summaryItem}>
                    <span>资产:</span>
                    <span>{getSelectedAsset().label}</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span>数量:</span>
                    <span>{rewardPlan.amount} {getSelectedAsset().symbol}</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span>目标链:</span>
                    <span>{getSelectedChain().label}</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span>状态:</span>
                    <span style={styles.statusReady}>
                      {rewardPlan.rewardId === 'restored' ? '已恢复状态' : '已锁定，等待任务发布'}
                    </span>
                  </div>
                  {rewardPlan.rewardId === 'restored' && (
                    <div style={styles.restoredWarning}>
                      <div style={styles.warningHeader}>
                        <span style={styles.warningIcon}>⚠️</span>
                        <strong>状态恢复警告</strong>
                      </div>
                      <div style={styles.warningContent}>
                        这是从之前会话恢复的状态。如果您没有实际存入跨链奖励，这可能是虚假状态。
                      </div>
                      <div style={styles.warningActions}>
                        <button
                          onClick={() => {
                            draftStore.reset();
                            setRewardPlan(prev => ({
                              ...prev,
                              status: 'none',
                              rewardId: undefined,
                              error: undefined
                            }));
                            console.log('✅ 已重置跨链奖励状态');
                            alert('状态已重置，请刷新页面查看效果');
                          }}
                          style={styles.resetButton}
                        >
                          🧹 清理虚假状态
                        </button>
                        <button
                          onClick={() => {
                            // 清理 localStorage 并刷新页面
                            localStorage.removeItem('everecho_crosschain_draft');
                            localStorage.removeItem('pendingRewardId');
                            window.location.reload();
                          }}
                          style={styles.forceResetButton}
                        >
                          🔄 强制刷新页面
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '12px',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  toggleIcon: {
    fontSize: '16px',
  },
  headerTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A1A1A',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  expandIcon: {
    fontSize: '12px',
    color: '#6B7280',
  },
  content: {
    padding: '0 16px 16px 16px',
    borderTop: '1px solid rgba(59, 130, 246, 0.1)',
  },
  description: {
    marginBottom: '16px',
  },
  descriptionText: {
    fontSize: '13px',
    color: '#4B5563',
    margin: '0 0 12px 0',
    lineHeight: '1.5',
  },
  warningBox: {
    display: 'flex',
    gap: '8px',
    padding: '12px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '6px',
  },
  warningIcon: {
    fontSize: '14px',
    flexShrink: 0,
  },
  warningText: {
    fontSize: '11px',
    color: '#92400E',
    lineHeight: '1.4',
  },
  walletSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  connectButton: {
    alignSelf: 'flex-start',
    padding: '8px 16px',
    fontSize: '13px',
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#1A1A1A',
  },
  select: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid rgba(26, 26, 26, 0.12)',
    borderRadius: '8px',
    backgroundColor: 'white',
    color: '#1A1A1A',
    cursor: 'pointer',
  },
  statusSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
    fontSize: '13px',
    color: '#6B7280',
  },
  spinner: {
    fontSize: '16px',
  },
  actionGroup: {
    display: 'flex',
    gap: '8px',
  },
  successState: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
  },
  successIcon: {
    fontSize: '16px',
  },
  successText: {
    fontSize: '13px',
    color: '#10B981',
    fontWeight: 500,
  },
  successDetails: {
    fontSize: '11px',
    color: '#6B7280',
    fontWeight: 400,
  },
  summary: {
    padding: '12px',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '6px',
    fontSize: '12px',
  },
  summaryTitle: {
    fontWeight: 600,
    color: '#1A1A1A',
    marginBottom: '8px',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    color: '#4B5563',
  },
  statusReady: {
    color: '#10B981',
    fontWeight: 500,
  },
  restoredWarning: {
    fontSize: '12px',
    color: '#DC2626',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '2px solid rgba(239, 68, 68, 0.3)',
    padding: '12px',
    borderRadius: '8px',
    marginTop: '8px',
    lineHeight: '1.4',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  warningHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#DC2626',
  },
  warningContent: {
    fontSize: '12px',
    color: '#7F1D1D',
    lineHeight: '1.5',
  },
  warningActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  resetButton: {
    padding: '6px 12px',
    fontSize: '11px',
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'background-color 0.2s',
  },
  forceResetButton: {
    padding: '6px 12px',
    fontSize: '11px',
    backgroundColor: '#F59E0B',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'background-color 0.2s',
  },
  balanceInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
    fontSize: '12px',
  },
  balanceLabel: {
    color: '#6B7280',
  },
  balanceValue: {
    color: '#1A1A1A',
    fontWeight: 500,
  },
  refreshButton: {
    background: 'none',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '2px',
    opacity: 0.7,
    transition: 'opacity 0.2s',
  },
  preparedHint: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#10B981',
    fontWeight: 500,
  },
  checkIcon: {
    fontSize: '14px',
  },
  crossChainNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '6px',
    fontSize: '11px',
    color: '#2563EB',
  },
  noteIcon: {
    fontSize: '12px',
  },

};