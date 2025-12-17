#!/usr/bin/env tsx

/**
 * 诊断前端合约地址配置问题
 */

import { ethers } from 'ethers';

async function diagnoseFrontendContractIssue() {
  console.log('🔍 Diagnosing Frontend Contract Address Issue\n');

  try {
    // 1. 检查环境变量
    console.log('📋 Environment Variables:');
    console.log('- VITE_UNIVERSAL_REWARD_ADDRESS:', process.env.VITE_UNIVERSAL_REWARD_ADDRESS);
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    
    // 2. 检查当前部署的合约
    console.log('\n🔗 Checking deployed contracts...');
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    
    const correctAddress = '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6';
    const wrongAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    
    // 检查正确地址的合约
    console.log('\n✅ Checking correct contract address:', correctAddress);
    try {
      const correctCode = await provider.getCode(correctAddress);
      console.log('- Contract exists:', correctCode !== '0x');
      console.log('- Code length:', correctCode.length);
      
      if (correctCode !== '0x') {
        // 测试合约调用
        const TestRewardABI = await import('../frontend/src/contracts/TestReward.json');
        const contract = new ethers.Contract(correctAddress, TestRewardABI.abi, provider);
        const nextId = await contract.nextRewardId();
        console.log('- Next reward ID:', nextId.toString());
        console.log('- Contract is functional: ✅');
      }
    } catch (error: any) {
      console.log('- Error:', error.message);
    }
    
    // 检查错误地址的合约
    console.log('\n❌ Checking wrong contract address:', wrongAddress);
    try {
      const wrongCode = await provider.getCode(wrongAddress);
      console.log('- Contract exists:', wrongCode !== '0x');
      console.log('- Code length:', wrongCode.length);
      
      if (wrongCode !== '0x') {
        console.log('- This contract exists but may be outdated or broken');
      } else {
        console.log('- No contract deployed at this address');
      }
    } catch (error: any) {
      console.log('- Error:', error.message);
    }
    
    // 3. 模拟前端配置读取
    console.log('\n🎯 Simulating frontend config...');
    
    // 模拟 import.meta.env 行为
    const mockImportMetaEnv = {
      VITE_UNIVERSAL_REWARD_ADDRESS: process.env.VITE_UNIVERSAL_REWARD_ADDRESS
    };
    
    const CONTRACT_ADDRESSES = {
      localhost: {
        UNIVERSAL_REWARD: mockImportMetaEnv.VITE_UNIVERSAL_REWARD_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      }
    };
    
    console.log('- Simulated frontend config:');
    console.log('  - VITE_UNIVERSAL_REWARD_ADDRESS from env:', mockImportMetaEnv.VITE_UNIVERSAL_REWARD_ADDRESS);
    console.log('  - Final address used:', CONTRACT_ADDRESSES.localhost.UNIVERSAL_REWARD);
    
    // 4. 建议解决方案
    console.log('\n💡 Diagnosis Results:');
    
    if (CONTRACT_ADDRESSES.localhost.UNIVERSAL_REWARD === correctAddress) {
      console.log('✅ Frontend configuration should be correct');
      console.log('   The issue might be:');
      console.log('   - Frontend cache needs to be cleared');
      console.log('   - Browser cache needs to be refreshed');
      console.log('   - Development server needs to be restarted');
    } else {
      console.log('❌ Frontend configuration is incorrect');
      console.log('   Expected:', correctAddress);
      console.log('   Got:', CONTRACT_ADDRESSES.localhost.UNIVERSAL_REWARD);
      console.log('   Environment variable not being read properly');
    }
    
    console.log('\n🔧 Recommended Actions:');
    console.log('1. Restart the frontend development server');
    console.log('2. Clear browser cache and hard refresh (Ctrl+Shift+R)');
    console.log('3. Check if .env.local is in the frontend directory');
    console.log('4. Verify environment variable is loaded in browser dev tools');
    
    return {
      correctAddress,
      wrongAddress,
      envAddress: process.env.VITE_UNIVERSAL_REWARD_ADDRESS,
      configAddress: CONTRACT_ADDRESSES.localhost.UNIVERSAL_REWARD
    };
    
  } catch (error: any) {
    console.error('\n❌ Diagnosis failed:', error.message);
    return { error: error.message };
  }
}

// 运行诊断
if (require.main === module) {
  diagnoseFrontendContractIssue().then(result => {
    console.log('\n🏁 Diagnosis complete');
  }).catch(console.error);
}

export default diagnoseFrontendContractIssue;