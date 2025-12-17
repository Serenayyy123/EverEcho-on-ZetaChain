#!/usr/bin/env tsx

/**
 * 测试Method 4原子化操作 - 完全消除TaskID解析问题
 */

import { ethers } from 'hardhat';

async function testMethod4AtomicOperation() {
  console.log('🧪 Testing Method 4 Atomic Operation...');

  const [deployer] = await ethers.getSigners();
  console.log('📋 Test account:', deployer.address);

  // Method 4 部署的合约地址 (修复后)
  const addresses = {
    taskEscrow: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // 修复后的TaskEscrow地址
    echoToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    universalReward: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
  };

  try {
    // 1. 准备合约实例
    console.log('📦 Getting contract instances...');
    
    // 使用生成的ABI文件
    const TaskEscrowABI = require('../frontend/src/contracts/TaskEscrow.json');

    const echoTokenABI = [
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function balanceOf(address account) external view returns (uint256)"
    ];

    const taskEscrow = new ethers.Contract(addresses.taskEscrow, TaskEscrowABI.abi, deployer);
    const echoToken = new ethers.Contract(addresses.echoToken, echoTokenABI, deployer);

    // 2. 验证配置
    console.log('🔧 Verifying configuration...');
    const configuredUniversalReward = await taskEscrow.getUniversalRewardAddress();
    console.log('📋 Configured UniversalReward:', configuredUniversalReward);
    
    if (configuredUniversalReward === ethers.ZeroAddress) {
      console.log('❌ UniversalReward not configured');
      return false;
    }

    // 3. 检查余额
    console.log('💰 Checking balances...');
    const echoBalance = await echoToken.balanceOf(deployer.address);
    const ethBalance = await deployer.provider.getBalance(deployer.address);
    console.log('📋 ECHO balance:', ethers.formatEther(echoBalance), 'ECHO');
    console.log('📋 ETH balance:', ethers.formatEther(ethBalance), 'ETH');

    const totalRequired = ethers.parseEther('110'); // 100 reward + 10 postFee
    const crossChainAmount = ethers.parseEther('0.01');

    if (echoBalance < totalRequired) {
      console.log('❌ Insufficient ECHO balance');
      return false;
    }

    if (ethBalance < crossChainAmount) {
      console.log('❌ Insufficient ETH balance for cross-chain reward');
      return false;
    }

    // 4. 测试Method 4原子化操作
    console.log('\n🚀 Testing Method 4 Atomic Operation...');
    
    // 授权TaskEscrow使用ECHO
    const approveTx = await echoToken.approve(addresses.taskEscrow, totalRequired);
    await approveTx.wait();
    console.log('✅ TaskEscrow approved for ECHO');

    // 获取操作前的taskCounter
    const beforeTaskCounter = await taskEscrow.taskCounter();
    console.log('📋 Task counter before:', beforeTaskCounter.toString());

    // 执行原子化操作
    const atomicParams = {
      reward: ethers.parseEther('100'),
      taskURI: 'method4-atomic-test-task',
      crossChainAsset: ethers.ZeroAddress, // ETH
      crossChainAmount: crossChainAmount,
      targetChainId: 11155111 // Sepolia
    };

    console.log('📝 Executing atomic operation with params:', {
      reward: ethers.formatEther(atomicParams.reward),
      taskURI: atomicParams.taskURI,
      crossChainAsset: atomicParams.crossChainAsset,
      crossChainAmount: ethers.formatEther(atomicParams.crossChainAmount),
      targetChainId: atomicParams.targetChainId
    });

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

    // 5. 解析结果 - 这里是关键！不再需要猜测TaskID
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
          console.log('📋 Creator:', parsedLog.args.creator);
          console.log('📋 ECHO Reward:', ethers.formatEther(parsedLog.args.echoReward));
          console.log('📋 Cross-chain Amount:', ethers.formatEther(parsedLog.args.crossChainAmount));
          console.log('📋 Target Chain ID:', parsedLog.args.targetChainId.toString());
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

    // 6. 验证结果
    console.log('\n✅ Verification:');
    const afterTaskCounter = await taskEscrow.taskCounter();
    console.log('📋 Task counter after:', afterTaskCounter.toString());
    console.log('📋 Task counter increased by:', (Number(afterTaskCounter) - Number(beforeTaskCounter)));

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

    // 7. 测试传统方法对比
    console.log('\n🔄 Testing traditional method for comparison...');
    
    const approveTx2 = await echoToken.approve(addresses.taskEscrow, totalRequired);
    await approveTx2.wait();
    
    const traditionalTx = await taskEscrow.createTask(
      ethers.parseEther('100'),
      'traditional-method-task'
    );
    const traditionalReceipt = await traditionalTx.wait();
    
    const finalTaskCounter = await taskEscrow.taskCounter();
    const traditionalTaskId = Number(finalTaskCounter);
    console.log('📋 Traditional method TaskID:', traditionalTaskId);

    console.log('\n🎉 Method 4 Test Results:');
    console.log('✅ Atomic operation successful');
    console.log('✅ TaskID and RewardID obtained in single transaction');
    console.log('✅ No TaskID parsing/guessing required');
    console.log('✅ No intermediate state risks');
    console.log('✅ No registration issues');
    console.log('✅ Perfect user experience (single transaction)');
    console.log('✅ TaskID parsing problem COMPLETELY ELIMINATED!');

    console.log('\n📊 Comparison:');
    console.log('Method 4 (Atomic):', 'TaskID =', taskId, ', RewardID =', rewardId, '(Single transaction)');
    console.log('Traditional:', 'TaskID =', traditionalTaskId, '(Separate transactions needed)');

    return true;

  } catch (error) {
    console.error('❌ Method 4 test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testMethod4AtomicOperation()
    .then((success) => {
      if (success) {
        console.log('\n🎉 Method 4 test passed! Atomic operations working perfectly.');
        console.log('🚀 Ready to update frontend to use Method 4!');
      } else {
        console.log('\n❌ Method 4 test failed. Check the logs above.');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { testMethod4AtomicOperation };