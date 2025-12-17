/**
 * 验证 React Key 重复问题修复
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 验证 React Key 重复问题修复\n');

// 读取配置文件
const configPath = path.join(process.cwd(), '../frontend/src/config/contracts.ts');
const configContent = fs.readFileSync(configPath, 'utf-8');

// 提取 TARGET_CHAINS 配置
const targetChainsMatch = configContent.match(/export const TARGET_CHAINS = \[([\s\S]*?)\];/);
if (!targetChainsMatch) {
  console.log('❌ 无法找到 TARGET_CHAINS 配置');
  process.exit(1);
}

const targetChainsContent = targetChainsMatch[1];
console.log('📋 TARGET_CHAINS 配置内容:');
console.log(targetChainsContent);

// 检查是否有重复的 value
const valueMatches = targetChainsContent.match(/value:\s*['"]([^'"]+)['"]/g);
if (!valueMatches) {
  console.log('❌ 无法解析 TARGET_CHAINS 的 value 字段');
  process.exit(1);
}

const values = valueMatches.map(match => {
  const valueMatch = match.match(/value:\s*['"]([^'"]+)['"]/);
  return valueMatch ? valueMatch[1] : null;
}).filter(Boolean);

console.log('\n🔍 检查到的 value 值:');
values.forEach((value, index) => {
  console.log(`   ${index + 1}. "${value}"`);
});

// 检查重复
const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
const hasDuplicates = duplicates.length > 0;

console.log('\n📊 重复检查结果:');
if (hasDuplicates) {
  console.log('❌ 发现重复的 value:');
  duplicates.forEach(duplicate => {
    console.log(`   - "${duplicate}"`);
  });
} else {
  console.log('✅ 没有发现重复的 value');
}

// 检查预期的配置
const expectedValues = ['11155111', '7001'];
const hasExpectedValues = expectedValues.every(expected => values.includes(expected));
const hasOnlyExpectedValues = values.length === expectedValues.length && hasExpectedValues;

console.log('\n🎯 预期配置检查:');
console.log(`   预期值: [${expectedValues.map(v => `"${v}"`).join(', ')}]`);
console.log(`   实际值: [${values.map(v => `"${v}"`).join(', ')}]`);
console.log(`   ✅ 包含预期值: ${hasExpectedValues ? '是' : '否'}`);
console.log(`   ✅ 仅包含预期值: ${hasOnlyExpectedValues ? '是' : '否'}`);

// 检查 SUPPORTED_ASSETS 配置
console.log('\n🔍 检查 SUPPORTED_ASSETS 配置:');
const assetsMatch = configContent.match(/export const SUPPORTED_ASSETS = \[([\s\S]*?)\];/);
if (assetsMatch) {
  const assetsContent = assetsMatch[1];
  const assetValueMatches = assetsContent.match(/value:\s*['"]([^'"]+)['"]/g);
  
  if (assetValueMatches) {
    const assetValues = assetValueMatches.map(match => {
      const valueMatch = match.match(/value:\s*['"]([^'"]+)['"]/);
      return valueMatch ? valueMatch[1] : null;
    }).filter(Boolean);
    
    console.log('   支持的资产:');
    assetValues.forEach((value, index) => {
      console.log(`   ${index + 1}. "${value}"`);
    });
    
    const expectedAssets = [
      '0x0000000000000000000000000000000000000000',
      'ZETA_NATIVE',
      '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
    ];
    
    const hasExpectedAssets = expectedAssets.every(expected => assetValues.includes(expected));
    console.log(`   ✅ 包含预期资产: ${hasExpectedAssets ? '是' : '否'}`);
  }
}

// 最终结果
console.log('\n📝 修复验证结果:');
const isFixed = !hasDuplicates && hasOnlyExpectedValues;

if (isFixed) {
  console.log('🎉 React Key 重复问题已成功修复！');
  console.log('');
  console.log('✅ 修复要点:');
  console.log('   • 移除了重复的 TARGET_CHAINS 配置项');
  console.log('   • 保留了正确的两个目标链：ETH Sepolia 和 ZetaChain');
  console.log('   • 资产类型和目标链配置逻辑清晰');
  console.log('   • React 组件渲染不再有 key 重复警告');
  
  console.log('\n🔗 相关文件:');
  console.log('   • frontend/src/config/contracts.ts - 主要修复文件');
  console.log('   • DUPLICATE_KEY_FIX_SUMMARY.md - 修复总结文档');
  
} else {
  console.log('❌ React Key 重复问题尚未完全修复');
  
  if (hasDuplicates) {
    console.log('   问题：仍然存在重复的 value');
  }
  
  if (!hasOnlyExpectedValues) {
    console.log('   问题：配置值不符合预期');
  }
}

process.exit(isFixed ? 0 : 1);