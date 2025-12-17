import { ethers } from 'ethers';

// 直接定义合约地址和ABI - 使用正确的ZetaChain地址
const UNIVERSAL_REWARD_ADDRESS = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
// 使用完整的ABI
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

async function diagnoseRewardIdIssue() {
  console.log('🔍 诊断 RewardID 问题...');
  
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
    
    // 5. 调用 preparePlan 并详细分析结果
    console.log('🔄 调用 preparePlan...');
    
    const prepareTx = await contract.preparePlan(contractAssetAddress, amountWei, targetChain);
    console.log('📍 交易哈希:', prepareTx.hash);
    
    const prepareReceipt = await prepareTx.wait();
    console.log('📍 交易状态:', prepareReceipt.status === 1 ? '成功' : '失败');
    console.log('📍 Gas 使用:', prepareReceipt.gasUsed.toString());
    console.log('📍 日志数量:', prepareReceipt.logs.length);
    
    // 6. 详细分析所有日志
    console.log('\n📋 分析所有交易日志:');
    prepareReceipt.logs.forEach((log: any, index: number) => {
      console.log(`\n--- 日志 ${index + 1} ---`);
      console.log('地址:', log.address);
      console.log('主题:', log.topics);
      console.log('数据:', log.data);
      
      // 手动计算事件签名
      const topic0 = log.topics[0];
      console.log('事件主题:', topic0);
      
      // 计算各种可能的事件签名
      const sig1 = ethers.id('RewardPlanCreated(uint256,address,address,uint256)');
      const sig2 = ethers.id('RewardPlanCreated(uint256,address,address,uint256,uint256)');
      const sig3 = ethers.id('RewardPlanCreated(uint256,address,address,uint256,uint256,address)');
      
      console.log('可能的签名:');
      console.log('  签名1 (4参数):', sig1);
      console.log('  签名2 (5参数):', sig2);  
      console.log('  签名3 (6参数):', sig3);
      console.log('  实际主题:', topic0);
      
      if (topic0 === sig1 || topic0 === sig2 || topic0 === sig3) {
        console.log('🎯 这是 RewardPlanCreated 事件');
        
        // 手动解析
        try {
          const rewardId = BigInt(log.topics[1]);
          const creator = '0x' + log.topics[2].slice(26);
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['address', 'uint256'], log.data);
          const asset = decoded[0];
          const amount = decoded[1];
          
          console.log('手动解析结果:', {
            rewardId: rewardId.toString(),
            creator,
            asset,
            amount: amount.toString()
          });
        } catch (manualError: any) {
          console.log('手动解析失败:', manualError.message);
        }
      } else {
        // 尝试反向计算事件签名
        console.log('🔍 尝试识别未知事件...');
        
        // 检查是否有其他可能的事件
        const possibleEvents = [
          'RewardPlanCreated(uint256,address,address,uint256,uint256)',
          'RewardPlanCreated(uint256,address,address,uint256,uint256,address)',
          'RewardPlanCreated(uint256,address,address,uint256,address)',
          'RewardCreated(uint256,address,address,uint256)',
          'PlanCreated(uint256,address,address,uint256)'
        ];
        
        for (const eventSig of possibleEvents) {
          const calcSig = ethers.id(eventSig);
          if (calcSig === topic0) {
            console.log('✅ 匹配事件:', eventSig);
            
            // 如果是5参数版本，尝试解析
            if (eventSig === 'RewardPlanCreated(uint256,address,address,uint256,uint256)') {
              try {
                const rewardId = BigInt(log.topics[1]);
                const creator = '0x' + log.topics[2].slice(26);
                const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['address', 'uint256', 'uint256'], log.data);
                const asset = decoded[0];
                const amount = decoded[1];
                const targetChainId = decoded[2];
                
                console.log('5参数解析结果:', {
                  rewardId: rewardId.toString(),
                  creator,
                  asset,
                  amount: amount.toString(),
                  targetChainId: targetChainId.toString()
                });
              } catch (parseError: any) {
                console.log('5参数解析失败:', parseError.message);
              }
            }
            break;
          }
        }
      }
      
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed) {
          console.log('✅ 解析成功:', parsed.name);
          console.log('参数:', parsed.args);
          
          if (parsed.name === 'RewardPlanCreated') {
            console.log('🎯 找到 RewardPlanCreated 事件!');
            console.log('RewardId:', parsed.args.rewardId?.toString());
            console.log('Creator:', parsed.args.creator);
            console.log('Asset:', parsed.args.asset);
            console.log('Amount:', parsed.args.amount?.toString());
          }
        }
      } catch (parseError: any) {
        console.log('❌ 解析失败:', parseError.message);
        
        // 手动计算事件签名
        const topic0 = log.topics[0];
        console.log('事件主题:', topic0);
        
        // 计算 RewardPlanCreated 事件签名
        const rewardPlanCreatedSig = ethers.id('RewardPlanCreated(uint256,address,address,uint256)');
        console.log('RewardPlanCreated 签名:', rewardPlanCreatedSig);
        
        if (topic0 === rewardPlanCreatedSig) {
          console.log('🎯 这是 RewardPlanCreated 事件，但解析失败');
          
          // 手动解析
          try {
            const rewardId = BigInt(log.topics[1]);
            const creator = '0x' + log.topics[2].slice(26);
            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['address', 'uint256'], log.data);
            const asset = decoded[0];
            const amount = decoded[1];
            
            console.log('手动解析结果:', {
              rewardId: rewardId.toString(),
              creator,
              asset,
              amount: amount.toString()
            });
          } catch (manualError: any) {
            console.log('手动解析也失败:', manualError.message);
          }
        }
      }
    });
    
    // 7. 使用前端相同的逻辑测试
    console.log('\n🔄 使用前端相同逻辑测试...');
    const createEvent = prepareReceipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'RewardPlanCreated';
      } catch {
        return false;
      }
    });
    
    if (!createEvent) {
      console.log('❌ 前端逻辑：找不到 RewardPlanCreated 事件');
      
      // 尝试其他方法
      console.log('\n🔄 尝试其他事件查找方法...');
      
      // 方法1：直接通过合约查询事件
      const eventFilter = contract.filters.RewardPlanCreated();
      const events = await contract.queryFilter(eventFilter, prepareReceipt.blockNumber, prepareReceipt.blockNumber);
      console.log('方法1 - 查询过滤器结果:', events.length, '个事件');
      
      if (events.length > 0) {
        events.forEach((event: any, index: number) => {
          console.log(`事件 ${index + 1}:`, {
            rewardId: event.args?.rewardId?.toString(),
            creator: event.args?.creator,
            asset: event.args?.asset,
            amount: event.args?.amount?.toString()
          });
        });
      }
      
    } else {
      console.log('✅ 前端逻辑：找到 RewardPlanCreated 事件');
      const parsedCreateEvent = contract.interface.parseLog(createEvent);
      const rewardId = parsedCreateEvent?.args?.rewardId?.toString();
      console.log('RewardId:', rewardId);
    }
    
  } catch (error: any) {
    console.error('❌ 诊断过程中出错:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行诊断
diagnoseRewardIdIssue().catch(console.error);