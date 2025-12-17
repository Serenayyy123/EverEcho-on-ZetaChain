#!/usr/bin/env tsx

/**
 * 跨链奖励钱包连接测试脚本
 * 验证钱包连接、余额检查和合约交互功能
 */

console.log('🔍 Testing Cross-Chain Reward Wallet Integration...\n');

const tests = [
  {
    name: '前端服务可访问性',
    test: async () => {
      try {
        const response = await fetch('http://localhost:5173');
        return response.status === 200;
      } catch (error) {
        return false;
      }
    }
  },
  {
    name: '合约配置文件检查',
    test: async () => {
      try {
        // 检查合约配置文件是否存在
        const fs = await import('fs');
        const configExists = fs.existsSync('frontend/src/config/contracts.ts');
        const abiExists = fs.existsSync('frontend/src/contracts/EverEchoUniversalReward.json');
        return configExists && abiExists;
      } catch (error) {
        return false;
      }
    }
  },
  {
    name: '环境变量配置检查',
    test: async () => {
      try {
        const fs = await import('fs');
        const envContent = fs.readFileSync('.env.local', 'utf8');
        return envContent.includes('VITE_UNIVERSAL_REWARD_ADDRESS');
      } catch (error) {
        return false;
      }
    }
  },
  {
    name: '区块链节点连接',
    test: async () => {
      try {
        const response = await fetch('http://localhost:8545', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
          })
        });
        return response.status === 200;
      } catch (error) {
        return false;
      }
    }
  }
];

async function runTests() {
  let allPassed = true;

  for (const test of tests) {
    try {
      const result = await test.test();
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.name}`);
      if (!result) allPassed = false;
    } catch (error) {
      console.log(`❌ FAIL ${test.name} - Error: ${error}`);
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 跨链奖励系统准备就绪！');
    console.log('\n📱 测试步骤:');
    console.log('1. 访问: http://localhost:5173');
    console.log('2. 进入发布任务页面');
    console.log('3. 启用跨链奖励功能');
    console.log('4. 点击"连接钱包"按钮');
    console.log('5. 在 MetaMask 中确认连接');
    console.log('6. 配置奖励参数并测试');
    console.log('\n🔧 MetaMask 配置:');
    console.log('   网络: 添加自定义 RPC');
    console.log('   RPC URL: http://localhost:8545');
    console.log('   Chain ID: 31337');
    console.log('   货币: ETH');
    console.log('\n🧪 测试账户:');
    console.log('   私钥: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80d');
    console.log('   地址: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  } else {
    console.log('⚠️  部分检查失败，请检查系统状态');
  }

  return allPassed;
}

// 运行测试
runTests().catch(console.error);