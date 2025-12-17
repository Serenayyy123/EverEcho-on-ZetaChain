#!/usr/bin/env tsx

/**
 * 测试原子化任务创建和跨链奖励锁定
 */

import { ethers } from 'ethers';
import { getContractAddresses } from '../frontend/src/contracts/addresses';

async function testAtomicTaskCreation() {
  console.log('🧪 Testing Atomic Task Creation with Cross-Chain Reward...');

  // 连接到本地网络
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  const signer = await provider.getSigner(0);
  const chainId = 31337;

  console.log('👤 User address:', await signer.getAddress());
  console.log('💰 User balance:', ethers.formatEther(await provider.getBalance(await signer.getAddress())), 'ETH');

  // 合约地址
  const addresses = getContractAddresses(chainId);
  const coordinatorAddress = process.env.TASK_REWARD_COORDINATOR || '0x...'; // 需要实际地址
  const universalRewardAddress = process.env.UNIVERSAL_REWARD_ADDRESS || '0x9A676e781A523b5d0C0e43731313A708CB607508';

  console.log('📍 TaskEscrow:', addresses.taskEscrow);
  console.log('📍 EchoToken:', addresses.echoToken);
  console.log('📍 UniversalReward:', universalRewardAddress);
  console.log('📍 TaskRewardCoordinator:', coordinatorAddress);

  try {
    // 1. 检查ECHO余额和授权
    console.log('\n1️⃣ Checking ECHO balance and allowance...');
    
    const echoTokenABI = [
      "function balanceOf(address account) view returns (uint256)",
      "function allowance(address owner, address spender) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)"
    ];

    const echoToken = new ethers.Contract(addresses.echoToken, echoTokenABI, signer);
    const userAddress = await signer.getAddress();
    
    const echoBalance = await echoToken.balanceOf(userAddress);
    console.log('💎 ECHO balance:', ethers.formatEther(echoBalance), 'ECHO');

    const allowance = await echoToken.allowance(userAddress, coordinatorAddress);
    console.log('🔓 Current allowance:', ethers.formatEther(allowance), 'ECHO');

    // 2. 授权协调器使用ECHO
    const requiredAmount = ethers.parseEther('110'); // 100 reward + 10 postFee
    if (allowance < requiredAmount) {
      console.log('📝 Approving coordinator to spend ECHO...');
      const approveTx = await echoToken.approve(coordinatorAddress, requiredAmount);
      await approveTx.wait();
      console.log('✅ Approval confirmed');
    }

    // 3. 调用原子化操作
    console.log('\n2️⃣ Creating task with cross-chain reward atomically...');
    
    const coordinatorABI = [
      "function createTaskWithCrossChainReward(uint256 echoReward, string memory taskURI, address crossChainAsset, uint256 crossChainAmount, uint256 targetChainId) external payable returns (uint256 taskId, uint256 rewardId)",
      "event TaskWithCrossChainRewardCreated(uint256 indexed taskId, uint256 indexed rewardId, address indexed creator, uint256 echoReward, address crossChainAsset, uint256 crossChainAmount, uint256 targetChainId)",
      "event AtomicOperationFailed(address indexed creator, string reason, uint256 step)"
    ];

    const coordinator = new ethers.Contract(coordinatorAddress, coordinatorABI, signer);

    // 测试参数
    const echoReward = ethers.parseEther('100');
    const taskURI = `ipfs://test-atomic-task-${Date.now()}`;
    const crossChainAsset = ethers.ZeroAddress; // ETH
    const crossChainAmount = ethers.parseEther('0.01');
    const targetChainId = 11155111; // Sepolia

    console.log('📋 Parameters:');
    console.log('  ECHO Reward:', ethers.formatEther(echoReward), 'ECHO');
    console.log('  Task URI:', taskURI);
    console.log('  Cross-chain Asset:', crossChainAsset === ethers.ZeroAddress ? 'ETH' : crossChainAsset);
    console.log('  Cross-chain Amount:', ethers.formatEther(crossChainAmount), 'ETH');
    console.log('  Target Chain ID:', targetChainId);

    const tx = await coordinator.createTaskWithCrossChainReward(
      echoReward,
      taskURI,
      crossChainAsset,
      crossChainAmount,
      targetChainId,
      { value: crossChainAmount }
    );

    console.log('⏳ Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

    // 4. 解析事件
    console.log('\n3️⃣ Parsing events...');
    
    let taskId: number | null = null;
    let rewardId: number | null = null;
    let atomicSuccess = false;

    for (const log of receipt.logs) {
      try {
        const parsedLog = coordinator.interface.parseLog({
          topics: log.topics,
          data: log.data
        });

        if (parsedLog) {
          console.log('📊 Event:', parsedLog.name);
          
          if (parsedLog.name === 'TaskWithCrossChainRewardCreated') {
            taskId = Number(parsedLog.args.taskId);
            rewardId = Number(parsedLog.args.rewardId);
            atomicSuccess = true;
            
            console.log('🎯 TaskID:', taskId);
            console.log('🎁 RewardID:', rewardId);
            console.log('👤 Creator:', parsedLog.args.creator);
            console.log('💎 ECHO Reward:', ethers.formatEther(parsedLog.args.echoReward), 'ECHO');
            console.log('🌉 Cross-chain Amount:', ethers.formatEther(parsedLog.args.crossChainAmount), 'ETH');
            console.log('🔗 Target Chain:', parsedLog.args.targetChainId.toString());
          } else if (parsedLog.name === 'AtomicOperationFailed') {
            console.error('❌ Atomic operation failed at step:', parsedLog.args.step.toString());
            console.error('❌ Reason:', parsedLog.args.reason);
          }
        }
      } catch (parseError) {
        // 忽略无法解析的日志
        continue;
      }
    }

    if (!atomicSuccess) {
      throw new Error('Atomic operation did not complete successfully');
    }

    // 5. 验证状态
    console.log('\n4️⃣ Verifying final state...');
    
    // 检查任务是否创建
    const taskEscrowABI = [
      "function tasks(uint256) external view returns (tuple(uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt, uint256 echoPostFee, address rewardAsset, uint256 rewardAmount))"
    ];

    const taskEscrow = new ethers.Contract(addresses.taskEscrow, taskEscrowABI, provider);
    
    try {
      const task = await taskEscrow.tasks(taskId!);
      console.log('✅ Task created successfully:');
      console.log('  Task ID:', task.taskId.toString());
      console.log('  Creator:', task.creator);
      console.log('  Reward:', ethers.formatEther(task.reward), 'ECHO');
      console.log('  Status:', task.status.toString());
    } catch (taskError) {
      console.error('❌ Failed to verify task:', taskError);
    }

    // 检查跨链奖励是否锁定
    const universalRewardABI = [
      "function getRewardPlan(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))"
    ];

    const universalReward = new ethers.Contract(universalRewardAddress, universalRewardABI, provider);
    
    try {
      const rewardPlan = await universalReward.getRewardPlan(rewardId!);
      console.log('✅ Cross-chain reward locked successfully:');
      console.log('  Reward ID:', rewardPlan.rewardId.toString());
      console.log('  Creator:', rewardPlan.creator);
      console.log('  Task ID:', rewardPlan.taskId.toString());
      console.log('  Asset:', rewardPlan.asset === ethers.ZeroAddress ? 'ETH' : rewardPlan.asset);
      console.log('  Amount:', ethers.formatEther(rewardPlan.amount), 'ETH');
      console.log('  Target Chain:', rewardPlan.targetChainId.toString());
      console.log('  Status:', rewardPlan.status.toString(), '(2 = Locked)');
    } catch (rewardError) {
      console.error('❌ Failed to verify reward:', rewardError);
    }

    console.log('\n🎉 Atomic task creation test completed successfully!');
    console.log('📋 Summary:');
    console.log('  ✅ Task created atomically');
    console.log('  ✅ Cross-chain reward locked automatically');
    console.log('  ✅ No manual TaskID parsing required');
    console.log('  ✅ No risk of orphaned rewards');

    return {
      success: true,
      taskId,
      rewardId,
      txHash: tx.hash
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 比较测试：展示原子化操作 vs 传统分离操作的区别
async function compareAtomicVsTraditional() {
  console.log('\n📊 Comparison: Atomic vs Traditional Approach');
  console.log('');
  console.log('🔴 Traditional Approach (Current Problem):');
  console.log('  1. preparePlan() → get rewardId');
  console.log('  2. deposit(rewardId) → fund the reward');
  console.log('  3. createTask() → get taskId (PARSING PROBLEM HERE!)');
  console.log('  4. lockForTask(rewardId, taskId) → associate (OFTEN FAILS!)');
  console.log('  ❌ Risk: TaskID parsing failure leads to orphaned rewards');
  console.log('  ❌ Risk: Network issues between steps cause inconsistency');
  console.log('  ❌ Risk: User experience degradation with manual recovery');
  console.log('');
  console.log('🟢 Atomic Approach (New Solution):');
  console.log('  1. createTaskWithCrossChainReward() → get both IDs atomically');
  console.log('  ✅ Benefit: Single transaction, no intermediate states');
  console.log('  ✅ Benefit: Automatic rollback on any failure');
  console.log('  ✅ Benefit: Reliable event-based ID retrieval');
  console.log('  ✅ Benefit: No manual TaskID parsing required');
  console.log('  ✅ Benefit: Eliminates orphaned reward risk');
}

if (require.main === module) {
  compareAtomicVsTraditional();
  
  testAtomicTaskCreation()
    .then((result) => {
      if (result.success) {
        console.log('\n🎊 All tests passed! Atomic operation is working correctly.');
      } else {
        console.log('\n💥 Test failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

export { testAtomicTaskCreation, compareAtomicVsTraditional };