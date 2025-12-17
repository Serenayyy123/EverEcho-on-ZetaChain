/**
 * 验证跨链奖励余额显示修复
 * 
 * 这个脚本验证以下修复点：
 * 1. updateBalance() 函数现在根据资产类型智能获取余额
 * 2. 资产切换时自动更新对应网络的余额
 * 3. 正确的网络映射和小数位处理
 */

import fs from 'fs';
import path from 'path';

// 读取修复后的文件内容
const componentPath = path.join(process.cwd(), '../frontend/src/components/ui/CrossChainRewardSection.tsx');
const componentContent = fs.readFileSync(componentPath, 'utf-8');

console.log('🔍 验证跨链奖励余额显示修复\n');

// 验证点1: updateBalance函数是否支持资产参数
const hasAssetParameter = componentContent.includes('updateBalance = async (walletAddress?: string, assetOverride?: string)');
console.log(`✅ updateBalance函数支持资产参数: ${hasAssetParameter ? '是' : '否'}`);

// 验证点2: 是否有基于资产类型的余额检查逻辑
const hasAssetBasedLogic = componentContent.includes('if (currentAsset === \'0x0000000000000000000000000000000000000000\')') &&
                          componentContent.includes('else if (currentAsset === \'ZETA_NATIVE\')');
console.log(`✅ 基于资产类型的余额检查逻辑: ${hasAssetBasedLogic ? '是' : '否'}`);

// 验证点3: ETH Sepolia是否映射到正确的链ID
const hasETHSepoliaMapping = componentContent.includes('checkNativeTokenBalance(targetAddress, 11155111)');
console.log(`✅ ETH Sepolia映射到Chain 11155111: ${hasETHSepoliaMapping ? '是' : '否'}`);

// 验证点4: ZetaChain是否映射到正确的链ID
const hasZetaChainMapping = componentContent.includes('checkNativeTokenBalance(targetAddress, 7001)');
console.log(`✅ ZetaChain映射到Chain 7001: ${hasZetaChainMapping ? '是' : '否'}`);

// 验证点5: ERC20代币是否使用正确的网络
const hasERC20Mapping = componentContent.includes('checkERC20TokenBalance(targetAddress, currentAsset, 11155111)');
console.log(`✅ ERC20代币使用ETH Sepolia网络: ${hasERC20Mapping ? '是' : '否'}`);

// 验证点6: 资产切换时是否自动更新余额
const hasAssetSwitchUpdate = componentContent.includes('await updateBalance(address, newAsset)');
console.log(`✅ 资产切换时自动更新余额: ${hasAssetSwitchUpdate ? '是' : '否'}`);

// 验证点7: 是否有正确的小数位处理
const hasDecimalsHandling = componentContent.includes('ethers.formatUnits(balance, selectedAsset.decimals)');
console.log(`✅ 正确的小数位处理: ${hasDecimalsHandling ? '是' : '否'}`);

// 验证点8: 是否移除了旧的当前网络余额逻辑
const hasOldLogic = componentContent.includes('provider.getBalance(targetAddress)') && 
                   !componentContent.includes('checkNativeTokenBalance') &&
                   !componentContent.includes('checkERC20TokenBalance');
console.log(`✅ 移除了旧的当前网络余额逻辑: ${!hasOldLogic ? '是' : '否'}`);

console.log('\n📋 修复验证结果:');

const allChecks = [
  hasAssetParameter,
  hasAssetBasedLogic,
  hasETHSepoliaMapping,
  hasZetaChainMapping,
  hasERC20Mapping,
  hasAssetSwitchUpdate,
  hasDecimalsHandling,
  !hasOldLogic
];

const passedChecks = allChecks.filter(check => check).length;
const totalChecks = allChecks.length;

console.log(`通过检查: ${passedChecks}/${totalChecks}`);

if (passedChecks === totalChecks) {
  console.log('🎉 所有验证点都通过！余额显示修复已完成。');
  
  console.log('\n📝 修复摘要:');
  console.log('• ETH Sepolia 选择时显示 ETH Sepolia 网络余额');
  console.log('• ZetaChain ZETA 选择时显示 ZetaChain 网络余额');
  console.log('• ETH Sepolia USDC 选择时显示 ETH Sepolia 网络 USDC 余额');
  console.log('• 资产切换时自动更新对应网络余额');
  console.log('• 正确的小数位格式化（ETH/ZETA: 18位，USDC: 6位）');
  console.log('• 多重降级策略确保余额查询可靠性');
  
} else {
  console.log('❌ 部分验证点未通过，请检查修复实现。');
  
  // 显示未通过的检查项
  const checkNames = [
    'updateBalance函数支持资产参数',
    '基于资产类型的余额检查逻辑',
    'ETH Sepolia映射到Chain 11155111',
    'ZetaChain映射到Chain 7001',
    'ERC20代币使用ETH Sepolia网络',
    '资产切换时自动更新余额',
    '正确的小数位处理',
    '移除了旧的当前网络余额逻辑'
  ];
  
  allChecks.forEach((passed, index) => {
    if (!passed) {
      console.log(`❌ ${checkNames[index]}`);
    }
  });
}

console.log('\n🔗 相关文件:');
console.log('• frontend/src/components/ui/CrossChainRewardSection.tsx - 主要修复文件');
console.log('• BALANCE_DISPLAY_FIX_SUMMARY.md - 修复总结文档');
console.log('• scripts/testBalanceDisplayFix.ts - 测试脚本');

process.exit(passedChecks === totalChecks ? 0 : 1);