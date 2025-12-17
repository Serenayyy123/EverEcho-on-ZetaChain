/**
 * 解码新的错误信息
 */

import { ethers } from 'ethers';

async function decodeNewError() {
  console.log('🔍 解码错误信息...\n');

  // 错误数据
  const errorData = '0x19a7dea6';
  
  // ECHO 代币合约的错误定义
  const echoTokenErrors = [
    'error OnlyRegister()',
    'error OnlyTaskEscrow()',
    'error AlreadyMinted()',
    'error AddressAlreadySet()',
    'error ZeroAddress()'
  ];

  // TaskEscrow 合约的错误定义
  const taskEscrowErrors = [
    'error NotRegistered()',
    'error InvalidReward()',
    'error InvalidStatus()',
    'error Unauthorized()',
    'error Timeout()',
    'error AlreadyRequested()'
  ];

  console.log(`错误数据: ${errorData}`);
  console.log('\n尝试解码...');

  // 计算错误选择器
  const allErrors = [...echoTokenErrors, ...taskEscrowErrors];
  
  for (const errorSig of allErrors) {
    const selector = ethers.id(errorSig).slice(0, 10);
    if (selector === errorData) {
      console.log(`✅ 找到匹配的错误: ${errorSig}`);
      console.log(`   选择器: ${selector}`);
      return;
    }
  }

  // 如果没找到，尝试标准 ERC20 错误
  const erc20Errors = [
    'error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)',
    'error ERC20InvalidSender(address sender)',
    'error ERC20InvalidReceiver(address receiver)',
    'error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)',
    'error ERC20InvalidApprover(address approver)',
    'error ERC20InvalidSpender(address spender)'
  ];

  for (const errorSig of erc20Errors) {
    const selector = ethers.id(errorSig).slice(0, 10);
    if (selector === errorData) {
      console.log(`✅ 找到匹配的 ERC20 错误: ${errorSig}`);
      console.log(`   选择器: ${selector}`);
      return;
    }
  }

  console.log('❌ 未找到匹配的错误定义');
  console.log('\n手动计算一些常见错误的选择器:');
  
  for (const errorSig of allErrors) {
    const selector = ethers.id(errorSig).slice(0, 10);
    console.log(`   ${errorSig} -> ${selector}`);
  }
}

decodeNewError().catch(console.error);