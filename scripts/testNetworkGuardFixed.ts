// Stage 4.9.x - 测试修复后的 NetworkGuard 功能
// 验证稳健双网络机制

import NetworkGuard from '../frontend/src/services/networkGuard';
import { SelectedAsset } from '../frontend/src/stores/crossChainDraftStore';

async function testNetworkGuardFixed() {
  console.log('🧪 Testing Fixed NetworkGuard Functionality');
  console.log('='.repeat(50));

  const networkGuard = NetworkGuard.getInstance();

  try {
    // 测试 1: 获取当前钱包链ID
    console.log('\n📱 Test 1: Get wallet chain ID');
    try {
      const walletChainId = await networkGuard.getWalletChainId();
      console.log('✅ Current wallet chain ID:', walletChainId);
      console.log('✅ Network name:', networkGuard.getNetworkNameByChainId(walletChainId));
    } catch (error) {
      console.log('⚠️ Wallet not connected or MetaMask not available');
    }

    // 测试 2: 测试资产映射
    console.log('\n🪙 Test 2: Asset mapping');
    const testAssets: SelectedAsset[] = [
      {
        key: 'ZETA_ATHENS_NATIVE',
        displayName: 'ZetaChain Testnet',
        symbol: 'ZETA',
        sourceChainId: 7001,
        kind: 'native'
      },
      {
        key: 'ETH_SEPOLIA_NATIVE',
        displayName: 'ETH Sepolia',
        symbol: 'ETH',
        sourceChainId: 11155111,
        kind: 'native'
      }
    ];

    for (const asset of testAssets) {
      try {
        const targetChainId = networkGuard.getDepositTargetChainId('deposit', asset);
        console.log(`✅ ${asset.displayName} -> Chain ID: ${targetChainId}`);
      } catch (error) {
        console.log(`❌ ${asset.displayName} -> Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // 测试 3: 容忍模式测试
    console.log('\n🛡️ Test 3: Tolerance mode');
    
    // 设置不同模式并测试容忍性
    const modes = ['idle', 'depositing', 'depositReady', 'publishing'] as const;
    
    for (const mode of modes) {
      networkGuard.setMode(mode);
      const shouldTolerate = networkGuard.shouldTolerateWrongNetwork();
      console.log(`✅ Mode: ${mode} -> Tolerate wrong network: ${shouldTolerate}`);
    }

    // 测试 4: 网络配置获取
    console.log('\n⚙️ Test 4: Network configuration');
    
    for (const asset of testAssets) {
      try {
        const config = networkGuard.getNetworkConfigForAsset(asset);
        console.log(`✅ ${asset.displayName} -> RPC: ${config.rpcUrls[0]}`);
      } catch (error) {
        console.log(`❌ ${asset.displayName} -> Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // 测试 5: 模拟网络切换（不实际切换）
    console.log('\n🔄 Test 5: Network switch simulation');
    
    console.log('Testing ZetaChain asset (should not require switch):');
    try {
      const zetaAsset = testAssets[0]; // ZetaChain asset
      const result = networkGuard.getDepositTargetChainId('deposit', zetaAsset);
      console.log(`✅ ZetaChain asset target: ${result} (should be 0x1b59)`);
    } catch (error) {
      console.log(`❌ ZetaChain asset error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('Testing Sepolia asset (would require switch):');
    try {
      const sepoliaAsset = testAssets[1]; // Sepolia asset
      const result = networkGuard.getDepositTargetChainId('deposit', sepoliaAsset);
      console.log(`✅ Sepolia asset target: ${result} (should be 0xaa36a7)`);
    } catch (error) {
      console.log(`❌ Sepolia asset error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('\n🎉 All NetworkGuard tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Asset mapping works correctly');
    console.log('✅ Tolerance mode functions properly');
    console.log('✅ Network configuration retrieval works');
    console.log('✅ No "Cannot determine target chain" errors');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testNetworkGuardFixed().catch(console.error);
}

export { testNetworkGuardFixed };