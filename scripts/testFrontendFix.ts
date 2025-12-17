#!/usr/bin/env tsx

/**
 * 测试前端修复是否成功
 */

import fs from 'fs';
import path from 'path';

async function testFrontendFix() {
  console.log('🔍 Testing Frontend Fix');
  console.log('=======================');

  let allPassed = true;
  const results: Array<{ test: string; passed: boolean; details: string }> = [];

  // 测试 1: 检查 CrossChainRewardSection 是否移除了 wagmi 依赖
  console.log('\n📋 Test 1: CrossChainRewardSection wagmi removal');
  console.log('------------------------------------------------');
  
  const sectionPath = 'frontend/src/components/ui/CrossChainRewardSection.tsx';
  if (fs.existsSync(sectionPath)) {
    const sectionContent = fs.readFileSync(sectionPath, 'utf8');
    const hasWagmiImport = sectionContent.includes("from 'wagmi'");
    const hasEthersImport = sectionContent.includes("from 'ethers'");
    const hasWindowEthereum = sectionContent.includes('window.ethereum');
    
    if (!hasWagmiImport && hasEthersImport && hasWindowEthereum) {
      console.log('✅ CrossChainRewardSection successfully migrated from wagmi to ethers');
      results.push({ test: 'Section wagmi removal', passed: true, details: 'Successfully migrated to ethers' });
    } else {
      console.log('❌ CrossChainRewardSection still has wagmi dependencies');
      results.push({ test: 'Section wagmi removal', passed: false, details: `wagmi: ${hasWagmiImport}, ethers: ${hasEthersImport}, window.ethereum: ${hasWindowEthereum}` });
      allPassed = false;
    }
  } else {
    console.log('❌ CrossChainRewardSection file not found');
    results.push({ test: 'Section wagmi removal', passed: false, details: 'File not found' });
    allPassed = false;
  }

  // 测试 2: 检查 CrossChainRewardDisplay 是否移除了 wagmi 依赖
  console.log('\n📋 Test 2: CrossChainRewardDisplay wagmi removal');
  console.log('-----------------------------------------------');
  
  const displayPath = 'frontend/src/components/ui/CrossChainRewardDisplay.tsx';
  if (fs.existsSync(displayPath)) {
    const displayContent = fs.readFileSync(displayPath, 'utf8');
    const hasWagmiImport = displayContent.includes("from 'wagmi'");
    const hasEthersImport = displayContent.includes("from 'ethers'");
    const hasWindowEthereum = displayContent.includes('window.ethereum');
    
    if (!hasWagmiImport && hasEthersImport && hasWindowEthereum) {
      console.log('✅ CrossChainRewardDisplay successfully migrated from wagmi to ethers');
      results.push({ test: 'Display wagmi removal', passed: true, details: 'Successfully migrated to ethers' });
    } else {
      console.log('❌ CrossChainRewardDisplay still has wagmi dependencies');
      results.push({ test: 'Display wagmi removal', passed: false, details: `wagmi: ${hasWagmiImport}, ethers: ${hasEthersImport}, window.ethereum: ${hasWindowEthereum}` });
      allPassed = false;
    }
  } else {
    console.log('❌ CrossChainRewardDisplay file not found');
    results.push({ test: 'Display wagmi removal', passed: false, details: 'File not found' });
    allPassed = false;
  }

  // 测试 3: 检查 ethereum 类型声明
  console.log('\n📋 Test 3: Ethereum type declarations');
  console.log('-------------------------------------');
  
  const typesPath = 'frontend/src/types/ethereum.d.ts';
  if (fs.existsSync(typesPath)) {
    const typesContent = fs.readFileSync(typesPath, 'utf8');
    const hasWindowInterface = typesContent.includes('interface Window');
    const hasEthereumProperty = typesContent.includes('ethereum?:');
    
    if (hasWindowInterface && hasEthereumProperty) {
      console.log('✅ Ethereum type declarations are properly defined');
      results.push({ test: 'Ethereum types', passed: true, details: 'Type declarations found' });
    } else {
      console.log('❌ Ethereum type declarations are incomplete');
      results.push({ test: 'Ethereum types', passed: false, details: 'Missing type declarations' });
      allPassed = false;
    }
  } else {
    console.log('❌ Ethereum type declarations file not found');
    results.push({ test: 'Ethereum types', passed: false, details: 'File not found' });
    allPassed = false;
  }

  // 测试 4: 检查是否移除了 useCrossChainReward hook
  console.log('\n📋 Test 4: useCrossChainReward hook removal');
  console.log('-------------------------------------------');
  
  const hookPath = 'frontend/src/hooks/useCrossChainReward.ts';
  const hookExists = fs.existsSync(hookPath);
  
  if (!hookExists) {
    console.log('✅ useCrossChainReward hook successfully removed');
    results.push({ test: 'Hook removal', passed: true, details: 'Hook file removed' });
  } else {
    console.log('❌ useCrossChainReward hook still exists');
    results.push({ test: 'Hook removal', passed: false, details: 'Hook file still exists' });
    allPassed = false;
  }

  // 测试 5: 检查合约配置文件
  console.log('\n📋 Test 5: Contract configuration');
  console.log('---------------------------------');
  
  const configPath = 'frontend/src/config/contracts.ts';
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const hasRewardStatus = configContent.includes('export enum RewardStatus');
    const hasSupportedAssets = configContent.includes('SUPPORTED_ASSETS');
    
    if (hasRewardStatus && hasSupportedAssets) {
      console.log('✅ Contract configuration is complete');
      results.push({ test: 'Contract config', passed: true, details: 'All configurations present' });
    } else {
      console.log('❌ Contract configuration is incomplete');
      results.push({ test: 'Contract config', passed: false, details: 'Missing configurations' });
      allPassed = false;
    }
  } else {
    console.log('❌ Contract configuration file not found');
    results.push({ test: 'Contract config', passed: false, details: 'File not found' });
    allPassed = false;
  }

  // 打印总结
  console.log('\n📊 Frontend Fix Test Summary');
  console.log('============================');
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.details}`);
  });

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  console.log(`\nResults: ${passedCount}/${totalCount} tests passed`);
  
  if (allPassed) {
    console.log('\n🎉 All frontend fix tests passed!');
    console.log('The cross-chain reward components are now ready for testing.');
    console.log('\nNext steps:');
    console.log('1. Start the frontend: npm run dev:frontend');
    console.log('2. Connect MetaMask to localhost:8545');
    console.log('3. Test the cross-chain reward functionality');
  } else {
    console.log('\n⚠️  Some frontend fix tests failed.');
    console.log('Please review the failed tests and fix the issues.');
  }

  return allPassed;
}

if (require.main === module) {
  testFrontendFix().catch(console.error);
}

export { testFrontendFix };