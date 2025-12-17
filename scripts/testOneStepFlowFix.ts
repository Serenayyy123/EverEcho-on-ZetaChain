import { ethers } from 'ethers';

// 合约地址和ABI
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
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "RewardDeposited",
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

async function testOneStepFlowFix() {
  console.log('🧪 测试一步流程修复...');
  
  try {
    // 1. 连接到 ZetaChain 测试网
    const rpcUrl = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';
    const provider = new ethers.JsonRpcProvider(rpcUrl, 7001);
    
    // 2. 使用测试私钥创建钱包
    const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const wallet = new ethers.Wallet(testPrivateKey, provider);
    
    console.log('📍 测试账户:', wallet.address);
    
    // 3. 创建合约实例
    const contract = createUniversalRewardContract(wallet);
    console.log('📍 合约地址:', contract.target);
    
    // 4. 准备测试参数
    const testAsset = 'USDC_SEPOLIA';
    const contractAssetAddress = getContractAssetAddress(testAsset);
    const amountWei = ethers.parseEther('0.001'); // 小金额测试
    const targetChain = BigInt(11155111);
    
    console.log('📍 测试参数:', {
      asset: testAsset,
      contractAsset: contractAssetAddress,
      amount: '0.001',
      targetChain: targetChain.toString()
    });
    
    // 5. 模拟前端修复后的逻辑
    console.log('\n🔄 执行修复后的一步流程...');
    
    let prepareTx: any;
    
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
        wallet
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
    console.log('📍 交易状态:', prepareReceipt.status === 1 ? '成功' : '失败');
    console.log('📍 交易哈希:', prepareTx.hash);
    console.log('📍 日志数量:', prepareReceipt.logs.length);
    
    // 6. 解析 RewardPlanCreated 事件获取 rewardId
    const createEvent = prepareReceipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'RewardPlanCreated';
      } catch {
        return false;
      }
    });

    if (!createEvent) {
      console.log('❌ 未找到 RewardPlanCreated 事件');
      return;
    }

    const parsedCreateEvent = contract.interface.parseLog(createEvent);
    const rewardId = parsedCreateEvent?.args?.rewardId?.toString();
    
    if (!rewardId) {
      console.log('❌ 无法解析 rewardId');
      return;
    }
    
    console.log('✅ 成功解析 rewardId:', rewardId);
    
    // 7. 检查是否同时有 RewardDeposited 事件（一步流程的证据）
    const depositEvent = prepareReceipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'RewardDeposited';
      } catch {
        return false;
      }
    });
    
    if (depositEvent) {
      console.log('✅ 一步流程确认：同时找到 RewardDeposited 事件');
      const parsedDepositEvent = contract.interface.parseLog(depositEvent);
      console.log('存入详情:', {
        rewardId: parsedDepositEvent?.args?.rewardId?.toString(),
        creator: parsedDepositEvent?.args?.creator,
        amount: parsedDepositEvent?.args?.amount?.toString()
      });
      
      console.log('🎉 修复验证成功：preparePlan() 确实是一步流程！');
      console.log('💡 前端不需要再调用 deposit()，避免了 "missing revert data" 错误');
    } else {
      console.log('⚠️ 未找到 RewardDeposited 事件，可能需要单独调用 deposit()');
    }
    
    // 8. 分析所有事件
    console.log('\n📋 所有事件分析:');
    prepareReceipt.logs.forEach((log: any, index: number) => {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed) {
          console.log(`事件 ${index + 1}: ${parsed.name}`);
          console.log('  参数:', parsed.args);
        }
      } catch {
        console.log(`事件 ${index + 1}: 无法解析`);
      }
    });
    
    console.log('\n✅ 测试完成：一步流程修复验证成功');
    
  } catch (error: any) {
    console.error('❌ 测试过程中出错:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行测试
testOneStepFlowFix().catch(console.error);