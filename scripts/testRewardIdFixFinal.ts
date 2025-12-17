import { ethers } from 'ethers';

// 使用更新后的ABI
const UNIVERSAL_REWARD_ADDRESS = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
const UNIVERSAL_REWARD_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "rewardId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "asset",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "targetChainId",
        "type": "uint256"
      }
    ],
    "name": "RewardPlanCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "asset",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "targetChainId",
        "type": "uint256"
      }
    ],
    "name": "preparePlan",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "rewardId",
        "type": "uint256"
      }
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

// ZRC20 地址映射
const ZRC20_ADDRESSES: Record<string, string> = {
  'ETH_SEPOLIA': '0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf',
  'USDC_SEPOLIA': '0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb',
  'ZETA_NATIVE': '0x0000000000000000000000000000000000000000'
};

function createUniversalRewardContract(signer: ethers.Signer) {
  return new ethers.Contract(UNIVERSAL_REWARD_ADDRESS, UNIVERSAL_REWARD_ABI, signer);
}

function getContractAssetAddress(asset: string): string {
  return ZRC20_ADDRESSES[asset] || '0x0000000000000000000000000000000000000000';
}

async function testRewardIdFixFinal() {
  console.log('🔧 测试 RewardID 修复（最终版本）...');
  
  try {
    // 1. 连接到 ZetaChain 测试网
    const rpcUrl = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';
    const provider = new ethers.JsonRpcProvider(rpcUrl, 7001);
    
    // 2. 使用测试私钥创建钱包
    const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const wallet = new ethers.Wallet(testPrivateKey, provider);
    
    console.log('📍 测试账户:', wallet.address);
    
    // 3. 创建合约实例（使用更新后的ABI）
    const contract = createUniversalRewardContract(wallet);
    console.log('📍 合约地址:', contract.target);
    
    // 4. 准备测试参数
    const testAsset = 'USDC_SEPOLIA';
    const contractAssetAddress = getContractAssetAddress(testAsset);
    const amountWei = ethers.parseEther('0.001');
    const targetChain = BigInt(11155111);
    
    console.log('📍 测试参数:', {
      asset: testAsset,
      contractAsset: contractAssetAddress,
      amount: '0.001',
      targetChain: targetChain.toString()
    });
    
    // 5. 测试前端相同的两步流程
    console.log('\n🔄 步骤1：创建奖励计划...');
    
    const prepareTx = await contract.preparePlan(contractAssetAddress, amountWei, targetChain);
    console.log('📍 交易哈希:', prepareTx.hash);
    
    const prepareReceipt = await prepareTx.wait();
    console.log('📍 交易状态:', prepareReceipt.status === 1 ? '成功' : '失败');
    console.log('📍 日志数量:', prepareReceipt.logs.length);
    
    // 6. 使用前端相同的事件解析逻辑
    console.log('\n🔍 解析 RewardPlanCreated 事件...');
    
    const createEvent = prepareReceipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'RewardPlanCreated';
      } catch {
        return false;
      }
    });

    if (!createEvent) {
      console.log('❌ 找不到 RewardPlanCreated 事件');
      return;
    }

    const parsedCreateEvent = contract.interface.parseLog(createEvent);
    const rewardId = parsedCreateEvent?.args?.rewardId?.toString();
    
    if (!rewardId) {
      console.log('❌ 无法解析 rewardId');
      return;
    }
    
    console.log('✅ 步骤1完成：奖励计划创建成功');
    console.log('📍 RewardId:', rewardId);
    console.log('📍 Creator:', parsedCreateEvent?.args?.creator);
    console.log('📍 Asset:', parsedCreateEvent?.args?.asset);
    console.log('📍 Amount:', parsedCreateEvent?.args?.amount?.toString());
    console.log('📍 TargetChainId:', parsedCreateEvent?.args?.targetChainId?.toString());
    
    // 7. 步骤2：存入资金
    console.log('\n🔄 步骤2：存入资金...');
    
    if (contractAssetAddress === '0x0000000000000000000000000000000000000000') {
      // 原生 ZETA 代币
      console.log('🔄 存入原生 ZETA...');
      const depositTx = await contract.deposit(rewardId, { value: amountWei });
      await depositTx.wait();
    } else {
      // ZRC20 代币
      console.log('🔄 存入 ZRC20 代币:', contractAssetAddress);
      
      // 首先 approve ZRC20 代币
      const zrc20Contract = new ethers.Contract(
        contractAssetAddress,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        wallet
      );
      
      console.log('🔄 批准 ZRC20 代币...');
      const approveTx = await zrc20Contract.approve(contract.target, amountWei);
      await approveTx.wait();
      console.log('✅ ZRC20 批准成功');
      
      // 然后调用 deposit
      const depositTx = await contract.deposit(rewardId);
      await depositTx.wait();
    }
    
    console.log('✅ 步骤2完成：资金存入成功');
    
    console.log('\n🎉 RewardID 修复测试成功！');
    console.log('📍 最终 RewardId:', rewardId);
    
  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行测试
testRewardIdFixFinal().catch(console.error);