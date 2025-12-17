#!/usr/bin/env tsx

/**
 * 注册协调器地址以便它可以创建任务
 */

import { ethers } from 'hardhat';

async function registerCoordinator() {
  console.log('📝 Registering coordinator address...');

  const [deployer] = await ethers.getSigners();
  const coordinatorAddress = '0x4A679253410272dd5232B3Ff7cF5dbB88f295319';
  const registerAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

  try {
    // 获取Register合约
    const registerABI = [
      "function register(string calldata _profileURI) external",
      "function isRegistered(address user) external view returns (bool)",
      "function profileURI(address user) external view returns (string)"
    ];

    const register = new ethers.Contract(registerAddress, registerABI, deployer);

    // 检查协调器是否已注册
    const isRegistered = await register.isRegistered(coordinatorAddress);
    console.log('📋 Coordinator already registered:', isRegistered);

    if (!isRegistered) {
      console.log('📝 Registering coordinator...');
      
      // 我们需要从协调器地址本身调用注册
      // 但是我们没有协调器的私钥，所以这个方法不可行
      console.log('❌ Cannot register coordinator - we need its private key');
      console.log('💡 Alternative: We need to modify the approach');
      
      return false;
    } else {
      console.log('✅ Coordinator already registered');
      return true;
    }

  } catch (error) {
    console.error('❌ Registration failed:', error);
    return false;
  }
}

if (require.main === module) {
  registerCoordinator()
    .then((success) => {
      if (success) {
        console.log('🎉 Coordinator registration completed!');
      } else {
        console.log('❌ Coordinator registration failed');
        console.log('💡 We need to implement a different solution');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { registerCoordinator };