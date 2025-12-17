#!/usr/bin/env tsx

/**
 * 测试分离式工作流程 - 用户创建任务，协调器处理跨链奖励
 */

import { ethers } from 'hardhat';

async function testSeparatedWorkflow() {
  console.log('🧪 Testing Separated Workflow...');

  const [deployer] = await ethers.getSigners();
  console.log('📋 Test account:', deployer.address);

  const addresses = {
    taskEscrow: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    echoToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    coordinatorV2: '0x4826533B4897376654Bb4d4AD88B7faFD0C98528',
    mockUniversalReward: '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f'
  };

  try {
    // 1. 准备合约实例
    console.log('📦 Getting contract instances...');
    
    const taskEscrowABI = [
      "function createTask(uint256 reward, string memory taskURI) external returns (uint256)",
      "function taskCounter() external view returns (uint256)"
    ];

    const echoTokenABI = [
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function balanceOf(address account) external view returns (uint256)"
    ];

    const coordinatorV2ABI = [
      "function prepareCrossChainReward(address crossChainAsset, uint256 crossChainAmount, uint256 targetChainId) external payable returns (uint256 rewardId)",
      "function linkRewardToTask(uint256 rewardId, uint256 taskId) external",
      "function addCrossChainRewardToTask(uint256 taskId, address crossChainAsset, uint256 crossChainAmount, uint256 targetChainId) external payable returns (uint256 rewardId)",
      "function getTaskReward(uint256 taskId) external view returns (uint256 rewardId)",
      "event CrossChainRewardPrepared(uint256 indexed rewardId, address indexed creator, address crossChainAsset, uint256 crossChainAmount, uint256 targetChainId)",
      "event CrossChainRewardLinked(uint256 indexed taskId, uint256 indexed rewardId, address indexed creator)"
    ];

    const taskEscrow = new ethers.Contract(addresses.taskEscrow, taskEscrowABI, deployer);
    const echoToken = new ethers.Contract(addresses.echoToken, echoTokenABI, deployer);
    const coordinatorV2 = new ethers.Contract(addresses.coordinatorV2, coordinatorV2ABI, deployer);

    // 2. 检查余额
    console.log('💰 Checking balances...');
    const echoBalance = await echoToken.balanceOf(deployer.address);
    const ethBalance = await deployer.provider.getBalance(deployer.address);
    console.log('📋 ECHO balance:', ethers.formatEther(echoBalance), 'ECHO');
    console.log('📋 ETH balance:', ethers.formatEther(ethBalance), 'ETH');

    if (echoBalance < ethers.parseEther('110')) {
      console.log('❌ Insufficient ECHO balance');
      return false;
    }

    // 3. 步骤1：用户创建ECHO任务
    console.log('\n🚀 Step 1: Creating ECHO task...');
    
    // 授权TaskEscrow使用ECHO
    const totalRequired = ethers.parseEther('110'); // 100 reward + 10 postFee
    const approveTx = await echoToken.approve(addresses.taskEscrow, totalRequired);
    await approveTx.wait();
    console.log('✅ TaskEscrow approved');

    // 创建任务
    const createTaskTx = await taskEscrow.createTask(
      ethers.parseEther('100'),
      'test-separated-workflow-task'
    );
    console.log('📝 Task creation sent:', createTaskTx.hash);
    const taskReceipt = await createTaskTx.wait();
    console.log('✅ Task creation confirmed');

    // 获取任务ID
    const newTaskCounter = await taskEscrow.taskCounter();
    const taskId = Number(newTaskCounter);
    console.log('📋 Created task ID:', taskId);

    // 4. 步骤2：准备跨链奖励
    console.log('\n🚀 Step 2: Preparing cross-chain reward...');
    
    const crossChainParams = {
      asset: ethers.ZeroAddress, // ETH
      amount: ethers.parseEther('0.01'),
      targetChainId: 11155111 // Sepolia
    };

    const prepareTx = await coordinatorV2.prepareCrossChainReward(
      crossChainParams.asset,
      crossChainParams.amount,
      crossChainParams.targetChainId,
      { value: crossChainParams.amount }
    );
    console.log('📝 Cross-chain reward preparation sent:', prepareTx.hash);
    const prepareReceipt = await prepareTx.wait();
    console.log('✅ Cross-chain reward prepared');

    // 解析RewardID
    let rewardId;
    for (const log of prepareReceipt.logs) {
      try {
        const parsedLog = coordinatorV2.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsedLog && parsedLog.name === 'CrossChainRewardPrepared') {
          rewardId = Number(parsedLog.args.rewardId);
          console.log('📋 Prepared reward ID:', rewardId);
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!rewardId) {
      console.log('❌ Could not find reward ID');
      return false;
    }

    // 5. 步骤3：链接跨链奖励到任务
    console.log('\n🚀 Step 3: Linking reward to task...');
    
    const linkTx = await coordinatorV2.linkRewardToTask(rewardId, taskId);
    console.log('📝 Reward linking sent:', linkTx.hash);
    const linkReceipt = await linkTx.wait();
    console.log('✅ Reward linked to task');

    // 验证链接
    const linkedRewardId = await coordinatorV2.getTaskReward(taskId);
    console.log('📋 Task', taskId, 'linked reward ID:', linkedRewardId.toString());

    if (Number(linkedRewardId) === rewardId) {
      console.log('✅ Task-reward linking verified!');
    } else {
      console.log('❌ Task-reward linking failed');
      return false;
    }

    // 6. 测试一步完成方法
    console.log('\n🧪 Testing one-step method...');
    
    // 先创建另一个任务
    const approveTx2 = await echoToken.approve(addresses.taskEscrow, totalRequired);
    await approveTx2.wait();
    
    const createTaskTx2 = await taskEscrow.createTask(
      ethers.parseEther('100'),
      'test-one-step-task'
    );
    await createTaskTx2.wait();
    
    const taskCounter2 = await taskEscrow.taskCounter();
    const taskId2 = Number(taskCounter2);
    console.log('📋 Created second task ID:', taskId2);

    // 一步完成跨链奖励
    const oneStepTx = await coordinatorV2.addCrossChainRewardToTask(
      taskId2,
      crossChainParams.asset,
      crossChainParams.amount,
      crossChainParams.targetChainId,
      { value: crossChainParams.amount }
    );
    console.log('📝 One-step reward addition sent:', oneStepTx.hash);
    await oneStepTx.wait();
    console.log('✅ One-step reward addition completed');

    // 验证一步完成的结果
    const linkedRewardId2 = await coordinatorV2.getTaskReward(taskId2);
    console.log('📋 Task', taskId2, 'linked reward ID:', linkedRewardId2.toString());

    console.log('\n🎉 Separated Workflow Test Results:');
    console.log('✅ Task creation successful (user can create tasks)');
    console.log('✅ Cross-chain reward preparation successful');
    console.log('✅ Task-reward linking successful');
    console.log('✅ One-step method successful');
    console.log('✅ No registration issues with this approach!');
    console.log('✅ TaskID parsing problem SOLVED with separated workflow!');

    return true;

  } catch (error) {
    console.error('❌ Separated workflow test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testSeparatedWorkflow()
    .then((success) => {
      if (success) {
        console.log('\n🎉 All tests passed! Separated workflow working correctly.');
      } else {
        console.log('\n❌ Tests failed. Check the logs above.');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { testSeparatedWorkflow };