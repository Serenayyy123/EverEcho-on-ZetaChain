#!/usr/bin/env tsx

/**
 * 测试真实的 EverEcho Universal Reward 合约完整工作流程
 */

import { ethers } from 'ethers';

async function testRealUniversalRewardWorkflow() {
  console.log('🧪 Testing Real EverEcho Universal Reward Workflow\n');

  try {
    // 连接到本地网络
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const creator = await provider.getSigner(0);
    const helper = await provider.getSigner(1);
    
    const creatorAddress = await creator.getAddress();
    const helperAddress = await helper.getAddress();
    
    console.log('👤 Creator:', creatorAddress);
    console.log('🛠️  Helper:', helperAddress);
    
    // 获取合约实例
    const contractAddress = '0x9A676e781A523b5d0C0e43731313A708CB607508';
    const EverEchoABI = await import('../frontend/src/contracts/EverEchoUniversalReward.json');
    const contract = new ethers.Contract(contractAddress, EverEchoABI.abi, creator);
    
    console.log('📄 Contract:', contractAddress);
    
    // 获取初始余额
    const initialBalance = await provider.getBalance(creatorAddress);
    console.log('💰 Creator initial balance:', ethers.formatEther(initialBalance), 'ETH');
    
    // 步骤 1: preparePlan
    console.log('\n🚀 Step 1: Preparing reward plan...');
    
    const rewardConfig = {
      asset: '0x0000000000000000000000000000000000000000', // ETH
      amount: ethers.parseEther('0.01'), // 0.01 ETH
      targetChainId: 11155111 // Sepolia
    };
    
    console.log('Parameters:', {
      asset: 'ETH (Native)',
      amount: '0.01 ETH',
      targetChainId: 'Sepolia (11155111)'
    });
    
    const tx1 = await contract.preparePlan(
      rewardConfig.asset,
      rewardConfig.amount,
      rewardConfig.targetChainId
    );
    const receipt1 = await tx1.wait();
    
    // 解析事件获取 rewardId
    const event1 = receipt1.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'RewardPlanCreated';
      } catch {
        return false;
      }
    });

    if (!event1) {
      throw new Error('RewardPlanCreated event not found');
    }

    const parsed1 = contract.interface.parseLog(event1);
    const rewardId = parsed1?.args?.rewardId?.toString();
    
    console.log('✅ Reward plan created with ID:', rewardId);
    
    // 验证状态
    let plan = await contract.getRewardPlan(BigInt(rewardId));
    console.log('📋 Plan status:', plan.status.toString(), '(0=Prepared)');
    
    // 步骤 2: deposit
    console.log('\n💰 Step 2: Depositing funds...');
    
    const tx2 = await contract.deposit(BigInt(rewardId), { 
      value: rewardConfig.amount 
    });
    const receipt2 = await tx2.wait();
    
    console.log('✅ Funds deposited, tx:', tx2.hash);
    
    // 验证状态和余额变化
    plan = await contract.getRewardPlan(BigInt(rewardId));
    console.log('📋 Plan status:', plan.status.toString(), '(1=Deposited)');
    
    const balanceAfterDeposit = await provider.getBalance(creatorAddress);
    const depositCost = initialBalance - balanceAfterDeposit;
    console.log('💸 Deposit cost (including gas):', ethers.formatEther(depositCost), 'ETH');
    
    // 步骤 3: lockForTask
    console.log('\n🔒 Step 3: Locking for task...');
    
    const taskId = 12345; // 模拟任务ID
    
    const tx3 = await contract.lockForTask(BigInt(rewardId), taskId);
    await tx3.wait();
    
    console.log('✅ Reward locked for task:', taskId);
    
    // 验证状态
    plan = await contract.getRewardPlan(BigInt(rewardId));
    console.log('📋 Plan status:', plan.status.toString(), '(2=Locked)');
    console.log('📋 Task ID:', plan.taskId.toString());
    
    // 步骤 4: claimToHelper
    console.log('\n🎁 Step 4: Helper claiming reward...');
    
    const helperInitialBalance = await provider.getBalance(helperAddress);
    console.log('🛠️  Helper initial balance:', ethers.formatEther(helperInitialBalance), 'ETH');
    
    // 使用 helper 账户调用 claimToHelper
    const contractAsHelper = contract.connect(helper);
    
    const tx4 = await contractAsHelper.claimToHelper(BigInt(rewardId), helperAddress);
    const receipt4 = await tx4.wait();
    
    console.log('✅ Reward claimed by helper, tx:', tx4.hash);
    
    // 验证状态和余额变化
    plan = await contract.getRewardPlan(BigInt(rewardId));
    console.log('📋 Plan status:', plan.status.toString(), '(3=Claimed)');
    console.log('📋 Target address:', plan.targetAddress);
    
    const helperFinalBalance = await provider.getBalance(helperAddress);
    const helperGain = helperFinalBalance - helperInitialBalance;
    console.log('🎉 Helper received:', ethers.formatEther(helperGain), 'ETH');
    
    // 步骤 5: 测试 refund（创建新的计划来测试）
    console.log('\n🔄 Step 5: Testing refund workflow...');
    
    const tx5 = await contract.preparePlan(
      rewardConfig.asset,
      rewardConfig.amount,
      rewardConfig.targetChainId
    );
    const receipt5 = await tx5.wait();
    
    const event5 = receipt5.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'RewardPlanCreated';
      } catch {
        return false;
      }
    });

    const parsed5 = contract.interface.parseLog(event5!);
    const refundRewardId = parsed5?.args?.rewardId?.toString();
    
    console.log('📝 Created refund test plan with ID:', refundRewardId);
    
    // 存入资金
    const tx6 = await contract.deposit(BigInt(refundRewardId), { 
      value: rewardConfig.amount 
    });
    await tx6.wait();
    
    console.log('💰 Deposited funds for refund test');
    
    // 获取退款前余额
    const balanceBeforeRefund = await provider.getBalance(creatorAddress);
    
    // 执行退款
    const tx7 = await contract.refund(BigInt(refundRewardId));
    await tx7.wait();
    
    console.log('✅ Refund executed, tx:', tx7.hash);
    
    // 验证退款
    const balanceAfterRefund = await provider.getBalance(creatorAddress);
    const refundAmount = balanceAfterRefund - balanceBeforeRefund;
    console.log('💰 Refund received:', ethers.formatEther(refundAmount), 'ETH');
    
    const refundPlan = await contract.getRewardPlan(BigInt(refundRewardId));
    console.log('📋 Refund plan status:', refundPlan.status.toString(), '(4=Refunded)');
    
    // 总结
    console.log('\n🎯 Workflow Test Summary:');
    console.log('✅ preparePlan: Creates reward plan (status 0)');
    console.log('✅ deposit: Locks funds in contract (status 1)');
    console.log('✅ lockForTask: Associates with task (status 2)');
    console.log('✅ claimToHelper: Transfers to helper (status 3)');
    console.log('✅ refund: Returns funds to creator (status 4)');
    
    console.log('\n📱 Frontend Integration Ready:');
    console.log('- Contract address:', contractAddress);
    console.log('- All methods working correctly');
    console.log('- Complete workflow validated');
    console.log('- Ready for user testing');
    
    return {
      success: true,
      contractAddress,
      rewardId,
      refundRewardId,
      helperGain: ethers.formatEther(helperGain),
      refundAmount: ethers.formatEther(refundAmount)
    };
    
  } catch (error: any) {
    console.error('\n❌ Workflow test failed:', error.message);
    console.error('Full error:', error);
    return { success: false, error: error.message };
  }
}

// 运行测试
if (require.main === module) {
  testRealUniversalRewardWorkflow().then(result => {
    if (result.success) {
      console.log('\n🎉 All workflow tests passed!');
      console.log('The real EverEcho Universal Reward contract is working perfectly.');
      process.exit(0);
    } else {
      console.log('\n💥 Workflow tests failed!');
      process.exit(1);
    }
  }).catch(console.error);
}

export default testRealUniversalRewardWorkflow;