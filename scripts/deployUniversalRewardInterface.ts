#!/usr/bin/env tsx

/**
 * 部署UniversalRewardInterface - Method 4支持合约
 */

import { ethers } from 'hardhat';

async function deployUniversalRewardInterface() {
  console.log('🚀 Deploying UniversalRewardInterface...');

  const [deployer] = await ethers.getSigners();
  console.log('📋 Deploying with account:', deployer.address);

  try {
    // 部署UniversalRewardInterface
    console.log('📦 Deploying UniversalRewardInterface...');
    const UniversalRewardInterfaceFactory = await ethers.getContractFactory('UniversalRewardInterface');
    const universalRewardInterface = await UniversalRewardInterfaceFactory.deploy();
    await universalRewardInterface.waitForDeployment();
    const universalRewardInterfaceAddress = await universalRewardInterface.getAddress();
    console.log('✅ UniversalRewardInterface deployed at:', universalRewardInterfaceAddress);

    // 验证部署
    const rewardCounter = await universalRewardInterface.rewardCounter();
    console.log('📋 Initial reward counter:', rewardCounter.toString());

    console.log('\n🎉 UniversalRewardInterface Deployment Summary:');
    console.log('📋 UniversalRewardInterface:', universalRewardInterfaceAddress);
    console.log('✅ Ready for Method 4 integration!');

    return universalRewardInterfaceAddress;

  } catch (error) {
    console.error('❌ UniversalRewardInterface deployment failed:', error);
    throw error;
  }
}

if (require.main === module) {
  deployUniversalRewardInterface()
    .then((address) => {
      console.log('\n🎉 Deployment completed successfully!');
      console.log('UniversalRewardInterface address:', address);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { deployUniversalRewardInterface };