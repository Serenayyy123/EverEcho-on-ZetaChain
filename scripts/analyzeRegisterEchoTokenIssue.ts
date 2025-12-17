/**
 * 分析Register合约ECHO Token地址问题的影响
 */

import { ethers } from 'ethers';

const REGISTER_ADDRESS = '0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA';
const CURRENT_ECHO_TOKEN = '0x650AAE045552567df9eb0633afd77D44308D3e6D';
const REGISTER_ECHO_TOKEN = '0xE0e8CD2F3a8bd6241B09798DEe98f1c777537b4D';

// 合约ABI
const REGISTER_ABI = [
  'function echoToken() view returns (address)',
  'function isRegistered(address user) view returns (bool)',
  'function profileURI(address user) view returns (string)'
];

const ECHO_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)'
];

async function analyzeRegisterEchoTokenIssue() {
  console.log('🔍 分析Register合约ECHO Token地址问题...\n');

  try {
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);

    console.log(`📋 Register合约地址: ${REGISTER_ADDRESS}`);
    console.log(`📋 当前系统使用的ECHO Token: ${CURRENT_ECHO_TOKEN}`);
    console.log(`📋 Register合约指向的ECHO Token: ${REGISTER_ECHO_TOKEN}\n`);

    // 1. 检查Register合约配置
    console.log('1. 📡 检查Register合约配置...');
    const registerContract = new ethers.Contract(REGISTER_ADDRESS, REGISTER_ABI, provider);
    const registerEchoToken = await registerContract.echoToken();
    console.log(`   Register.echoToken(): ${registerEchoToken}`);

    // 2. 检查两个ECHO Token合约的状态
    console.log('\n2. 🔍 检查ECHO Token合约状态...');
    
    // 检查当前系统使用的ECHO Token
    console.log('\n   📊 当前系统ECHO Token状态:');
    try {
      const currentEchoContract = new ethers.Contract(CURRENT_ECHO_TOKEN, ECHO_TOKEN_ABI, provider);
      const currentName = await currentEchoContract.name();
      const currentSymbol = await currentEchoContract.symbol();
      const currentSupply = await currentEchoContract.totalSupply();
      
      console.log(`   地址: ${CURRENT_ECHO_TOKEN}`);
      console.log(`   名称: ${currentName}`);
      console.log(`   符号: ${currentSymbol}`);
      console.log(`   总供应量: ${ethers.formatEther(currentSupply)} ECHO`);
    } catch (error) {
      console.log(`   ❌ 无法读取当前ECHO Token合约: ${error}`);
    }

    // 检查Register指向的ECHO Token
    console.log('\n   📊 Register指向的ECHO Token状态:');
    try {
      const registerEchoContract = new ethers.Contract(REGISTER_ECHO_TOKEN, ECHO_TOKEN_ABI, provider);
      const registerName = await registerEchoContract.name();
      const registerSymbol = await registerEchoContract.symbol();
      const registerSupply = await registerEchoContract.totalSupply();
      
      console.log(`   地址: ${REGISTER_ECHO_TOKEN}`);
      console.log(`   名称: ${registerName}`);
      console.log(`   符号: ${registerSymbol}`);
      console.log(`   总供应量: ${ethers.formatEther(registerSupply)} ECHO`);
    } catch (error) {
      console.log(`   ❌ 无法读取Register指向的ECHO Token合约: ${error}`);
    }

    // 3. 分析影响
    console.log('\n3. 📋 影响分析...');
    
    if (registerEchoToken.toLowerCase() !== CURRENT_ECHO_TOKEN.toLowerCase()) {
      console.log('   ❌ 地址不匹配问题:');
      console.log('   - Register合约指向旧的或错误的ECHO Token地址');
      console.log('   - 这可能导致以下问题:');
      console.log('     * 用户注册时mint到错误的ECHO Token合约');
      console.log('     * 前端显示的ECHO Token地址可能不正确');
      console.log('     * 系统中可能存在两个不同的ECHO Token');
      
      console.log('\n   🔧 可能的解决方案:');
      console.log('   1. 重新部署Register合约，使用正确的ECHO Token地址');
      console.log('   2. 确保前端直接使用正确的ECHO Token地址，不依赖Register');
      console.log('   3. 迁移用户数据到新的Register合约（如果需要）');
    } else {
      console.log('   ✅ 地址配置正确');
    }

    // 4. 检查前端配置
    console.log('\n4. 🖥️  前端配置建议...');
    console.log('   前端应该:');
    console.log(`   - 直接使用ECHO Token地址: ${CURRENT_ECHO_TOKEN}`);
    console.log(`   - 使用Register合约地址: ${REGISTER_ADDRESS}`);
    console.log('   - 不要从Register合约读取ECHO Token地址');
    console.log('   - 确保所有合约调用使用正确的地址');

    return {
      registerAddress: REGISTER_ADDRESS,
      currentEchoToken: CURRENT_ECHO_TOKEN,
      registerEchoToken: REGISTER_ECHO_TOKEN,
      addressMatch: registerEchoToken.toLowerCase() === CURRENT_ECHO_TOKEN.toLowerCase()
    };

  } catch (error: any) {
    console.error('❌ 分析失败:', error.message);
    throw error;
  }
}

// 运行分析
if (require.main === module) {
  analyzeRegisterEchoTokenIssue().catch(console.error);
}

export { analyzeRegisterEchoTokenIssue };