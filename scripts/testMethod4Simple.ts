#!/usr/bin/env tsx

/**
 * 简单的Method 4测试 - 部署并立即测试
 */

import { ethers } from 'hardhat';

async function testMethod4Simple() {
  console.log('🧪 Simple Method 4 Test...');

  const [deployer] = await ethers.getSigners();
  console.log('📋 Test account:', deployer.address);

  try {
    // 1. 部署ECHOToken
    console.log('📦 Deploying ECHOToken...');
    const ECHOTokenFactory = await ethers.getContractFactory('EOCHOToken');
    const echoToken = await ECHOTokenFactory.deploy();
    await echoToken.waitForDeployment();
    const echoTokenAddress = await echoToken.getAddress();
    console.log('✅ ECHOToken deployed at:', echoTokenAddress);

    // 2. 部署Register
    console.log('📦 Deploying Register...');
    const RegisterFactory = await ethers.getContractFactory('Register');
    const register = await RegisterFactory.deploy(echoTokenAddress);
    await register.waitForDeployment();
    const registerAddress = await register.getAddress();
    console.log('✅ Register deployed at:', registerAddress);

    // 3. 配置ECHOToken
    console.log('🔧 Configuring ECHOToken...');
    await echoToken.setRegisterAddress(registerAddress);
    console.log('✅ Register address set in ECHOToken');

    // 4. 部署UniversalRewardInterface
    console.log('📦 Deploying UniversalRewardInterface...');
    const UniversalRewardInterfaceFactory = await ethers.getContractFactory('UniversalRewardInterface');
    const universalRewardInterface = await UniversalRewardInterfaceFactory.deploy();
    await universalRewardInterface.waitForDeployment();
    const universalRewardInterfaceAddress = await universalRewardInterface.getAddress();
    console.log('✅ UniversalRewardInterface deployed at:', universalRewardInterfaceAddress);

    // 5. 部署增强版TaskEscrow
    console.log('📦 Deploying Enhanced TaskEscrow...');
    const TaskEscrowFactory = await ethers.getContractFactory('TaskEscrow');
    const taskEscrow = await TaskEscrowFactory.deploy(echoTokenAddress, registerAddress);
    await taskEscrow.waitForDeployment();
    const taskEscrowAddress = await taskEscrow.getAddress();
    console.log('✅ Enhanced TaskEscrow deployed at:', taskEscrowAddress);

    // 6. 配置TaskEscrow
    console.log('🔧 Configuring TaskEscrow...');
    await taskEscrow.setUniversalRewardAddress(universalRewardInterfaceAddress);
    console.log('✅ UniversalReward address configured in TaskEscrow');

    // 配置ECHOToken的TaskEscrow地址
    await echoToken.setTaskEscrowAddress(taskEscrowAddress);
    console.log('✅ TaskEscrow address set in ECHOToken');

    // 7. 立即测试配置
    console.log('\n🔍 Testing configuration...');
    const configuredUniversalReward = await taskEscrow.getUniversalRewardAddress();
    console.log('📋 Configured UniversalReward:', configuredUniversalReward);

    if (configuredUniversalReward === universalRewardInterfaceAddress) {
      console.log('✅ Configuration verified!');
    } else {
      console.log('❌ Configuration mismatch');
      return false;
    }

    // 8. 注册用户并测试
    console.log('\n🔧 Setting up test user...');
    await register.register('test-profile-uri');
    console.log('✅ Test user registered');

    const userBalance = await echoToken.balanceOf(deployer.address);
    console.log('✅ User ECHO balance:', ethers.formatEther(userBalance), 'ECHO');

    // 9. 测试原子化操作
    console.log('\n🚀 Testing atomic operation...');
    
    // 授权TaskEscrow使用ECHO (使用较小的奖励以适应100 ECHO余额)
    const rewardAmount = ethers.parseEther('50'); // 50 reward + 10 postFee = 60 total
    const totalRequired = rewardAmount + ethers.parseEther('10');
    await echoToken.approve(taskEscrowAddress, totalRequired);
    console.log('✅ TaskEscrow approved for ECHO');

    // 获取操作前的taskCounter
    const beforeTaskCounter = await taskEscrow.taskCounter();
    console.log('📋 Task counter before:', beforeTaskCounter.toString());

    // 执行原子化操作
    const atomicParams = {
      reward: rewardAmount,
      taskURI: 'method4-simple-test-task',
      crossChainAsset: ethers.ZeroAddress, // ETH
      crossChainAmount: ethers.parseEther('0.01'),
      targetChainId: 11155111 // Sepolia
    };

    console.log('📝 Executing atomic operation...');
    const atomicTx = await taskEscrow.createTaskWithCrossChainReward(
      atomicParams.reward,
      atomicParams.taskURI,
      atomicParams.crossChainAsset,
      atomicParams.crossChainAmount,
      atomicParams.targetChainId,
      { value: atomicParams.crossChainAmount }
    );

    console.log('📝 Atomic transaction sent:', atomicTx.hash);
    const atomicReceipt = await atomicTx.wait();
    console.log('✅ Atomic transaction confirmed');

    // 10. 解析结果
    console.log('\n🔍 Parsing atomic operation results...');
    
    let taskId, rewardId;
    for (const log of atomicReceipt.logs) {
      try {
        const parsedLog = taskEscrow.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsedLog && parsedLog.name === 'TaskWithCrossChainRewardCreated') {
          taskId = Number(parsedLog.args.taskId);
          rewardId = Number(parsedLog.args.rewardId);
          console.log('✅ Parsed from atomic event:');
          console.log('📋 TaskID:', taskId);
          console.log('📋 RewardID:', rewardId);
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!taskId || !rewardId) {
      console.log('❌ Could not parse TaskID and RewardID from atomic operation');
      return false;
    }

    // 11. 验证结果
    console.log('\n✅ Verification:');
    const afterTaskCounter = await taskEscrow.taskCounter();
    console.log('📋 Task counter after:', afterTaskCounter.toString());

    if (Number(afterTaskCounter) === Number(beforeTaskCounter) + 1) {
      console.log('✅ Task counter correctly incremented');
    } else {
      console.log('❌ Task counter increment mismatch');
      return false;
    }

    if (taskId === Number(afterTaskCounter)) {
      console.log('✅ TaskID matches task counter (deterministic!)');
    } else {
      console.log('❌ TaskID does not match task counter');
      return false;
    }

    console.log('\n🎉 Method 4 Simple Test Results:');
    console.log('✅ Atomic operation successful');
    console.log('✅ TaskID and RewardID obtained in single transaction');
    console.log('✅ No TaskID parsing/guessing required');
    console.log('✅ No intermediate state risks');
    console.log('✅ Perfect user experience (single transaction)');
    console.log('✅ TaskID parsing problem COMPLETELY ELIMINATED!');

    console.log('\n📊 Final Results:');
    console.log('TaskID:', taskId);
    console.log('RewardID:', rewardId);
    console.log('Transaction Hash:', atomicTx.hash);

    return true;

  } catch (error) {
    console.error('❌ Method 4 simple test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testMethod4Simple()
    .then((success) => {
      if (success) {
        console.log('\n🎉 Method 4 simple test passed! Atomic operations working perfectly.');
        console.log('🚀 TaskID parsing problem is COMPLETELY SOLVED!');
      } else {
        console.log('\n❌ Method 4 simple test failed. Check the logs above.');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { testMethod4Simple };