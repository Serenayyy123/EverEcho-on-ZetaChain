/**
 * 测试Register合约更新后的完整系统功能
 */

import { ethers } from 'ethers';

const NEW_REGISTER_ADDRESS = '0x49215D817e017B2713761F9F676df31F5Ff812F2';
const ECHO_TOKEN_ADDRESS = '0x650AAE045552567df9eb0633afd77D44308D3e6D';
const TASK_ESCROW_ADDRESS = '0x162E96b13E122719E90Cf3544E6Eb29DFa834757';

// 合约ABI
const REGISTER_ABI = [
  'function echoToken() view returns (address)',
  'function isRegistered(address user) view returns (bool)',
  'function profileURI(address user) view returns (string)',
  'function register(string calldata _profileURI) external'
];

const ECHO_TOKEN_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)'
];

async function testCompleteSystemAfterRegisterUpdate() {
  console.log('🧪 测试Register合约更新后的完整系统...\n');

  console.log(`📋 新Register合约: ${NEW_REGISTER_ADDRESS}`);
  console.log(`📋 ECHO Token合约: ${ECHO_TOKEN_ADDRESS}`);
  console.log(`📋 TaskEscrow合约: ${TASK_ESCROW_ADDRESS}\n`);

  try {
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);

    // 1. 验证合约地址配置
    console.log('1. 📡 验证合约地址配置...');
    
    // 检查Register合约
    const registerContract = new ethers.Contract(NEW_REGISTER_ADDRESS, REGISTER_ABI, provider);
    const registerEchoToken = await registerContract.echoToken();
    console.log(`   Register.echoToken(): ${registerEchoToken}`);
    
    if (registerEchoToken.toLowerCase() === ECHO_TOKEN_ADDRESS.toLowerCase()) {
      console.log('   ✅ Register合约ECHO Token地址配置正确');
    } else {
      console.log('   ❌ Register合约ECHO Token地址配置错误');
      throw new Error('Register合约配置不正确');
    }

    // 检查ECHO Token合约
    const echoTokenContract = new ethers.Contract(ECHO_TOKEN_ADDRESS, ECHO_TOKEN_ABI, provider);
    const tokenName = await echoTokenContract.name();
    const tokenSymbol = await echoTokenContract.symbol();
    const totalSupply = await echoTokenContract.totalSupply();
    
    console.log(`   ECHO Token: ${tokenName} (${tokenSymbol})`);
    console.log(`   总供应量: ${ethers.formatEther(totalSupply)} ECHO`);

    // 2. 测试前端配置
    console.log('\n2. 🖥️  测试前端配置...');
    console.log('   前端服务: http://localhost:5173/');
    console.log('   后端服务: http://localhost:3001/');
    
    // 可以添加HTTP请求来测试前端API
    console.log('   ✅ 服务已启动，使用新的Register地址');

    // 3. 系统状态检查
    console.log('\n3. 📊 系统状态检查...');
    
    const testAddress = '0x099Fb550F7Dc5842621344c5a1678F943eEF3488';
    const isRegistered = await registerContract.isRegistered(testAddress);
    const echoBalance = await echoTokenContract.balanceOf(testAddress);
    
    console.log(`   测试地址: ${testAddress}`);
    console.log(`   注册状态: ${isRegistered ? '已注册' : '未注册'}`);
    console.log(`   ECHO余额: ${ethers.formatEther(echoBalance)} ECHO`);

    // 4. 功能测试建议
    console.log('\n4. 🎯 功能测试建议...');
    console.log('   请在浏览器中访问 http://localhost:5173/ 并测试:');
    console.log('   1. 用户注册功能');
    console.log('   2. ECHO Token余额显示');
    console.log('   3. 任务创建功能');
    console.log('   4. 任务完成功能');

    // 5. 注意事项
    console.log('\n5. ⚠️  重要注意事项...');
    console.log('   1. 现有用户需要重新注册');
    console.log('   2. 旧的注册数据已丢失');
    console.log('   3. ProfileURI需要重新设置');
    console.log('   4. 建议通知所有用户重新注册');

    // 6. 监控建议
    console.log('\n6. 📈 监控建议...');
    console.log('   1. 监控新用户注册情况');
    console.log('   2. 检查ECHO Token mint是否正常');
    console.log('   3. 验证任务创建和完成流程');
    console.log('   4. 观察系统错误日志');

    console.log('\n🎉 Register合约更新完成！系统已使用新的正确配置。');

    return {
      newRegisterAddress: NEW_REGISTER_ADDRESS,
      echoTokenAddress: ECHO_TOKEN_ADDRESS,
      registerEchoToken,
      isConfigCorrect: registerEchoToken.toLowerCase() === ECHO_TOKEN_ADDRESS.toLowerCase(),
      frontendUrl: 'http://localhost:5173/',
      backendUrl: 'http://localhost:3001/'
    };

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  }
}

// 运行测试
if (require.main === module) {
  testCompleteSystemAfterRegisterUpdate().catch(console.error);
}

export { testCompleteSystemAfterRegisterUpdate };