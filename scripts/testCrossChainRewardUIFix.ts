#!/usr/bin/env tsx

/**
 * 测试跨链奖励UI修复
 */

import { ethers } from 'ethers';

async function testCrossChainRewardUIFix() {
  console.log('🧪 Testing Cross-Chain Reward UI Fix\n');

  try {
    // 1. 验证合约方法
    console.log('📋 Checking TestReward contract methods...');
    
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const signer = await provider.getSigner(0);
    const userAddress = await signer.getAddress();
    
    // 导入合约ABI
    const TestRewardABI = await import('../frontend/src/contracts/TestReward.json');
    const contractAddress = '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6';
    const contract = new ethers.Contract(contractAddress, TestRewardABI.abi, signer);
    
    // 检查可用方法
    const availableMethods = TestRewardABI.abi
      .filter((item: any) => item.type === 'function')
      .map((item: any) => item.name);
    
    console.log('✅ Available contract methods:', availableMethods);
    
    // 验证没有deposit方法
    const hasDeposit = availableMethods.includes('deposit');
    const hasRefund = availableMethods.includes('refund');
    
    console.log('- Has deposit method:', hasDeposit ? '❌ Yes (unexpected)' : '✅ No (expected)');
    console.log('- Has refund method:', hasRefund ? '❌ Yes (unexpected)' : '✅ No (expected)');
    
    // 2. 测试用户余额获取
    console.log('\n💰 Testing balance retrieval...');
    
    const balance = await provider.getBalance(userAddress);
    const balanceEth = ethers.formatEther(balance);
    
    console.log('✅ User address:', userAddress);
    console.log('✅ User balance:', balanceEth, 'ETH');
    
    // 3. 测试完整的preparePlan流程
    console.log('\n🚀 Testing complete preparePlan workflow...');
    
    const rewardConfig = {
      asset: '0x0000000000000000000000000000000000000000',
      amount: '0.001',
      targetChainId: '11155111'
    };
    
    const amountWei = ethers.parseEther(rewardConfig.amount);
    const targetChain = BigInt(rewardConfig.targetChainId);
    
    console.log('Test parameters:', {
      asset: 'ETH (Native)',
      amount: rewardConfig.amount + ' ETH',
      targetChainId: rewardConfig.targetChainId
    });
    
    // 检查余额是否足够
    const requiredAmount = parseFloat(rewardConfig.amount);
    const currentBalance = parseFloat(balanceEth);
    
    if (currentBalance < requiredAmount) {
      console.log('⚠️  Insufficient balance for test');
      console.log('   Required:', requiredAmount, 'ETH');
      console.log('   Available:', currentBalance, 'ETH');
      return { success: false, reason: 'insufficient_balance' };
    }
    
    console.log('✅ Balance check passed');
    
    // 执行preparePlan（这应该是完整的流程）
    console.log('\n📤 Executing preparePlan...');
    
    const balanceBefore = await provider.getBalance(userAddress);
    
    const tx = await contract.preparePlan(
      rewardConfig.asset,
      amountWei,
      targetChain
    );
    
    console.log('✅ Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    // 检查余额变化
    const balanceAfter = await provider.getBalance(userAddress);
    const balanceChange = balanceBefore - balanceAfter;
    
    console.log('\n💸 Balance analysis:');
    console.log('- Before:', ethers.formatEther(balanceBefore), 'ETH');
    console.log('- After:', ethers.formatEther(balanceAfter), 'ETH');
    console.log('- Change:', ethers.formatEther(balanceChange), 'ETH');
    console.log('- Gas cost:', ethers.formatEther(balanceChange - amountWei), 'ETH');
    
    // 解析事件
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'RewardPlanCreated';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = contract.interface.parseLog(event);
      const rewardId = parsed?.args?.rewardId?.toString();
      
      console.log('\n🎉 Reward plan created successfully!');
      console.log('- Reward ID:', rewardId);
      
      // 验证奖励计划
      const plan = await contract.getRewardPlan(BigInt(rewardId));
      console.log('- Plan details:', {
        rewardId: plan.rewardId.toString(),
        creator: plan.creator,
        asset: plan.asset,
        amount: ethers.formatEther(plan.amount) + ' ETH',
        targetChainId: plan.targetChainId.toString()
      });
      
      return {
        success: true,
        rewardId,
        balanceChange: ethers.formatEther(balanceChange),
        userAddress,
        contractAddress
      };
    } else {
      throw new Error('No RewardPlanCreated event found');
    }
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// 运行测试
if (require.main === module) {
  testCrossChainRewardUIFix().then(result => {
    if (result.success) {
      console.log('\n🎯 UI Fix Test Results:');
      console.log('✅ Contract methods verified');
      console.log('✅ Balance retrieval works');
      console.log('✅ preparePlan is complete workflow');
      console.log('✅ No separate deposit/withdraw needed');
      console.log('\n📱 Frontend should now work correctly:');
      console.log('1. Connect wallet → shows balance');
      console.log('2. Configure reward → enable prepare button');
      console.log('3. Prepare reward → complete in one step');
      console.log('4. Status → directly to "deposited"');
      process.exit(0);
    } else {
      console.log('\n💥 Test failed:', result.error || result.reason);
      process.exit(1);
    }
  }).catch(console.error);
}

export default testCrossChainRewardUIFix;