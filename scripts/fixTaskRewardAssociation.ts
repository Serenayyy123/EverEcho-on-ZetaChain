#!/usr/bin/env tsx

/**
 * 修复任务和跨链奖励的关联问题
 * 手动将奖励ID 1关联到任务ID 10
 */

import { ethers } from 'ethers';

async function fixTaskRewardAssociation() {
  console.log('🔧 Fixing Task-Reward Association\n');

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
    
    // 检查奖励ID 1的状态
    console.log('\n🔍 Checking Reward ID 1...');
    const rewardId = 1;
    const plan = await contract.getRewardPlan(rewardId);
    
    console.log('Reward Details:');
    console.log('- Reward ID:', plan.rewardId.toString());
    console.log('- Creator:', plan.creator);
    console.log('- Current Task ID:', plan.taskId.toString());
    console.log('- Asset:', plan.asset);
    console.log('- Amount:', ethers.formatEther(plan.amount), 'ETH');
    console.log('- Status:', plan.status.toString());
    console.log('- Target Chain:', plan.targetChainId.toString());
    
    if (plan.status.toString() !== '1') {
      console.log('❌ Reward is not in Deposited status (status should be 1)');
      return;
    }
    
    if (plan.taskId.toString() !== '0') {
      console.log('❌ Reward is already associated with task:', plan.taskId.toString());
      return;
    }
    
    // 执行lockForTask
    console.log('\n🔒 Locking reward to Task ID 10...');
    const taskId = 10;
    
    const tx = await contract.lockForTask(BigInt(rewardId), taskId);
    console.log('📤 Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    // 验证结果
    console.log('\n✅ Verifying association...');
    
    const updatedPlan = await contract.getRewardPlan(rewardId);
    console.log('Updated Reward Details:');
    console.log('- Task ID:', updatedPlan.taskId.toString());
    console.log('- Status:', updatedPlan.status.toString(), '(2=Locked)');
    
    const associatedRewardId = await contract.getRewardByTask(taskId);
    console.log('Task', taskId, 'associated reward ID:', associatedRewardId.toString());
    
    if (associatedRewardId.toString() === rewardId.toString()) {
      console.log('\n🎉 SUCCESS! Task 10 is now associated with Reward 1');
      console.log('💡 You can now view the cross-chain reward in TaskDetail page');
    } else {
      console.log('\n❌ Association failed');
    }
    
    return {
      success: true,
      rewardId,
      taskId,
      associatedRewardId: associatedRewardId.toString()
    };
    
  } catch (error: any) {
    console.error('\n❌ Fix failed:', error.message);
    console.error('Full error:', error);
    return { success: false, error: error.message };
  }
}

// 运行修复
if (require.main === module) {
  fixTaskRewardAssociation().then(result => {
    if (result.success) {
      console.log('\n🎯 Fix completed successfully!');
      process.exit(0);
    } else {
      console.log('\n💥 Fix failed!');
      process.exit(1);
    }
  }).catch(console.error);
}

export default fixTaskRewardAssociation;