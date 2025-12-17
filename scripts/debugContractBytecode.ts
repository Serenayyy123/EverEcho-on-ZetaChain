import { ethers } from 'ethers';

async function debugContractBytecode() {
  console.log('🔍 Debugging contract bytecode and deployment...\n');

  const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
  const contractAddress = '0x08D7B41A517Fb9E2C7810737f2c18F73F4C79BD0';
  
  try {
    // 1. 获取合约字节码
    console.log('📄 Getting contract bytecode...');
    const code = await provider.getCode(contractAddress);
    console.log(`   Bytecode length: ${code.length} characters`);
    console.log(`   First 100 chars: ${code.substring(0, 100)}`);
    console.log(`   Last 100 chars: ${code.substring(code.length - 100)}`);
    
    // 2. 检查合约是否为代理合约
    console.log('\n🔍 Checking if this is a proxy contract...');
    
    // 检查常见的代理模式存储槽
    const proxySlots = [
      '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc', // EIP-1967 implementation slot
      '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50', // EIP-1967 beacon slot
      '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103'  // EIP-1967 admin slot
    ];
    
    for (const slot of proxySlots) {
      try {
        const value = await provider.getStorage(contractAddress, slot);
        if (value !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          console.log(`   Proxy slot ${slot}: ${value}`);
          
          // 如果是实现槽，尝试解析地址
          if (slot === proxySlots[0] && value.length >= 42) {
            const implAddress = '0x' + value.slice(-40);
            console.log(`   Implementation address: ${implAddress}`);
          }
        }
      } catch (error) {
        // 忽略存储读取错误
      }
    }
    
    // 3. 尝试直接调用字节码
    console.log('\n🧪 Testing direct bytecode calls...');
    
    // 尝试调用 nextRewardId() - 函数选择器: 0xf064997c
    try {
      const result = await provider.call({
        to: contractAddress,
        data: '0xf064997c'
      });
      console.log(`   nextRewardId() result: ${result}`);
      
      if (result && result !== '0x') {
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], result);
        console.log(`   Decoded value: ${decoded[0].toString()}`);
      }
    } catch (error: any) {
      console.log(`   nextRewardId() error: ${error.message}`);
    }
    
    // 4. 检查合约创建交易
    console.log('\n📋 Checking contract creation...');
    
    // 尝试获取合约创建的区块信息
    try {
      // 这需要遍历区块，比较复杂，先跳过
      console.log('   Contract creation analysis requires block scanning...');
    } catch (error) {
      console.log(`   Error: ${error}`);
    }
    
    // 5. 比较 ABI 和实际合约
    console.log('\n🔧 Comparing ABI with actual contract...');
    
    try {
      const EverEchoUniversalRewardABI = await import('../frontend/src/contracts/EverEchoUniversalReward.json');
      const contractInterface = new ethers.Interface(EverEchoUniversalRewardABI.abi);
      
      console.log('   Expected functions from ABI:');
      contractInterface.forEachFunction((func) => {
        console.log(`     - ${func.name}: ${func.selector}`);
      });
      
      // 测试每个函数选择器
      console.log('\n   Testing function selectors...');
      
      const testFunctions = [
        { name: 'nextRewardId', selector: '0xf064997c', params: [] },
        { name: 'preparePlan', selector: '0xd29c3f74', params: ['address', 'uint256', 'uint256'] }
      ];
      
      for (const func of testFunctions) {
        try {
          // 对于无参数函数，直接调用
          if (func.params.length === 0) {
            const result = await provider.call({
              to: contractAddress,
              data: func.selector
            });
            console.log(`     ✅ ${func.name}: ${result}`);
          } else {
            console.log(`     ⏭️  ${func.name}: Requires parameters, skipping`);
          }
        } catch (error: any) {
          console.log(`     ❌ ${func.name}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.log(`   ABI loading error: ${error}`);
    }
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugContractBytecode().catch(console.error);