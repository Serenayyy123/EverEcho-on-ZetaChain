/**
 * 检查Register合约中的ECHO Token地址是否已更新
 */

import { ethers } from 'ethers';

const REGISTER_ADDRESS = '0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA';
const EXPECTED_ECHO_TOKEN = '0x650AAE045552567df9eb0633afd77D44308D3e6D';
const OLD_ECHO_TOKEN = '0x876E3e3508c8ee669359A0e58A7bADD55530B8B3';

// Register合约ABI
const REGISTER_ABI = [
  'function echoToken() view returns (address)',
  'function owner() view returns (address)',
  'function setEchoToken(address _echoToken) external'
];

async function checkRegisterEchoTokenAddress() {
  console.log('🔍 检查Register合约中的ECHO Token地址...\n');

  try {
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    const registerContract = new ethers.Contract(REGISTER_ADDRESS, REGISTER_ABI, provider);

    console.log(`📋 Register合约地址: ${REGISTER_ADDRESS}`);
    console.log(`📋 期望的ECHO Token地址: ${EXPECTED_ECHO_TOKEN}`);
    console.log(`📋 旧的ECHO Token地址: ${OLD_ECHO_TOKEN}\n`);

    // 1. 检查当前的ECHO Token地址
    console.log('1. 📡 检查当前配置的ECHO Token地址...');
    const currentEchoToken = await registerContract.echoToken();
    console.log(`   当前ECHO Token地址: ${currentEchoToken}`);

    // 2. 验证地址是否正确
    console.log('\n2. ✅ 验证地址配置...');
    if (currentEchoToken.toLowerCase() === EXPECTED_ECHO_TOKEN.toLowerCase()) {
      console.log('   ✅ ECHO Token地址配置正确！');
      console.log('   ✅ Register合约已经更新到新的ECHO Token地址');
    } else if (currentEchoToken.toLowerCase() === OLD_ECHO_TOKEN.toLowerCase()) {
      console.log('   ❌ ECHO Token地址仍然是旧地址！');
      console.log('   ⚠️  Register合约需要更新ECHO Token地址');
      
      // 检查合约所有者
      console.log('\n3. 👤 检查合约所有者...');
      const owner = await registerContract.owner();
      console.log(`   合约所有者: ${owner}`);
      console.log(`   需要合约所有者调用 setEchoToken("${EXPECTED_ECHO_TOKEN}") 来更新地址`);
      
    } else {
      console.log('   ❓ ECHO Token地址是未知地址');
      console.log(`   期望: ${EXPECTED_ECHO_TOKEN}`);
      console.log(`   实际: ${currentEchoToken}`);
    }

    // 3. 检查合约所有者信息
    console.log('\n4. 👤 合约管理信息...');
    const owner = await registerContract.owner();
    console.log(`   合约所有者: ${owner}`);

    // 4. 生成更新命令（如果需要）
    if (currentEchoToken.toLowerCase() !== EXPECTED_ECHO_TOKEN.toLowerCase()) {
      console.log('\n💡 更新命令:');
      console.log('如果您是合约所有者，可以使用以下命令更新ECHO Token地址:');
      console.log(`
// 使用ethers.js更新
const registerContract = new ethers.Contract("${REGISTER_ADDRESS}", ABI, signer);
const tx = await registerContract.setEchoToken("${EXPECTED_ECHO_TOKEN}");
await tx.wait();
console.log("✅ ECHO Token地址已更新");
      `);
    }

    return {
      registerAddress: REGISTER_ADDRESS,
      currentEchoToken,
      expectedEchoToken: EXPECTED_ECHO_TOKEN,
      isCorrect: currentEchoToken.toLowerCase() === EXPECTED_ECHO_TOKEN.toLowerCase(),
      owner
    };

  } catch (error: any) {
    console.error('❌ 检查失败:', error.message);
    throw error;
  }
}

// 运行检查
if (require.main === module) {
  checkRegisterEchoTokenAddress().catch(console.error);
}

export { checkRegisterEchoTokenAddress };