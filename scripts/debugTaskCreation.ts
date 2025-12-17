#!/usr/bin/env tsx

/**
 * 调试任务创建问题
 */

import { ethers } from 'hardhat';

async function debugTaskCreation() {
  console.log('🔍 Debugging Task Creation...');

  const [deployer] = await ethers.getSigners();
  
  const addresses = {
    taskEscrow: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    echoToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    coordinator: '0x4A679253410272dd5232B3Ff7cF5dbB88f295319'
  };

  try {
    // 1. 测试直接调用TaskEscrow.createTask
    console.log('📦 Testing direct TaskEscrow.createTask...');
    
    const taskEscrowABI = [
      "function createTask(uint256 reward, string memory taskURI) external returns (uint256)",
      "function taskCounter() external view returns (uint256)"
    ];

    const echoTokenABI = [
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function balanceOf(address account) external view returns (uint256)"
    ];

    const taskEscrow = new ethers.Contract(addresses.taskEscrow, taskEscrowABI, deployer);
    const echoToken = new ethers.Contract(addresses.echoToken, echoTokenABI, deployer);

    // 检查当前任务计数器
    const currentTaskCounter = await taskEscrow.taskCounter();
    console.log('📋 Current task counter:', currentTaskCounter.toString());

    // 检查ECHO余额和授权
    const echoBalance = await echoToken.balanceOf(deployer.address);
    console.log('📋 ECHO balance:', ethers.formatEther(echoBalance), 'ECHO');

    // 授权TaskEscrow使用ECHO
    const testAmount = ethers.parseEther('110'); // 100 reward + 10 postFee
    console.log('🔐 Approving TaskEscrow to use ECHO...');
    const approveTx = await echoToken.approve(addresses.taskEscrow, testAmount);
    await approveTx.wait();
    console.log('✅ Approval completed');

    // 尝试直接创建任务
    console.log('🚀 Attempting direct task creation...');
    try {
      const createTaskTx = await taskEscrow.createTask(
        ethers.parseEther('100'),
        'test-direct-task-uri'
      );
      console.log('📝 Direct task creation sent:', createTaskTx.hash);
      const receipt = await createTaskTx.wait();
      console.log('✅ Direct task creation successful');
      
      // 检查新的任务计数器
      const newTaskCounter = await taskEscrow.taskCounter();
      console.log('📋 New task counter:', newTaskCounter.toString());
      
    } catch (directError) {
      console.log('❌ Direct task creation failed:', directError.message);
      return false;
    }

    // 2. 测试协调器调用
    console.log('\n📦 Testing coordinator task creation...');
    
    // 重新授权给协调器
    console.log('🔐 Approving coordinator to use ECHO...');
    const coordinatorApproveTx = await echoToken.approve(addresses.coordinator, testAmount);
    await coordinatorApproveTx.wait();
    console.log('✅ Coordinator approval completed');

    // 测试协调器的简单任务创建功能
    const coordinatorABI = [
      "function createEchoTask(uint256 echoReward, string memory taskURI) external returns (uint256 taskId)"
    ];

    const coordinator = new ethers.Contract(addresses.coordinator, coordinatorABI, deployer);

    try {
      console.log('🚀 Testing coordinator createEchoTask...');
      const coordinatorTaskTx = await coordinator.createEchoTask(
        ethers.parseEther('100'),
        'test-coordinator-task-uri'
      );
      console.log('📝 Coordinator task creation sent:', coordinatorTaskTx.hash);
      const receipt = await coordinatorTaskTx.wait();
      console.log('✅ Coordinator task creation successful');
      
      // 检查最终任务计数器
      const finalTaskCounter = await taskEscrow.taskCounter();
      console.log('📋 Final task counter:', finalTaskCounter.toString());
      
    } catch (coordinatorError) {
      console.log('❌ Coordinator task creation failed:', coordinatorError.message);
      return false;
    }

    return true;

  } catch (error) {
    console.error('❌ Debug failed:', error);
    return false;
  }
}

if (require.main === module) {
  debugTaskCreation()
    .then((success) => {
      if (success) {
        console.log('🎉 Task creation debug completed successfully!');
      } else {
        console.log('❌ Task creation debug failed');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { debugTaskCreation };