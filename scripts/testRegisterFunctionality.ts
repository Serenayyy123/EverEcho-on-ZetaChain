/**
 * 测试Register合约功能是否正常工作
 */

import { ethers } from 'ethers';

const REGISTER_ADDRESS = '0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA';
const CURRENT_ECHO_TOKEN = '0x650AAE045552567df9eb0633afd77D44308D3e6D';

// 合约ABI
const REGISTER_ABI = [
  'function echoToken() view returns (address)',
  'function isRegistered(address user) view returns (bool)',
  'function profileURI(address user) view returns (string)',
  'function register(string calldata _profileURI) external'
];

const ECHO_TOKEN_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)'
];

async function testRegisterFunctionality() {
  console.log('🧪 测试Register合约功能...\n');

  try {
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);

    console.log(`📋 Register合约地址: ${REGISTER_ADDRESS}`);
    console.log(`📋 当前ECHO Token地址: ${CURRENT_ECHO_TOKEN}\n`);

    // 1. 检查Register合约基本功能
    console.log('1. 📡 检查Register合约基本功能...');
    const registerContract = new ethers.Contract(REGISTER_ADDRESS, REGISTER_ABI, provider);
    
    const registerEchoToken = await registerContract.echoToken();
    console.log(`   Register.echoToken(): ${registerEchoToken}`);

    // 2. 检查一些已知用户的注册状态
    console.log('\n2. 👤 检查用户注册状态...');
    const testAddresses = [
      '0x099Fb550F7Dc5842621344c5a1678F943eEF3488', // 部署者地址
      '0x1234567890123456789012345678901234567890'  // 测试地址
    ];

    for (const address of testAddresses) {
      try {
        const isRegistered = await registerContract.isRegistered(address);
        const profileURI = isRegistered ? await registerContract.profileURI(address) : '';
        console.log(`   ${address}: ${isRegistered ? '已注册' : '未注册'} ${profileURI ? `(${profileURI})` : ''}`);
      } catch (error) {
        console.log(`   ${address}: 检查失败`);
      }
    }

    // 3. 检查两个ECHO Token的余额情况
    console.log('\n3. 💰 检查ECHO Token余额...');
    
    // 检查当前ECHO Token
    console.log('\n   📊 当前系统ECHO Token:');
    const currentEchoContract = new ethers.Contract(CURRENT_ECHO_TOKEN, ECHO_TOKEN_ABI, provider);
    const currentSupply = await currentEchoContract.totalSupply();
    console.log(`   地址: ${CURRENT_ECHO_TOKEN}`);
    console.log(`   总供应量: ${ethers.formatEther(currentSupply)} ECHO`);
    
    for (const address of testAddresses) {
      try {
        const balance = await currentEchoContract.balanceOf(address);
        if (balance > 0) {
          console.log(`   ${address}: ${ethers.formatEther(balance)} ECHO`);
        }
      } catch (error) {
        // 忽略错误
      }
    }

    // 检查Register指向的ECHO Token
    console.log('\n   📊 Register指向的ECHO Token:');
    const registerEchoContract = new ethers.Contract(registerEchoToken, ECHO_TOKEN_ABI, provider);
    const registerSupply = await registerEchoContract.totalSupply();
    console.log(`   地址: ${registerEchoToken}`);
    console.log(`   总供应量: ${ethers.formatEther(registerSupply)} ECHO`);
    
    for (const address of testAddresses) {
      try {
        const balance = await registerEchoContract.balanceOf(address);
        if (balance > 0) {
          console.log(`   ${address}: ${ethers.formatEther(balance)} ECHO`);
        }
      } catch (error) {
        // 忽略错误
      }
    }

    // 4. 分析问题影响
    console.log('\n4. 📋 问题影响分析...');
    
    if (registerEchoToken.toLowerCase() !== CURRENT_ECHO_TOKEN.toLowerCase()) {
      console.log('   ❌ 发现问题:');
      console.log('   - Register合约指向旧的ECHO Token地址');
      console.log('   - 新用户注册时会mint到旧的ECHO Token合约');
      console.log('   - 系统中存在两个ECHO Token合约');
      
      console.log('\n   🚨 具体影响:');
      console.log('   1. 用户注册功能: 会mint到错误的ECHO Token');
      console.log('   2. 任务创建: 可能使用错误的ECHO Token余额检查');
      console.log('   3. 前端显示: 可能显示错误的余额信息');
      
      console.log('\n   💡 解决方案:');
      console.log('   方案1: 重新部署Register合约（推荐）');
      console.log('   - 使用正确的ECHO Token地址部署新的Register合约');
      console.log('   - 更新所有系统配置指向新的Register合约');
      console.log('   - 迁移现有用户注册数据（如果需要）');
      
      console.log('\n   方案2: 使用旧的ECHO Token（不推荐）');
      console.log('   - 将系统配置改回使用Register指向的ECHO Token');
      console.log('   - 但这会丢失新ECHO Token中的配置和状态');
      
      console.log('\n   方案3: 保持现状但修复前端（临时方案）');
      console.log('   - 确保前端直接使用正确的ECHO Token地址');
      console.log('   - 禁用用户注册功能，避免mint到错误合约');
      console.log('   - 这只是临时解决方案');
    }

    return {
      registerEchoToken,
      currentEchoToken: CURRENT_ECHO_TOKEN,
      needsUpdate: registerEchoToken.toLowerCase() !== CURRENT_ECHO_TOKEN.toLowerCase()
    };

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  }
}

// 运行测试
if (require.main === module) {
  testRegisterFunctionality().catch(console.error);
}

export { testRegisterFunctionality };