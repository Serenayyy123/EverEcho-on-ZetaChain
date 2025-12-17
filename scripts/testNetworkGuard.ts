// Stage 4.9 - NetworkGuard 测试脚本
// 验证 NetworkGuard 的基本功能

import { ethers } from 'ethers';

// 模拟 window.ethereum 对象
const mockEthereum = {
  request: async (params: any) => {
    console.log('Mock ethereum.request called with:', params);
    
    if (params.method === 'eth_chainId') {
      return '0x1b59'; // ZetaChain Athens
    }
    
    if (params.method === 'wallet_switchEthereumChain') {
      console.log('Mock network switch to:', params.params[0].chainId);
      return Promise.resolve();
    }
    
    if (params.method === 'wallet_addEthereumChain') {
      console.log('Mock network add:', params.params[0]);
      return Promise.resolve();
    }
    
    return Promise.resolve();
  },
  on: (event: string, handler: Function) => {
    console.log('Mock ethereum.on:', event);
  },
  removeListener: (event: string, handler: Function) => {
    console.log('Mock ethereum.removeListener:', event);
  }
};

// 设置全局 window.ethereum
(global as any).window = {
  ethereum: mockEthereum
};

async function testNetworkGuard() {
  console.log('🧪 Testing NetworkGuard functionality...');
  
  try {
    // 动态导入 NetworkGuard（避免 ES 模块问题）
    const { default: NetworkGuard } = await import('../frontend/src/services/networkGuard');
    
    const networkGuard = NetworkGuard.getInstance();
    
    // 测试 1: 确保发布网络
    console.log('\n📝 Test 1: Ensure publish network');
    const publishResult = await networkGuard.ensureNetworkFor('publish');
    console.log('Publish network result:', publishResult);
    
    // 测试 2: 确保存入网络
    console.log('\n💰 Test 2: Ensure deposit network');
    const depositResult = await networkGuard.ensureNetworkFor('deposit', 'ETH Sepolia');
    console.log('Deposit network result:', depositResult);
    
    // 测试 3: 获取网络配置
    console.log('\n⚙️ Test 3: Get network config');
    const config = networkGuard.getNetworkConfigForAsset('ETH Sepolia');
    console.log('ETH Sepolia config:', config);
    
    // 测试 4: 获取网络名称
    console.log('\n🏷️ Test 4: Get network name');
    const networkName = networkGuard.getNetworkNameByChainId('0x1b59');
    console.log('Network name for 0x1b59:', networkName);
    
    console.log('\n✅ All NetworkGuard tests completed successfully!');
    
  } catch (error) {
    console.error('❌ NetworkGuard test failed:', error);
  }
}

// 运行测试
testNetworkGuard().catch(console.error);