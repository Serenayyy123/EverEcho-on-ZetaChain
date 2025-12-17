#!/usr/bin/env tsx

/**
 * 调试合约地址 - 检查部署的合约是否正确
 */

import { ethers } from 'hardhat';

async function debugContractAddress() {
  console.log('🔍 Debugging Contract Address...');

  const [deployer] = await ethers.getSigners();
  console.log('📋 Account:', deployer.address);

  const taskEscrowAddress = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';

  try {
    // 1. 检查地址是否有代码
    const code = await deployer.provider.getCode(taskEscrowAddress);
    console.log('📋 Contract code length:', code.length);
    console.log('📋 Has code:', code !== '0x');

    if (code === '0x') {
      console.log('❌ No contract deployed at this address');
      return;
    }

    // 2. 尝试调用基本函数
    const basicABI = [
      "function taskCounter() external view returns (uint256)"
    ];

    const contract = new ethers.Contract(taskEscrowAddress, basicABI, deployer);
    
    try {
      const taskCounter = await contract.taskCounter();
      console.log('✅ taskCounter:', taskCounter.toString());
    } catch (error) {
      console.log('❌ taskCounter call failed:', error.message);
    }

    // 3. 尝试调用新函数
    const enhancedABI = [
      "function getUniversalRewardAddress() public view returns (address)"
    ];

    const enhancedContract = new ethers.Contract(taskEscrowAddress, enhancedABI, deployer);
    
    try {
      const universalRewardAddress = await enhancedContract.getUniversalRewardAddress();
      console.log('✅ universalRewardAddress:', universalRewardAddress);
    } catch (error) {
      console.log('❌ getUniversalRewardAddress call failed:', error.message);
      console.log('🔍 This suggests the contract doesn\'t have the Method 4 enhancements');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

if (require.main === module) {
  debugContractAddress()
    .then(() => {
      console.log('\n🔍 Debug completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { debugContractAddress };