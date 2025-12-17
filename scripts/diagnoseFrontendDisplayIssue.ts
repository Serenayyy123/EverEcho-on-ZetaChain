/**
 * 诊断前端显示问题脚本
 * 检查可能导致前端显示异常的原因
 */

import { ethers } from 'ethers';

// 当前合约地址
const CURRENT_ADDRESSES = {
  ECHO_TOKEN: '0x650AAE045552567df9eb0633afd77D44308D3e6D',
  TASK_ESCROW: '0x162E96b13E122719E90Cf3544E6Eb29DFa834757',
  REGISTER: '0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA',
  UNIVERSAL_REWARD: '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3'
};

// 旧地址（可能导致问题）
const OLD_ADDRESSES = {
  ECHO_TOKEN: '0x876E3e3508c8ee669359A0e58A7bADD55530B8B3',
  TASK_ESCROW: '0xE442Eb737983986153E42C9ad28530676d8C1f55'
};

async function diagnoseFrontendDisplayIssue() {
  console.log('🔍 诊断前端显示问题...\n');

  // 1. 检查网络连接
  console.log('1. 📡 检查网络连接...');
  try {
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    const network = await provider.getNetwork();
    console.log(`   ✅ 网络连接正常: ${network.name} (Chain ID: ${network.chainId})`);
  } catch (error: any) {
    console.log(`   ❌ 网络连接失败: ${error.message}`);
    return;
  }

  // 2. 检查合约是否存在
  console.log('\n2. 🔍 检查合约是否存在...');
  const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
  
  for (const [name, address] of Object.entries(CURRENT_ADDRESSES)) {
    try {
      const code = await provider.getCode(address);
      if (code === '0x') {
        console.log(`   ❌ ${name}: ${address} - 合约不存在`);
      } else {
        console.log(`   ✅ ${name}: ${address} - 合约存在`);
      }
    } catch (error: any) {
      console.log(`   ❌ ${name}: ${address} - 检查失败: ${error.message}`);
    }
  }

  // 3. 检查ECHO Token基本信息
  console.log('\n3. 💰 检查ECHO Token基本信息...');
  try {
    const echoTokenABI = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function totalSupply() view returns (uint256)',
      'function owner() view returns (address)',
      'function taskEscrowAddress() view returns (address)'
    ];
    
    const echoToken = new ethers.Contract(CURRENT_ADDRESSES.ECHO_TOKEN, echoTokenABI, provider);
    
    const name = await echoToken.name();
    const symbol = await echoToken.symbol();
    const decimals = await echoToken.decimals();
    const totalSupply = await echoToken.totalSupply();
    const owner = await echoToken.owner();
    const taskEscrowAddress = await echoToken.taskEscrowAddress();
    
    console.log(`   📋 代币名称: ${name}`);
    console.log(`   📋 代币符号: ${symbol}`);
    console.log(`   📋 小数位数: ${decimals}`);
    console.log(`   📋 总供应量: ${ethers.formatEther(totalSupply)} ${symbol}`);
    console.log(`   📋 合约所有者: ${owner}`);
    console.log(`   📋 TaskEscrow地址: ${taskEscrowAddress}`);
    
    // 验证TaskEscrow地址是否正确
    if (taskEscrowAddress.toLowerCase() === CURRENT_ADDRESSES.TASK_ESCROW.toLowerCase()) {
      console.log(`   ✅ TaskEscrow地址配置正确`);
    } else {
      console.log(`   ❌ TaskEscrow地址配置错误`);
      console.log(`      期望: ${CURRENT_ADDRESSES.TASK_ESCROW}`);
      console.log(`      实际: ${taskEscrowAddress}`);
    }
    
  } catch (error: any) {
    console.log(`   ❌ 获取ECHO Token信息失败: ${error.message}`);
  }

  // 4. 检查可能的前端缓存问题
  console.log('\n4. 🧹 检查可能的前端缓存问题...');
  console.log('   可能的问题原因:');
  console.log('   - 浏览器缓存了旧的合约地址');
  console.log('   - localStorage中存储了过期的状态');
  console.log('   - 前端代码中硬编码了旧地址');
  console.log('   - MetaMask缓存了旧的合约信息');

  // 5. 检查环境变量配置
  console.log('\n5. ⚙️ 检查环境变量配置...');
  console.log('   前端应该使用以下地址:');
  console.log(`   - ECHO Token: ${CURRENT_ADDRESSES.ECHO_TOKEN}`);
  console.log(`   - TaskEscrow: ${CURRENT_ADDRESSES.TASK_ESCROW}`);
  console.log(`   - Register: ${CURRENT_ADDRESSES.REGISTER}`);
  console.log(`   - UniversalReward: ${CURRENT_ADDRESSES.UNIVERSAL_REWARD}`);

  // 6. 提供解决方案
  console.log('\n💡 可能的解决方案:');
  console.log('1. 清理浏览器缓存和localStorage');
  console.log('2. 硬刷新页面 (Ctrl+F5 或 Cmd+Shift+R)');
  console.log('3. 在MetaMask中重新添加ECHO Token');
  console.log('4. 检查前端是否连接到正确的网络 (ZetaChain Athens Testnet)');
  console.log('5. 运行前端状态清理脚本');

  // 7. 生成MetaMask添加Token的信息
  console.log('\n📱 MetaMask添加ECHO Token信息:');
  console.log(`   合约地址: ${CURRENT_ADDRESSES.ECHO_TOKEN}`);
  console.log(`   代币符号: ECHO`);
  console.log(`   小数位数: 18`);
  console.log(`   网络: ZetaChain Athens Testnet (Chain ID: 7001)`);
}

// 运行诊断
if (require.main === module) {
  diagnoseFrontendDisplayIssue().catch(console.error);
}

export { diagnoseFrontendDisplayIssue };