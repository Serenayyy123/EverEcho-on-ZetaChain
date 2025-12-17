#!/usr/bin/env tsx

/**
 * 测试新的测试合约是否在前端配置中正常工作
 */

import { ethers } from 'ethers';
import TestRewardABI from '../frontend/src/contracts/TestReward.json';

async function testNewContract() {
  console.log('🧪 Testing new contract integration...\n');

  try {
    // 连接到本地网络
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const signer = await provider.getSigner(0);
    
    // 从环境变量获取合约地址
    const contractAddress = '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6';
    
    console.log('Contract address:', contractAddress);
    console.log('Signer:', await signer.getAddress());
    
    // 创建合约实例
    const contract = new ethers.Contract(contractAddress, TestRewardABI.abi, signer);
    
    // 测试基本功能
    console.log('\n📊 Testing basic functions...');
    
    // 1. 检查 nextRewardId
    const nextId = await contract.nextRewardId();
    console.log('✅ Next reward ID:', nextId.toString());
    
    // 2. 测试 preparePlan
    const asset = '0x0000000000000000000000000000000000000000';
    const amount = ethers.parseEther('0.01');
    const targetChainId = 11155111;
    
    console.log('\n🚀 Testing preparePlan...');
    console.log('Parameters:', {
      asset,
      amount: ethers.formatEther(amount) + ' ETH',
      targetChainId
    });
    
    // 估算 gas
    const gasEstimate = await contract.preparePlan.estimateGas(asset, amount, targetChainId);
    console.log('✅ Gas estimate:', gasEstimate.toString());
    
    // 执行交易
    const tx = await contract.preparePlan(asset, amount, targetChainId);
    console.log('✅ Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    // 解析事件
    const events = receipt.logs.map((log: any) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    console.log('📋 Events:');
    events.forEach((event: any) => {
      console.log(`- ${event.name}:`, {
        rewardId: event.args.rewardId?.toString(),
        creator: event.args.creator,
        asset: event.args.asset,
        amount: ethers.formatEther(event.args.amount || 0) + ' ETH'
      });
    });
    
    // 验证奖励计划
    const rewardId = events[0]?.args?.rewardId;
    if (rewardId) {
      console.log('\n🔍 Verifying reward plan...');
      const plan = await contract.getRewardPlan(rewardId);
      console.log('✅ Reward plan:', {
        rewardId: plan.rewardId.toString(),
        creator: plan.creator,
        asset: plan.asset,
        amount: ethers.formatEther(plan.amount) + ' ETH',
        targetChainId: plan.targetChainId.toString()
      });
    }
    
    console.log('\n🎉 All tests passed! The new contract is working correctly.');
    console.log('\n📱 Frontend should now work with:');
    console.log('- Contract address:', contractAddress);
    console.log('- ABI: TestReward.json');
    console.log('- Environment variable: VITE_UNIVERSAL_REWARD_ADDRESS');
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testNewContract().catch(console.error);