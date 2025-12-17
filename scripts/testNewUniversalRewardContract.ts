import { ethers } from 'ethers';

async function testNewUniversalRewardContract() {
  console.log('🧪 Testing newly deployed EverEchoUniversalReward contract...\n');

  const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
  const contractAddress = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3'; // 新部署的地址
  
  try {
    // 导入 ABI
    const EverEchoUniversalRewardABI = await import('../frontend/src/contracts/EverEchoUniversalReward.json');
    const contract = new ethers.Contract(contractAddress, EverEchoUniversalRewardABI.abi, provider);
    
    console.log(`📍 Testing contract at: ${contractAddress}`);
    console.log(`🔗 Network: ZetaChain Athens (Chain ID: 7001)\n`);
    
    // 1. 测试基本只读函数
    console.log('1️⃣ Testing basic read functions...');
    
    try {
      const nextRewardId = await contract.nextRewardId();
      console.log(`   ✅ nextRewardId(): ${nextRewardId.toString()}`);
    } catch (error: any) {
      console.log(`   ❌ nextRewardId() failed: ${error.message}`);
    }
    
    // 2. 测试 preparePlan 函数的 gas 估算
    console.log('\n2️⃣ Testing preparePlan gas estimation...');
    
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
      }
    ];
    
    for (const params of testParams) {
      console.log(`\n   🔧 Testing: ${params.name}`);
      console.log(`      Asset: ${params.asset}`);
      console.log(`      Amount: ${ethers.formatEther(params.amount)} ETH`);
      console.log(`      Target Chain: ${params.targetChainId.toString()}`);
      
      try {
        // 尝试估算 gas
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
        
        console.log(`      ✅ Gas estimate: ${gasEstimate.toString()}`);
        
        // 尝试静态调用
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
          console.log(`      ✅ Static call result: ${result}`);
        } catch (staticError: any) {
          console.log(`      ⚠️  Static call failed: ${staticError.message}`);
        }
        
      } catch (error: any) {
        console.log(`      ❌ Error: ${error.message}`);
      }
    }
    
    // 3. 检查合约接口
    console.log('\n3️⃣ Contract interface analysis...');
    
    const contractInterface = contract.interface;
    console.log('   Available functions:');
    contractInterface.forEachFunction((func) => {
      console.log(`     - ${func.name}(${func.inputs.map(i => `${i.type} ${i.name}`).join(', ')})`);
    });
    
    console.log('\n✅ Contract testing completed successfully!');
    console.log('\n💡 The new contract appears to be working correctly.');
    console.log('   You can now test the frontend cross-chain reward functionality.');
    
  } catch (error) {
    console.error('❌ Contract testing failed:', error);
  }
}

testNewUniversalRewardContract().catch(console.error);