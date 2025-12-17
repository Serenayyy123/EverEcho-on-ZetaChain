/**
 * 测试 ECHO 代币合约的基本功能
 * 检查 transfer 和 burn 函数是否正常工作
 */

import { ethers } from 'ethers';

async function testEchoTokenFunctions() {
  console.log('🧪 测试 ECHO 代币合约功能...\n');

  const ECHO_TOKEN_ADDRESS = '0xE0e8CD2F3a8bd6241B09798DEe98f1c777537b4D';
  const TASK_ESCROW_ADDRESS = '0xE442Eb737983986153E42C9ad28530676d8C1f55';
  const HELPER_ADDRESS = '0xA088268e7dBEF49feb03f74e54Cd2EB5F56495db';

  const ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address to, uint256 amount) external returns (bool)',
    'function burn(uint256 amount) external',
    'function owner() view returns (address)',
    'function paused() view returns (bool)',
    // 可能的权限控制函数
    'function hasRole(bytes32 role, address account) view returns (bool)',
    'function getRoleAdmin(bytes32 role) view returns (bytes32)',
    // 可能的黑名单函数
    'function isBlacklisted(address account) view returns (bool)'
  ];

  try {
    const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);
    const echoToken = new ethers.Contract(ECHO_TOKEN_ADDRESS, ERC20_ABI, provider);

    console.log('📋 ECHO 代币基本信息:');
    try {
      const name = await echoToken.name();
      const symbol = await echoToken.symbol();
      const decimals = await echoToken.decimals();
      const totalSupply = await echoToken.totalSupply();
      
      console.log(`   - 名称: ${name}`);
      console.log(`   - 符号: ${symbol}`);
      console.log(`   - 精度: ${decimals}`);
      console.log(`   - 总供应量: ${ethers.formatUnits(totalSupply, decimals)}`);
    } catch (e) {
      console.log('   ❌ 无法读取基本信息');
    }

    console.log('\n💰 余额信息:');
    const taskEscrowBalance = await echoToken.balanceOf(TASK_ESCROW_ADDRESS);
    const helperBalance = await echoToken.balanceOf(HELPER_ADDRESS);
    
    console.log(`   - TaskEscrow 余额: ${ethers.formatEther(taskEscrowBalance)} ECHO`);
    console.log(`   - Helper 余额: ${ethers.formatEther(helperBalance)} ECHO`);

    console.log('\n🔐 权限检查:');
    
    // 检查是否有 owner 函数
    try {
      const owner = await echoToken.owner();
      console.log(`   - 合约所有者: ${owner}`);
      console.log(`   - TaskEscrow 是所有者: ${owner.toLowerCase() === TASK_ESCROW_ADDRESS.toLowerCase() ? '✅' : '❌'}`);
    } catch (e) {
      console.log('   - 没有 owner 函数或无法访问');
    }

    // 检查是否暂停
    try {
      const paused = await echoToken.paused();
      console.log(`   - 合约暂停状态: ${paused ? '❌ 已暂停' : '✅ 正常'}`);
    } catch (e) {
      console.log('   - 没有 paused 函数或无法访问');
    }

    // 检查黑名单
    try {
      const taskEscrowBlacklisted = await echoToken.isBlacklisted(TASK_ESCROW_ADDRESS);
      const helperBlacklisted = await echoToken.isBlacklisted(HELPER_ADDRESS);
      console.log(`   - TaskEscrow 被列入黑名单: ${taskEscrowBlacklisted ? '❌ 是' : '✅ 否'}`);
      console.log(`   - Helper 被列入黑名单: ${helperBlacklisted ? '❌ 是' : '✅ 否'}`);
    } catch (e) {
      console.log('   - 没有黑名单功能或无法访问');
    }

    // 检查角色权限 (如果有的话)
    console.log('\n🎭 角色权限检查:');
    try {
      // 常见的角色哈希
      const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('BURNER_ROLE'));
      const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'));
      const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

      const hasBurnerRole = await echoToken.hasRole(BURNER_ROLE, TASK_ESCROW_ADDRESS);
      const hasMinterRole = await echoToken.hasRole(MINTER_ROLE, TASK_ESCROW_ADDRESS);
      const hasAdminRole = await echoToken.hasRole(DEFAULT_ADMIN_ROLE, TASK_ESCROW_ADDRESS);

      console.log(`   - TaskEscrow 有 BURNER_ROLE: ${hasBurnerRole ? '✅' : '❌'}`);
      console.log(`   - TaskEscrow 有 MINTER_ROLE: ${hasMinterRole ? '✅' : '❌'}`);
      console.log(`   - TaskEscrow 有 DEFAULT_ADMIN_ROLE: ${hasAdminRole ? '✅' : '❌'}`);

      if (!hasBurnerRole) {
        console.log('   ❌ TaskEscrow 没有 BURNER_ROLE！这可能是问题所在！');
        console.log('   💡 解决方案: 需要给 TaskEscrow 合约授予 BURNER_ROLE');
      }
    } catch (e) {
      console.log('   - 没有基于角色的访问控制或无法访问');
    }

    console.log('\n🧪 模拟函数调用:');
    
    // 模拟 transfer 调用
    try {
      const transferAmount = ethers.parseEther('1.0');
      await echoToken.transfer.staticCall(HELPER_ADDRESS, transferAmount);
      console.log('   ✅ Transfer 模拟成功');
    } catch (transferError: any) {
      console.log('   ❌ Transfer 模拟失败:', transferError.message);
      
      // 尝试解码错误
      if (transferError.data) {
        console.log('   🔍 错误数据:', transferError.data);
      }
    }

    // 模拟 burn 调用
    try {
      const burnAmount = ethers.parseEther('0.1');
      await echoToken.burn.staticCall(burnAmount);
      console.log('   ✅ Burn 模拟成功');
    } catch (burnError: any) {
      console.log('   ❌ Burn 模拟失败:', burnError.message);
      
      // 尝试解码错误
      if (burnError.data) {
        console.log('   🔍 错误数据:', burnError.data);
      }
    }

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
  }
}

testEchoTokenFunctions().catch(console.error);