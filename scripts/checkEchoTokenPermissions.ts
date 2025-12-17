/**
 * 检查 ECHO 代币合约的权限设置
 * 验证 TaskEscrow 地址是否已正确配置
 */

import { ethers } from 'ethers';

async function checkEchoTokenPermissions() {
  console.log('🔐 检查 ECHO 代币权限设置...\n');

  const ECHO_TOKEN_ADDRESS = '0x876E3e3508c8ee669359A0e58A7bADD55530B8B3';
  const TASK_ESCROW_ADDRESS = '0xE442Eb737983986153E42C9ad28530676d8C1f55';

  const ECHO_TOKEN_ABI = [
    'function owner() view returns (address)',
    'function registerAddress() view returns (address)',
    'function taskEscrowAddress() view returns (address)',
    'function setTaskEscrowAddress(address) external',
    'function setRegisterAddress(address) external'
  ];

  try {
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    const echoToken = new ethers.Contract(ECHO_TOKEN_ADDRESS, ECHO_TOKEN_ABI, provider);

    console.log('📋 ECHO 代币权限配置:');
    
    const owner = await echoToken.owner();
    const registerAddress = await echoToken.registerAddress();
    const taskEscrowAddress = await echoToken.taskEscrowAddress();

    console.log(`   - 合约所有者: ${owner}`);
    console.log(`   - Register 地址: ${registerAddress}`);
    console.log(`   - TaskEscrow 地址: ${taskEscrowAddress}`);

    console.log('\n🔍 地址验证:');
    console.log(`   - 期望的 TaskEscrow 地址: ${TASK_ESCROW_ADDRESS}`);
    console.log(`   - 实际的 TaskEscrow 地址: ${taskEscrowAddress}`);
    
    const taskEscrowMatches = TASK_ESCROW_ADDRESS.toLowerCase() === taskEscrowAddress.toLowerCase();
    console.log(`   - TaskEscrow 地址匹配: ${taskEscrowMatches ? '✅' : '❌'}`);

    if (!taskEscrowMatches) {
      console.log('\n❌ TaskEscrow 地址不匹配！这就是问题所在！');
      console.log('💡 问题分析:');
      console.log('   - EOCHOToken.burn() 只允许 taskEscrowAddress 调用');
      console.log('   - 当前配置的地址与实际 TaskEscrow 地址不匹配');
      console.log('   - 因此 TaskEscrow 无法调用 burn 函数');
      
      console.log('\n🛠️ 解决方案:');
      if (taskEscrowAddress === ethers.ZeroAddress) {
        console.log('   1. TaskEscrow 地址未设置，需要调用 setTaskEscrowAddress()');
        console.log(`   2. 合约所有者 (${owner}) 需要执行:`);
        console.log(`      echoToken.setTaskEscrowAddress("${TASK_ESCROW_ADDRESS}")`);
      } else {
        console.log('   1. TaskEscrow 地址设置错误，需要重新部署或修复');
        console.log('   2. 检查部署脚本中的地址配置');
      }
    } else {
      console.log('\n✅ TaskEscrow 地址配置正确');
      console.log('💡 问题可能在于:');
      console.log('   1. ECHO 代币合约的其他限制');
      console.log('   2. Transfer 函数的特殊逻辑');
      console.log('   3. 合约状态或余额问题');
    }

    // 检查 Register 地址配置
    console.log('\n📝 Register 地址检查:');
    if (registerAddress === ethers.ZeroAddress) {
      console.log('   ⚠️ Register 地址未设置');
    } else {
      console.log(`   ✅ Register 地址已设置: ${registerAddress}`);
    }

  } catch (error: any) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkEchoTokenPermissions().catch(console.error);