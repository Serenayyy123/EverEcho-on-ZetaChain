import { ethers } from 'ethers';

async function testPreparePlanCall() {
  console.log('🧪 Testing preparePlan contract call...\n');

  try {
    // 连接到 ZetaChain Athens
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    
    // 合约地址和 ABI
    const contractAddress = '0x08D7B41A517Fb9E2C7810737f2c18F73F4C79BD0';
    const EverEchoUniversalRewardABI = await import('../frontend/src/contracts/EverEchoUniversalReward.json');
    
    // 创建合约实例（只读）
    const contract = new ethers.Contract(contractAddress, EverEchoUniversalRewardABI.abi, provider);
    
    console.log(`📍 Contract address: ${contractAddress}`);
    console.log(`🔗 Network: ZetaChain Athens (Chain ID: 7001)\n`);
    
    // 测试参数
    const testParams = [
      {
        name: 'ETH Sepolia (Native)',
        asset: '0x0000000000000000000000000000000000000000',
        amount: ethers.parseEther('0.01'),
        targetChainId: BigInt(11155111),
        isNative: true
      },
      {
        name: 'ZetaChain ZETA (Native)', 
        asset: '0x0000000000000000000000000000000000000000',
        amount: ethers.parseEther('0.01'),
        targetChainId: BigInt(7001),
        isNative: true
      },
      {
        name: 'ETH Sepolia USDC (ERC20)',
        asset: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        amount: ethers.parseUnits('10', 6), // 10 USDC (6 decimals)
        targetChainId: BigInt(11155111),
        isNative: false
      }
    ];
    
    for (const params of testParams) {
      console.log(`🔧 Testing: ${params.name}`);
      console.log(`   Asset: ${params.asset}`);
      console.log(`   Amount: ${params.amount.toString()}`);
      console.log(`   Target Chain: ${params.targetChainId.toString()}`);
      console.log(`   Is Native: ${params.isNative}`);
      
      try {
        // 尝试估算 gas（这不会实际执行交易）
        let gasEstimate;
        if (params.isNative) {
          gasEstimate = await contract.preparePlan.estimateGas(
            params.asset,
            params.amount,
            params.targetChainId,
            { value: params.amount }
          );
        } else {
          gasEstimate = await contract.preparePlan.estimateGas(
            params.asset,
            params.amount,
            params.targetChainId
          );
        }
        
        console.log(`   ✅ Gas estimate: ${gasEstimate.toString()}`);
        
        // 尝试静态调用（模拟执行）
        try {
          let result;
          if (params.isNative) {
            result = await contract.preparePlan.staticCall(
              params.asset,
              params.amount,
              params.targetChainId,
              { value: params.amount }
            );
          } else {
            result = await contract.preparePlan.staticCall(
              params.asset,
              params.amount,
              params.targetChainId
            );
          }
          console.log(`   ✅ Static call result: ${result}`);
        } catch (staticError: any) {
          console.log(`   ⚠️  Static call failed: ${staticError.message}`);
        }
        
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
        
        // 分析错误类型
        if (error.message.includes('missing revert data')) {
          console.log(`   🔍 This is the same error we're seeing in the UI`);
        }
        if (error.message.includes('insufficient funds')) {
          console.log(`   💰 Insufficient funds for gas or value`);
        }
        if (error.message.includes('execution reverted')) {
          console.log(`   🚫 Contract execution reverted`);
        }
      }
      
      console.log('');
    }
    
    // 检查合约状态
    console.log('📊 Contract State:');
    try {
      const nextRewardId = await contract.nextRewardId();
      console.log(`   Next Reward ID: ${nextRewardId.toString()}`);
    } catch (error) {
      console.log(`   Error reading nextRewardId: ${error}`);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPreparePlanCall().catch(console.error);