/**
 * 解码自定义错误 0x82b42900
 */

import { ethers } from 'ethers';

function decodeCustomError() {
  console.log('🔍 解码自定义错误...\n');

  const errorData = '0x82b42900';
  
  // TaskEscrow 合约的自定义错误
  const customErrors = [
    'error NotRegistered()',
    'error InvalidReward()',
    'error InvalidStatus()',
    'error Unauthorized()',
    'error Timeout()',
    'error AlreadyRequested()'
  ];

  console.log('📋 错误数据:', errorData);
  console.log('📋 错误选择器:', errorData.slice(0, 10));

  // 计算每个错误的选择器
  console.log('\n🔧 计算错误选择器:');
  customErrors.forEach(errorSig => {
    const selector = ethers.id(errorSig).slice(0, 10);
    const match = selector === errorData.slice(0, 10);
    console.log(`   ${errorSig}: ${selector} ${match ? '✅' : ''}`);
    
    if (match) {
      console.log(`\n🎯 匹配的错误: ${errorSig}`);
      
      // 解释错误含义
      switch (errorSig) {
        case 'error NotRegistered()':
          console.log('💡 错误含义: 用户未注册');
          console.log('💡 解决方案: 确保调用者已在 Register 合约中注册');
          break;
        case 'error InvalidReward()':
          console.log('💡 错误含义: 奖励金额无效');
          console.log('💡 解决方案: 检查奖励金额是否在有效范围内');
          break;
        case 'error InvalidStatus()':
          console.log('💡 错误含义: 任务状态无效');
          console.log('💡 解决方案: 确保任务处于正确的状态');
          break;
        case 'error Unauthorized()':
          console.log('💡 错误含义: 权限不足');
          console.log('💡 解决方案: 确保调用者有执行此操作的权限');
          break;
        case 'error Timeout()':
          console.log('💡 错误含义: 操作超时');
          console.log('💡 解决方案: 检查时间限制条件');
          break;
        case 'error AlreadyRequested()':
          console.log('💡 错误含义: 已经请求过');
          console.log('💡 解决方案: 避免重复请求');
          break;
      }
    }
  });

  // 如果没有匹配，可能是其他合约的错误
  if (!customErrors.some(errorSig => ethers.id(errorSig).slice(0, 10) === errorData.slice(0, 10))) {
    console.log('\n❌ 未找到匹配的自定义错误');
    console.log('💡 可能是:');
    console.log('   - ERC20 代币合约的错误');
    console.log('   - 其他依赖合约的错误');
    console.log('   - 编译器生成的错误');
  }
}

decodeCustomError();