/**
 * 解码 ECHO 代币合约的错误
 */

import { ethers } from 'ethers';

function decodeEchoTokenErrors() {
  console.log('🔍 解码 ECHO 代币错误...\n');

  // 常见的 ERC20 错误
  const commonErrors = [
    'error InsufficientBalance(uint256 balance, uint256 needed)',
    'error InsufficientAllowance(uint256 allowance, uint256 needed)',
    'error InvalidReceiver(address receiver)',
    'error InvalidSender(address sender)',
    'error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)',
    'error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)',
    'error ERC20InvalidSender(address sender)',
    'error ERC20InvalidReceiver(address receiver)',
    'error ERC20InvalidApprover(address approver)',
    'error ERC20InvalidSpender(address spender)',
    // 自定义错误
    'error Unauthorized()',
    'error NotRegistered()',
    'error InvalidAmount()',
    'error TransferFailed()',
    'error BurnFailed()',
    'error Paused()',
    'error Blacklisted(address account)'
  ];

  const transferErrorData = '0x96c6fd1e0000000000000000000000000000000000000000000000000000000000000000';
  const burnErrorData = '0x19a7dea6';

  console.log('📋 Transfer 错误数据:', transferErrorData);
  console.log('📋 Transfer 错误选择器:', transferErrorData.slice(0, 10));
  console.log('📋 Burn 错误数据:', burnErrorData);
  console.log('📋 Burn 错误选择器:', burnErrorData.slice(0, 10));

  console.log('\n🔧 检查常见错误:');
  
  // 检查 transfer 错误
  console.log('\n🔄 Transfer 错误分析:');
  let transferErrorFound = false;
  commonErrors.forEach(errorSig => {
    const selector = ethers.id(errorSig).slice(0, 10);
    if (selector === transferErrorData.slice(0, 10)) {
      console.log(`✅ 匹配: ${errorSig}`);
      transferErrorFound = true;
      
      // 如果有参数，尝试解码
      if (transferErrorData.length > 10) {
        try {
          const iface = new ethers.Interface([errorSig]);
          const decoded = iface.parseError(transferErrorData);
          console.log('   参数:', decoded?.args);
        } catch (e) {
          console.log('   无法解码参数');
        }
      }
    }
  });

  if (!transferErrorFound) {
    console.log('❌ 未找到匹配的 transfer 错误');
  }

  // 检查 burn 错误
  console.log('\n🔥 Burn 错误分析:');
  let burnErrorFound = false;
  commonErrors.forEach(errorSig => {
    const selector = ethers.id(errorSig).slice(0, 10);
    if (selector === burnErrorData.slice(0, 10)) {
      console.log(`✅ 匹配: ${errorSig}`);
      burnErrorFound = true;
    }
  });

  if (!burnErrorFound) {
    console.log('❌ 未找到匹配的 burn 错误');
  }

  // 手动计算一些常见错误的选择器
  console.log('\n🧮 常见错误选择器对比:');
  const checkErrors = [
    'InsufficientBalance(uint256,uint256)',
    'InsufficientAllowance(uint256,uint256)', 
    'ERC20InsufficientBalance(address,uint256,uint256)',
    'ERC20InsufficientAllowance(address,uint256,uint256)',
    'Unauthorized()',
    'NotRegistered()',
    'Paused()'
  ];

  checkErrors.forEach(errorSig => {
    const fullSig = `error ${errorSig}`;
    const selector = ethers.id(fullSig).slice(0, 10);
    const transferMatch = selector === transferErrorData.slice(0, 10);
    const burnMatch = selector === burnErrorData.slice(0, 10);
    
    if (transferMatch || burnMatch) {
      console.log(`✅ ${fullSig}: ${selector} ${transferMatch ? '(Transfer)' : ''} ${burnMatch ? '(Burn)' : ''}`);
    }
  });

  console.log('\n💡 可能的问题:');
  console.log('1. TaskEscrow 合约没有足够的 ECHO 代币余额');
  console.log('2. TaskEscrow 合约没有权限调用 burn 函数');
  console.log('3. ECHO 代币合约被暂停或有其他限制');
  console.log('4. 接收地址 (Helper) 被列入黑名单');
  console.log('5. 合约版本不匹配或 ABI 不正确');
}

decodeEchoTokenErrors();