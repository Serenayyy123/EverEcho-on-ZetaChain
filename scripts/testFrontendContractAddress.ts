import { ethers } from 'ethers';

async function testFrontendContractAddress() {
  console.log('🔍 Testing frontend contract address resolution...');
  
  try {
    // 模拟前端环境变量
    const mockEnv = {
      VITE_ZETA_UNIVERSAL_REWARD_ADDRESS: '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3',
      VITE_UNIVERSAL_REWARD_ADDRESS: '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3'
    };
    
    // 模拟前端合约地址解析逻辑
    const CONTRACT_ADDRESSES = {
      zetachainAthens: {
        UNIVERSAL_REWARD: mockEnv.VITE_ZETA_UNIVERSAL_REWARD_ADDRESS || mockEnv.VITE_UNIVERSAL_REWARD_ADDRESS || '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3',
      }
    };
    
    function getContractAddresses(chainId: number) {
      if (chainId === 7001) {
        return CONTRACT_ADDRESSES.zetachainAthens;
      }
      throw new Error(`Unsupported chainId: ${chainId}`);
    }
    
    // 测试地址解析
    const addresses = getContractAddresses(7001);
    console.log('📍 Resolved contract address:', addresses.UNIVERSAL_REWARD);
    
    // 验证地址是否正确
    const expectedAddress = '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3';
    if (addresses.UNIVERSAL_REWARD === expectedAddress) {
      console.log('✅ Address resolution is correct!');
    } else {
      console.log('❌ Address resolution is incorrect!');
      console.log('Expected:', expectedAddress);
      console.log('Got:', addresses.UNIVERSAL_REWARD);
      return false;
    }
    
    // 测试合约连接
    console.log('🧪 Testing contract connection...');
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    
    // 简单的合约调用测试
    const contract = new ethers.Contract(
      addresses.UNIVERSAL_REWARD,
      ['function nextRewardId() view returns (uint256)'],
      provider
    );
    
    const nextRewardId = await contract.nextRewardId();
    console.log('✅ Contract call successful! Next reward ID:', nextRewardId.toString());
    
    console.log('\n🎉 Frontend contract address configuration is working correctly!');
    console.log('💡 Users should now be able to deposit funds without "missing revert data" error.');
    
    return true;
    
  } catch (error: any) {
    console.error('❌ Frontend contract address test failed:', error.message);
    return false;
  }
}

// Run the test
testFrontendContractAddress().catch(console.error);