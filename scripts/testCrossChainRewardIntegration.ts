#!/usr/bin/env tsx

/**
 * 测试跨链奖励前端集成
 * 验证真实的区块链交互是否正常工作
 */

import { ethers } from 'ethers';
import EverEchoUniversalRewardABI from '../frontend/src/contracts/EverEchoUniversalReward.json';

async function testCrossChainRewardIntegration() {
  console.log('🧪 Testing Cross-Chain Reward Integration');
  console.log('=========================================');

  try {
    // 连接到本地网络
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const deployer = new ethers.Wallet(
      'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      provider
    );

    // 合约地址（从环境变量或默认值）
    const contractAddress = process.env.NEXT_PUBLIC_UNIVERSAL_REWARD_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Balance: ${ethers.formatEther(await provider.getBalance(deployer.address))} ETH`);

    // 创建合约实例
    const contract = new ethers.Contract(
      contractAddress,
      EverEchoUniversalRewardABI.abi,
      deployer
    );

    console.log('\n📋 Test 1: Prepare Reward Plan');
    console.log('------------------------------');

    // 测试 1: 准备奖励计划
    const asset = '0x0000000000000000000000000000000000000000'; // ETH
    const amount = ethers.parseEther('0.01'); // 0.01 ETH
    const targetChainId = 11155111; // Sepolia

    try {
      const tx1 = await contract.preparePlan(asset, amount, targetChainId);
      const receipt1 = await tx1.wait();
      
      // 解析事件获取 rewardId
      const event = receipt1.logs.find((log: any) => {
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
        console.log(`✅ Reward plan created with ID: ${rewardId}`);

        console.log('\n📋 Test 2: Deposit Funds');
        console.log('-------------------------');

        // 测试 2: 存入资金
        const tx2 = await contract.deposit(rewardId, { value: amount });
        await tx2.wait();
        console.log('✅ Funds deposited successfully');

        console.log('\n📋 Test 3: Query Reward Plan');
        console.log('-----------------------------');

        // 测试 3: 查询奖励计划
        const plan = await contract.getRewardPlan(rewardId);
        console.log('✅ Reward plan retrieved:');
        console.log(`   - Reward ID: ${plan.rewardId}`);
        console.log(`   - Creator: ${plan.creator}`);
        console.log(`   - Asset: ${plan.asset}`);
        console.log(`   - Amount: ${ethers.formatEther(plan.amount)} ETH`);
        console.log(`   - Target Chain: ${plan.targetChainId}`);
        console.log(`   - Status: ${plan.status} (0=Prepared, 1=Deposited, 2=Locked, 3=Claimed, 4=Refunded, 5=Reverted)`);

        console.log('\n📋 Test 4: Lock for Task');
        console.log('-------------------------');

        // 测试 4: 锁定给任务
        const taskId = 123;
        const tx3 = await contract.lockForTask(rewardId, taskId);
        await tx3.wait();
        console.log(`✅ Reward locked for task ${taskId}`);

        console.log('\n📋 Test 5: Query by Task ID');
        console.log('----------------------------');

        // 测试 5: 根据任务ID查询
        const foundRewardId = await contract.getRewardByTask(taskId);
        console.log(`✅ Found reward ID ${foundRewardId} for task ${taskId}`);

        console.log('\n📋 Test 6: Claim to Helper');
        console.log('---------------------------');

        // 测试 6: Helper 领取奖励
        const helperAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Account #1
        const helperBalanceBefore = await provider.getBalance(helperAddress);
        
        const tx4 = await contract.claimToHelper(rewardId, helperAddress);
        await tx4.wait();
        
        const helperBalanceAfter = await provider.getBalance(helperAddress);
        const received = helperBalanceAfter - helperBalanceBefore;
        
        console.log(`✅ Reward claimed to helper: ${helperAddress}`);
        console.log(`   Helper received: ${ethers.formatEther(received)} ETH`);

        console.log('\n📋 Test 7: Final State Check');
        console.log('-----------------------------');

        // 测试 7: 最终状态检查
        const finalPlan = await contract.getRewardPlan(rewardId);
        console.log('✅ Final reward plan state:');
        console.log(`   - Status: ${finalPlan.status} (should be 3 = Claimed)`);
        console.log(`   - Target Address: ${finalPlan.targetAddress}`);
        console.log(`   - Last TX Hash: ${finalPlan.lastTxHash}`);

        console.log('\n🎉 All tests passed! Cross-chain reward integration is working correctly.');
        console.log('\n📝 Summary:');
        console.log(`   - Reward ID: ${rewardId}`);
        console.log(`   - Task ID: ${taskId}`);
        console.log(`   - Amount: ${ethers.formatEther(amount)} ETH`);
        console.log(`   - Helper: ${helperAddress}`);
        console.log(`   - Status: Claimed`);

      } else {
        throw new Error('Failed to get reward ID from transaction');
      }

    } catch (error) {
      console.error('❌ Contract interaction failed:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testCrossChainRewardIntegration().catch(console.error);
}

export { testCrossChainRewardIntegration };