#!/usr/bin/env tsx

/**
 * 验证跨链奖励修复是否成功
 * 检查所有必要的文件和配置
 */

import fs from 'fs';
import path from 'path';

async function verifyCrossChainRewardFix() {
  console.log('🔍 Verifying Cross-Chain Reward Fix');
  console.log('===================================');

  let allPassed = true;
  const results: Array<{ test: string; passed: boolean; details: string }> = [];

  // 测试 1: 检查合约 ABI 文件
  console.log('\n📋 Test 1: Contract ABI File');
  console.log('-----------------------------');
  
  const abiPath = 'frontend/src/contracts/EverEchoUniversalReward.json';
  if (fs.existsSync(abiPath)) {
    try {
      const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
      const hasPreparePlan = abi.abi.some((item: any) => item.name === 'preparePlan');
      const hasDeposit = abi.abi.some((item: any) => item.name === 'deposit');
      const hasGetRewardByTask = abi.abi.some((item: any) => item.name === 'getRewardByTask');
      
      if (hasPreparePlan && hasDeposit && hasGetRewardByTask) {
        console.log('✅ Contract ABI file exists and contains required functions');
        results.push({ test: 'Contract ABI', passed: true, details: 'All required functions present' });
      } else {
        console.log('❌ Contract ABI missing required functions');
        results.push({ test: 'Contract ABI', passed: false, details: 'Missing functions' });
        allPassed = false;
      }
    } catch (error) {
      console.log('❌ Contract ABI file is invalid JSON');
      results.push({ test: 'Contract ABI', passed: false, details: 'Invalid JSON' });
      allPassed = false;
    }
  } else {
    console.log('❌ Contract ABI file not found');
    results.push({ test: 'Contract ABI', passed: false, details: 'File not found' });
    allPassed = false;
  }

  // 测试 2: 检查合约配置文件
  console.log('\n📋 Test 2: Contract Configuration');
  console.log('----------------------------------');
  
  const configPath = 'frontend/src/config/contracts.ts';
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const hasContractAddresses = configContent.includes('CONTRACT_ADDRESSES');
    const hasCreateFunction = configContent.includes('createUniversalRewardContract');
    const hasRewardStatus = configContent.includes('RewardStatus');
    
    if (hasContractAddresses && hasCreateFunction && hasRewardStatus) {
      console.log('✅ Contract configuration file exists and is complete');
      results.push({ test: 'Contract Config', passed: true, details: 'All configurations present' });
    } else {
      console.log('❌ Contract configuration file incomplete');
      results.push({ test: 'Contract Config', passed: false, details: 'Missing configurations' });
      allPassed = false;
    }
  } else {
    console.log('❌ Contract configuration file not found');
    results.push({ test: 'Contract Config', passed: false, details: 'File not found' });
    allPassed = false;
  }

  // 测试 3: 检查 Hook 文件
  console.log('\n📋 Test 3: Cross-Chain Reward Hook');
  console.log('-----------------------------------');
  
  const hookPath = 'frontend/src/hooks/useCrossChainReward.ts';
  if (fs.existsSync(hookPath)) {
    const hookContent = fs.readFileSync(hookPath, 'utf8');
    const hasPreparePlan = hookContent.includes('preparePlan');
    const hasDeposit = hookContent.includes('deposit');
    const hasGetRewardByTask = hookContent.includes('getRewardByTask');
    const hasErrorHandling = hookContent.includes('error');
    
    if (hasPreparePlan && hasDeposit && hasGetRewardByTask && hasErrorHandling) {
      console.log('✅ Cross-chain reward hook exists and is complete');
      results.push({ test: 'Hook Implementation', passed: true, details: 'All functions implemented' });
    } else {
      console.log('❌ Cross-chain reward hook incomplete');
      results.push({ test: 'Hook Implementation', passed: false, details: 'Missing functions' });
      allPassed = false;
    }
  } else {
    console.log('❌ Cross-chain reward hook not found');
    results.push({ test: 'Hook Implementation', passed: false, details: 'File not found' });
    allPassed = false;
  }

  // 测试 4: 检查 CrossChainRewardSection 组件
  console.log('\n📋 Test 4: CrossChainRewardSection Component');
  console.log('---------------------------------------------');
  
  const sectionPath = 'frontend/src/components/ui/CrossChainRewardSection.tsx';
  if (fs.existsSync(sectionPath)) {
    const sectionContent = fs.readFileSync(sectionPath, 'utf8');
    const hasRealContractCalls = !sectionContent.includes('setTimeout') && sectionContent.includes('preparePlan');
    const hasWalletIntegration = sectionContent.includes('useAccount');
    const hasBalanceCheck = sectionContent.includes('checkBalance');
    
    if (hasRealContractCalls && hasWalletIntegration && hasBalanceCheck) {
      console.log('✅ CrossChainRewardSection uses real contract calls');
      results.push({ test: 'Section Component', passed: true, details: 'Real blockchain integration' });
    } else {
      console.log('❌ CrossChainRewardSection still uses simulation');
      results.push({ test: 'Section Component', passed: false, details: 'Still using simulation' });
      allPassed = false;
    }
  } else {
    console.log('❌ CrossChainRewardSection component not found');
    results.push({ test: 'Section Component', passed: false, details: 'File not found' });
    allPassed = false;
  }

  // 测试 5: 检查 CrossChainRewardDisplay 组件
  console.log('\n📋 Test 5: CrossChainRewardDisplay Component');
  console.log('--------------------------------------------');
  
  const displayPath = 'frontend/src/components/ui/CrossChainRewardDisplay.tsx';
  if (fs.existsSync(displayPath)) {
    const displayContent = fs.readFileSync(displayPath, 'utf8');
    const noRandomLogic = !displayContent.includes('Math.random()');
    const hasRealQueries = displayContent.includes('getRewardByTask');
    const hasWalletIntegration = displayContent.includes('useAccount');
    
    if (noRandomLogic && hasRealQueries && hasWalletIntegration) {
      console.log('✅ CrossChainRewardDisplay uses real contract queries');
      results.push({ test: 'Display Component', passed: true, details: 'Real blockchain queries' });
    } else {
      console.log('❌ CrossChainRewardDisplay still uses random logic');
      results.push({ test: 'Display Component', passed: false, details: 'Still using random logic' });
      allPassed = false;
    }
  } else {
    console.log('❌ CrossChainRewardDisplay component not found');
    results.push({ test: 'Display Component', passed: false, details: 'File not found' });
    allPassed = false;
  }

  // 测试 6: 检查环境变量
  console.log('\n📋 Test 6: Environment Variables');
  console.log('---------------------------------');
  
  const envPath = '.env.local';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasUniversalRewardAddress = envContent.includes('NEXT_PUBLIC_UNIVERSAL_REWARD_ADDRESS');
    
    if (hasUniversalRewardAddress) {
      const match = envContent.match(/NEXT_PUBLIC_UNIVERSAL_REWARD_ADDRESS=(.+)/);
      const address = match ? match[1].trim() : '';
      
      if (address && address.startsWith('0x') && address.length === 42) {
        console.log(`✅ Environment variables configured: ${address}`);
        results.push({ test: 'Environment Variables', passed: true, details: `Address: ${address}` });
      } else {
        console.log('❌ Invalid contract address in environment variables');
        results.push({ test: 'Environment Variables', passed: false, details: 'Invalid address' });
        allPassed = false;
      }
    } else {
      console.log('❌ Universal reward address not found in environment variables');
      results.push({ test: 'Environment Variables', passed: false, details: 'Address not found' });
      allPassed = false;
    }
  } else {
    console.log('❌ Environment file not found');
    results.push({ test: 'Environment Variables', passed: false, details: 'File not found' });
    allPassed = false;
  }

  // 测试 7: 检查部署信息
  console.log('\n📋 Test 7: Deployment Information');
  console.log('----------------------------------');
  
  const deploymentPath = 'deployment.json';
  if (fs.existsSync(deploymentPath)) {
    try {
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      const hasUniversalReward = deployment.localhost?.contracts?.EverEchoUniversalReward;
      
      if (hasUniversalReward) {
        console.log(`✅ Deployment information updated: ${hasUniversalReward.address}`);
        results.push({ test: 'Deployment Info', passed: true, details: `Address: ${hasUniversalReward.address}` });
      } else {
        console.log('❌ Universal reward contract not found in deployment info');
        results.push({ test: 'Deployment Info', passed: false, details: 'Contract not found' });
        allPassed = false;
      }
    } catch (error) {
      console.log('❌ Deployment file is invalid JSON');
      results.push({ test: 'Deployment Info', passed: false, details: 'Invalid JSON' });
      allPassed = false;
    }
  } else {
    console.log('❌ Deployment file not found');
    results.push({ test: 'Deployment Info', passed: false, details: 'File not found' });
    allPassed = false;
  }

  // 测试 8: 检查 Button 组件修复
  console.log('\n📋 Test 8: Button Component Fix');
  console.log('--------------------------------');
  
  const buttonPath = 'frontend/src/components/ui/Button.tsx';
  if (fs.existsSync(buttonPath)) {
    const buttonContent = fs.readFileSync(buttonPath, 'utf8');
    const hasOutlineVariant = buttonContent.includes("'outline'");
    
    if (hasOutlineVariant) {
      console.log('✅ Button component supports outline variant');
      results.push({ test: 'Button Component', passed: true, details: 'Outline variant added' });
    } else {
      console.log('❌ Button component missing outline variant');
      results.push({ test: 'Button Component', passed: false, details: 'Missing outline variant' });
      allPassed = false;
    }
  } else {
    console.log('❌ Button component not found');
    results.push({ test: 'Button Component', passed: false, details: 'File not found' });
    allPassed = false;
  }

  // 打印总结
  console.log('\n📊 Verification Summary');
  console.log('=======================');
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.details}`);
  });

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  console.log(`\nResults: ${passedCount}/${totalCount} tests passed`);
  
  if (allPassed) {
    console.log('\n🎉 All verification tests passed!');
    console.log('Cross-chain reward system is ready for testing.');
    console.log('\nNext steps:');
    console.log('1. Start local blockchain: npm run dev:blockchain');
    console.log('2. Start frontend: npm run dev:frontend');
    console.log('3. Connect MetaMask and test the functionality');
  } else {
    console.log('\n⚠️  Some verification tests failed.');
    console.log('Please review the failed tests and fix the issues.');
  }

  return allPassed;
}

if (require.main === module) {
  verifyCrossChainRewardFix().catch(console.error);
}

export { verifyCrossChainRewardFix };