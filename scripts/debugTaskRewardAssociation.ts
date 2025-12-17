#!/usr/bin/env tsx

/**
 * 调试任务和跨链奖励的关联问题
 */

import { ethers } from 'ethers';

async function debugTaskRewardAssociation() {
  console.log('🔍 Debugging Task-Reward Association for Task ID 10\n');

  try {
    // 连接到本地网络
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const signer = await provider.getSigner(0);
    
    // 获取合约实例
    const contractAddress = '0x9A676e781A523b5d0C0e43731313A708CB607508';
    const EverEchoABI = await import('../frontend/src/contracts/EverEchoUniversalReward.json');
    const contract = new ethers.Contract(contractAddress, EverEchoABI.abi, signer);
    
    console.log('📄 Contract Address:', contractAddress);
    console.log('👤 User Address:', await signer.getAddress());
    
    // 1. 检查任务 ID 10 是否有关联的奖励
    console.log('\n🎯 Checking Task ID 10...');
    
    const taskId = 10;
    const rewardId = await contract.getRewardByTask(taskId);
    
    console.log('Task ID:', taskId);
    console.log('Associated Reward ID:', rewardId.toString());
    
    if (rewardId.toString() === '0') {
      console.log('❌ No reward associated with Task ID 10');
      
      // 检查所有奖励计划
      console.log('\n📋 Checking all reward plans...');
      
      const nextRewardId = await contract.nextRewardId();
      console.log('Next Reward ID:', nextRewardId.toString());
      
      for (let i = 1; i < nextRewardId; i++) {
        try {
          const plan = await contract.getRewardPlan(i);
          console.log(`\nReward ${i}:`);
          console.log('- Creator:', plan.creator);
          console.log('- Task ID:', plan.taskId.toString());
          console.log('- Asset:', plan.asset);
          console.log('- Amount:', ethers.formatEther(plan.amount), 'ETH');
          console.log('- Status:', plan.status.toString());
          console.log('- Target Chain:', plan.targetChainId.toString());
          
          if (plan.taskId.toString() === '0') {
            console.log('⚠️  This reward is not associated with any task yet!');
          }
        } catch (error) {
          console.log(`❌ Error reading reward ${i}:`, error.message);
        }
      }
    } else {
      console.log('✅ Found associated reward!');
      
      // 获取奖励详情
      const plan = await contract.getRewardPlan(rewardId);
      
      console.log('\n📋 Reward Details:');
      console.log('- Reward ID:', plan.rewardId.toString());
      console.log('- Creator:', plan.creator);
      console.log('- Task ID:', plan.taskId.toString());
      console.log('- Asset:', plan.asset);
      console.log('- Amount:', ethers.formatEther(plan.amount), 'ETH');
      console.log('- Status:', plan.status.toString());
      console.log('- Target Chain:', plan.targetChainId.toString());
      console.log('- Target Address:', plan.targetAddress);
      console.log('- Created At:', new Date(Number(plan.createdAt) * 1000).toLocaleString());
      console.log('- Updated At:', new Date(Number(plan.updatedAt) * 1000).toLocaleString());
    }
    
    // 2. 检查用户创建的所有奖励
    console.log('\n👤 Checking user\'s rewards...');
    
    const userAddress = await signer.getAddress();
    const userRewards = await contract.getRewardsByCreator(userAddress);
    
    console.log('User created rewards:', userRewards.map(id => id.toString()));
    
    // 3. 分析问题
    console.log('\n🔍 Problem Analysis:');
    
    if (rewardId.toString() === '0') {
      console.log('❌ ISSUE: Task ID 10 has no associated reward');
      console.log('💡 POSSIBLE CAUSES:');
      console.log('   1. Reward was created but not locked to the task');
      console.log('   2. Task publishing process didn\'t call lockForTask');
      console.log('   3. Wrong task ID was used during lockForTask');
      
      // 检查是否有未关联的奖励
      const nextRewardId = await contract.nextRewardId();
      let unassociatedRewards = [];
      
      for (let i = 1; i < nextRewardId; i++) {
        try {
          const plan = await contract.getRewardPlan(i);
          if (plan.taskId.toString() === '0' && plan.status.toString() === '1') { // Deposited but not locked
            unassociatedRewards.push({
              rewardId: i,
              amount: ethers.formatEther(plan.amount),
              status: plan.status.toString()
            });
          }
        } catch (error) {
          // Skip invalid rewards
        }
      }
      
      if (unassociatedRewards.length > 0) {
        console.log('\n🔧 SOLUTION: Found unassociated rewards that could be linked:');
        unassociatedRewards.forEach(reward => {
          console.log(`- Reward ${reward.rewardId}: ${reward.amount} ETH (Status: ${reward.status})`);
        });
        
        console.log('\n💡 To fix this, you can manually call:');
        console.log(`   contract.lockForTask(${unassociatedRewards[0]?.rewardId}, 10)`);
      }
    } else {
      console.log('✅ Task-Reward association is correct');
      console.log('💡 The issue might be in the frontend display logic');
    }
    
    return {
      taskId,
      rewardId: rewardId.toString(),
      hasReward: rewardId.toString() !== '0',
      userRewards: userRewards.map(id => id.toString())
    };
    
  } catch (error: any) {
    console.error('\n❌ Debug failed:', error.message);
    console.error('Full error:', error);
    return { error: error.message };
  }
}

// 运行调试
if (require.main === module) {
  debugTaskRewardAssociation().then(result => {
    console.log('\n🏁 Debug complete');
  }).catch(console.error);
}

export default debugTaskRewardAssociation;