/**
 * 全面诊断 confirmComplete 问题
 * 检查所有可能的失败点
 */

import { ethers } from 'ethers';

async function diagnoseConfirmCompleteIssue() {
  console.log('🔍 全面诊断 confirmComplete 问题...\n');

  const TASK_ESCROW_ADDRESS = '0xE442Eb737983986153E42C9ad28530676d8C1f55';
  const ECHO_TOKEN_ADDRESS = '0xE0e8CD2F3a8bd6241B09798DEe98f1c777537b4D';
  const REGISTER_ADDRESS = '0x2fD2B2F4D965ffEF9B66dfBc78285AB76b290eaA';
  const CALLER_ADDRESS = '0xD68a76259d4100A2622D643d5e62F5F92C28C4fe';
  const HELPER_ADDRESS = '0xA088268e7dBEF49feb03f74e54Cd2EB5F56495db';
  const TASK_ID = 3;

  const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public', 7001);

  // ABI 定义
  const REGISTER_ABI = ['function isRegistered(address) view returns (bool)'];
  const ERC20_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address to, uint256 amount) external returns (bool)',
    'function burn(uint256 amount) external'
  ];

  try {
    // 1. 检查注册状态
    console.log('🔐 检查注册状态:');
    const registerContract = new ethers.Contract(REGISTER_ADDRESS, REGISTER_ABI, provider);
    
    const callerRegistered = await registerContract.isRegistered(CALLER_ADDRESS);
    const helperRegistered = await registerContract.isRegistered(HELPER_ADDRESS);
    
    console.log(`   - 调用者 (${CALLER_ADDRESS.slice(0, 10)}...) 已注册: ${callerRegistered ? '✅' : '❌'}`);
    console.log(`   - Helper (${HELPER_ADDRESS.slice(0, 10)}...) 已注册: ${helperRegistered ? '✅' : '❌'}`);

    if (!callerRegistered) {
      console.log('   ❌ 调用者未注册！这可能是问题所在');
      console.log('   💡 解决方案: 调用者需要先在 Register 合约中注册');
    }

    if (!helperRegistered) {
      console.log('   ❌ Helper 未注册！这可能是问题所在');
      console.log('   💡 解决方案: Helper 需要先在 Register 合约中注册');
    }

    // 2. 检查 ECHO 代币合约状态
    console.log('\n💰 检查 ECHO 代币合约:');
    const echoToken = new ethers.Contract(ECHO_TOKEN_ADDRESS, ERC20_ABI, provider);
    
    const contractBalance = await echoToken.balanceOf(TASK_ESCROW_ADDRESS);
    console.log(`   - TaskEscrow 合约余额: ${ethers.formatEther(contractBalance)} ECHO`);

    // 3. 模拟代币转账
    console.log('\n🧪 模拟代币操作:');
    try {
      // 模拟转账给 Helper
      const transferAmount = ethers.parseEther('29.8'); // Helper 应该收到的总金额
      await echoToken.transfer.staticCall(HELPER_ADDRESS, transferAmount);
      console.log('   ✅ 模拟转账成功');
    } catch (transferError: any) {
      console.log('   ❌ 模拟转账失败:', transferError.message);
      console.log('   💡 这可能是 confirmComplete 失败的原因');
    }

    try {
      // 模拟销毁代币
      const burnAmount = ethers.parseEther('0.2'); // 2% 手续费
      await echoToken.burn.staticCall(burnAmount);
      console.log('   ✅ 模拟销毁成功');
    } catch (burnError: any) {
      console.log('   ❌ 模拟销毁失败:', burnError.message);
      console.log('   💡 这可能是 confirmComplete 失败的原因');
    }

    // 4. 检查合约权限
    console.log('\n🔧 检查合约权限:');
    const taskEscrowCode = await provider.getCode(TASK_ESCROW_ADDRESS);
    const echoTokenCode = await provider.getCode(ECHO_TOKEN_ADDRESS);
    const registerCode = await provider.getCode(REGISTER_ADDRESS);
    
    console.log(`   - TaskEscrow 合约存在: ${taskEscrowCode !== '0x' ? '✅' : '❌'}`);
    console.log(`   - ECHO Token 合约存在: ${echoTokenCode !== '0x' ? '✅' : '❌'}`);
    console.log(`   - Register 合约存在: ${registerCode !== '0x' ? '✅' : '❌'}`);

    // 5. 总结诊断结果
    console.log('\n🎯 诊断总结:');
    if (!callerRegistered || !helperRegistered) {
      console.log('❌ 主要问题: 用户注册状态');
      console.log('💡 解决方案:');
      if (!callerRegistered) {
        console.log('   1. 调用者需要调用 Register.register() 进行注册');
      }
      if (!helperRegistered) {
        console.log('   2. Helper 需要调用 Register.register() 进行注册');
      }
    } else {
      console.log('✅ 注册状态正常');
      console.log('💡 问题可能在于:');
      console.log('   1. 代币合约的内部逻辑');
      console.log('   2. 网络或 RPC 问题');
      console.log('   3. 合约版本不匹配');
    }

  } catch (error: any) {
    console.error('❌ 诊断过程中出错:', error.message);
  }
}

diagnoseConfirmCompleteIssue().catch(console.error);