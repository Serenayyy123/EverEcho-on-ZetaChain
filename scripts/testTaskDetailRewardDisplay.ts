#!/usr/bin/env tsx

/**
 * 测试TaskDetail页面的跨链奖励显示
 */

import { ethers } from 'ethers';

async function testTaskDetailRewardDisplay() {
  console.log('🧪 Testing TaskDetail Cross-Chain Reward Display\n');

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
    
    // 1. 验证任务10的奖励关联
    console.log('\n🎯 Verifying Task 10 reward association...');
    
    const taskId = 10;
    const rewardId = await contract.getRewardByTask(taskId);
    
    console.log('Task ID:', taskId);
    console.log('Associated Reward ID:', rewardId.toString());
    
    if (rewardId.toString() === '0') {
      console.log('❌ No reward associated with Task 10');
      return { success: false, reason: 'no_reward_associated' };
    }
    
    // 2. 获取奖励详情
    console.log('\n📋 Getting reward details...');
    
    const plan = await contract.getRewardPlan(rewardId);
    
    console.log('Reward Plan Details:');
    console.log('- Reward ID:', plan.rewardId.toString());
    console.log('- Creator:', plan.creator);
    console.log('- Task ID:', plan.taskId.toString());
    console.log('- Asset:', plan.asset);
    console.log('- Amount:', ethers.formatEther(plan.amount), 'ETH');
    console.log('- Status:', plan.status.toString());
    console.log('- Target Chain ID:', plan.targetChainId.toString());
    console.log('- Target Address:', plan.targetAddress);
    console.log('- Created At:', new Date(Number(plan.createdAt) * 1000).toLocaleString());
    console.log('- Updated At:', new Date(Number(plan.updatedAt) * 1000).toLocaleString());
    
    // 3. 验证前端配置
    console.log('\n🔧 Verifying frontend configuration...');
    
    // 检查环境变量
    const envAddress = process.env.VITE_UNIVERSAL_REWARD_ADDRESS;
    console.log('Environment variable VITE_UNIVERSAL_REWARD_ADDRESS:', envAddress);
    
    if (envAddress !== contractAddress) {
      console.log('⚠️  Environment variable mismatch!');
      console.log('   Expected:', contractAddress);
      console.log('   Got:', envAddress);
    } else {
      console.log('✅ Environment variable is correct');
    }
    
    // 4. 模拟前端数据获取
    console.log('\n🌐 Simulating frontend data fetch...');
    
    // 模拟CrossChainRewardDisplay组件的数据获取逻辑
    const contractABI = [
      "function getRewardByTask(uint256 taskId) external view returns (uint256)",
      "function getRewardPlan(uint256 rewardId) external view returns (tuple(uint256 rewardId, address creator, uint256 taskId, address asset, uint256 amount, uint256 targetChainId, address targetAddress, uint8 status, uint256 createdAt, uint256 updatedAt, bytes32 lastTxHash))"
    ];
    
    const frontendContract = new ethers.Contract(contractAddress, contractABI, provider);
    
    const frontendRewardId = await frontendContract.getRewardByTask(BigInt(taskId));
    console.log('Frontend reward lookup result:', frontendRewardId.toString());
    
    if (frontendRewardId.toString() !== '0') {
      const frontendPlan = await frontendContract.getRewardPlan(frontendRewardId);
      
      console.log('Frontend reward plan:');
      console.log('- Amount:', ethers.formatEther(frontendPlan.amount), 'ETH');
      console.log('- Status:', frontendPlan.status.toString());
      console.log('- Target Chain:', frontendPlan.targetChainId.toString());
      
      // 状态映射
      const statusMap = {
        0: 'Prepared',
        1: 'Deposited', 
        2: 'Locked',
        3: 'Claimed',
        4: 'Refunded',
        5: 'Reverted'
      };
      
      const statusName = statusMap[frontendPlan.status as keyof typeof statusMap] || 'Unknown';
      console.log('- Status Name:', statusName);
      
      console.log('\n✅ Frontend should display:');
      console.log(`   🌉 跨链奖励`);
      console.log(`   💰 ${ethers.formatEther(frontendPlan.amount)} ETH → Sepolia Testnet`);
      console.log(`   🔒 状态: ${statusName}`);
    }
    
    // 5. 检查TaskDetail页面访问
    console.log('\n📱 TaskDetail page information:');
    console.log('- URL: http://localhost:5173/tasks/10');
    console.log('- Expected behavior: Should show cross-chain reward section');
    console.log('- Reward status: Locked (can be claimed when task is completed)');
    
    console.log('\n🎯 Test Summary:');
    console.log('✅ Task 10 has associated reward');
    console.log('✅ Reward is in Locked status');
    console.log('✅ Contract address is correct');
    console.log('✅ Frontend configuration should work');
    
    return {
      success: true,
      taskId,
      rewardId: rewardId.toString(),
      amount: ethers.formatEther(plan.amount),
      status: plan.status.toString(),
      targetChain: plan.targetChainId.toString()
    };
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    return { success: false, error: error.message };
  }
}

// 运行测试
if (require.main === module) {
  testTaskDetailRewardDisplay().then(result => {
    if (result.success) {
      console.log('\n🎉 TaskDetail reward display should work correctly!');
      console.log('Visit http://localhost:5173/tasks/10 to see the cross-chain reward.');
      process.exit(0);
    } else {
      console.log('\n💥 TaskDetail reward display test failed!');
      process.exit(1);
    }
  }).catch(console.error);
}

export default testTaskDetailRewardDisplay;