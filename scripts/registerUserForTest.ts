#!/usr/bin/env tsx

/**
 * 为测试账户注册用户
 */

import { ethers } from 'hardhat';

async function registerUserForTest() {
  console.log('📝 Registering user for testing...');

  const [deployer] = await ethers.getSigners();
  console.log('📋 Account:', deployer.address);

  const registerAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

  try {
    // 获取Register合约
    const registerABI = [
      "function register(string calldata _profileURI) external",
      "function isRegistered(address user) external view returns (bool)",
      "function profileURI(address user) external view returns (string)"
    ];

    const register = new ethers.Contract(registerAddress, registerABI, deployer);

    // 检查是否已注册
    const isRegistered = await register.isRegistered(deployer.address);
    console.log('📋 Is already registered:', isRegistered);

    if (!isRegistered) {
      console.log('📝 Registering user...');
      
      const testProfileURI = 'ipfs://QmTestProfileURI123456789';
      const registerTx = await register.register(testProfileURI);
      console.log('📝 Registration transaction sent:', registerTx.hash);
      await registerTx.wait();
      console.log('✅ Registration completed');

      // 验证注册
      const isNowRegistered = await register.isRegistered(deployer.address);
      console.log('📋 Registration verified:', isNowRegistered);

      if (isNowRegistered) {
        const profileURI = await register.profileURI(deployer.address);
        console.log('📋 Profile URI:', profileURI);
      }
    } else {
      console.log('✅ User already registered');
      
      try {
        const profileURI = await register.profileURI(deployer.address);
        console.log('📋 Existing profile URI:', profileURI);
      } catch (err) {
        console.log('⚠️ Could not get profile details');
      }
    }

    return true;

  } catch (error) {
    console.error('❌ Registration failed:', error);
    return false;
  }
}

if (require.main === module) {
  registerUserForTest()
    .then((success) => {
      if (success) {
        console.log('🎉 User registration completed successfully!');
      } else {
        console.log('❌ User registration failed');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { registerUserForTest };