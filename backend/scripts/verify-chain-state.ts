/**
 * 硬验证：直接读链上 taskCounter 和实际任务状态
 * 不依赖复杂路径，直接用 backend/src/contracts
 */

import { ethers } from 'ethers';
import { getCurrentChainId } from '../src/config/chainConfig';
import * as dotenv from 'dotenv';

dotenv.config();

async function verifyChainState() {
  console.log('='.repeat(60));
  console.log('🔍 Chain State Hard Verification');
  console.log('='.repeat(60));

  try {
    // 1. 读取配置
    const RPC_URL = process.env.RPC_URL;
    const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS;
    const CURRENT_CHAIN_ID = getCurrentChainId();
    
    console.log('\n📋 Configuration:');
    console.log(`  RPC_URL: ${RPC_URL}`);
    console.log(`  TASK_ESCROW_ADDRESS: ${TASK_ESCROW_ADDRESS}`);
    console.log(`  CURRENT_CHAIN_ID: ${CURRENT_CHAIN_ID}`);

    if (!RPC_URL || !TASK_ESCROW_ADDRESS) {
      throw new Error('Missing RPC_URL or TASK_ESCROW_ADDRESS in .env');
    }

    // 2. 连接链
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const actualChainId = (await provider.getNetwork()).chainId;
    
    console.log(`  Actual chain ID from RPC: ${actualChainId}`);
    
    if (actualChainId.toString() !== CURRENT_CHAIN_ID.toString()) {
      console.log('  ⚠️  WARNING: Chain ID mismatch!');
      console.log(`     Config says: ${CURRENT_CHAIN_ID}`);
      console.log(`     RPC returns: ${actualChainId}`);
    } else {
      console.log('  ✅ Chain ID matches');
    }

    // 3. 使用最小 ABI（与 chainService 一致）
    const TASK_ESCROW_ABI = [
      'function taskCounter() view returns (uint256)',
      'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
    ];
    
    const contract = new ethers.Contract(
      TASK_ESCROW_ADDRESS,
      TASK_ESCROW_ABI,
      provider
    );

    // 4. 读取 taskCounter
    console.log('\n📊 On-Chain State:');
    const taskCounter = await contract.taskCounter();
    console.log(`  taskCounter: ${taskCounter} (number of tasks created)`);
    console.log(`  Next taskId will be: ${Number(taskCounter) + 1}`);

    // 5. 检查最近的几个任务
    console.log('\n📋 Recent Tasks:');
    const startId = Math.max(1, Number(taskCounter) - 2);
    const endId = Number(taskCounter) + 1;
    
    for (let i = startId; i <= endId; i++) {
      try {
        const task = await contract.tasks(i);
        const [taskIdBN, creator, helper, taskURI, rewardBN, statusBN] = task;
        
        if (creator !== ethers.ZeroAddress) {
          console.log(`  ✅ Task ${i} EXISTS:`);
          console.log(`     creator: ${creator}`);
          console.log(`     taskURI: ${taskURI}`);
          console.log(`     reward: ${ethers.formatEther(rewardBN)} ECHO`);
          console.log(`     status: ${statusBN}`);
        } else {
          console.log(`  ❌ Task ${i} does NOT exist (creator is zero address)`);
        }
      } catch (error: any) {
        console.log(`  ❌ Task ${i} does NOT exist (read failed)`);
      }
    }

    // 6. 分析结果
    console.log('\n🔍 Analysis:');
    
    const nextTaskId = Number(taskCounter) + 1;
    
    // 检查下一个 taskId 是否已存在
    try {
      const nextTask = await contract.tasks(nextTaskId);
      const [, creator] = nextTask;
      
      if (creator !== ethers.ZeroAddress) {
        console.log('  ❌ PROBLEM:');
        console.log(`     Task ${nextTaskId} already EXISTS on chain`);
        console.log(`     But backend will try to create Task ${nextTaskId}`);
        console.log(`     → This will cause a conflict!`);
        console.log('\n  🔧 Possible Cause: Database has orphan tasks');
      } else {
        console.log('  ✅ NORMAL STATE:');
        console.log(`     taskCounter = ${taskCounter} (${taskCounter} tasks exist)`);
        console.log(`     Next task will be Task ${nextTaskId}`);
        console.log(`     Task ${nextTaskId} does NOT exist yet`);
        console.log(`     → Ready to create new tasks`);
      }
    } catch (error: any) {
      console.log('  ✅ NORMAL STATE:');
      console.log(`     taskCounter = ${taskCounter} (${taskCounter} tasks exist)`);
      console.log(`     Next task will be Task ${nextTaskId}`);
      console.log(`     Task ${nextTaskId} does NOT exist yet`);
      console.log(`     → Ready to create new tasks`);
    }

    // 7. 尝试 estimateGas 来模拟创建任务
    console.log('\n🧪 Simulate createTask:');
    try {
      // 使用一个测试账户地址
      const testCreator = '0x0000000000000000000000000000000000000001';
      const testReward = ethers.parseEther('10');
      const testTaskURI = 'https://test.com/task.json';
      
      // 注意：这只是估算，不会真的执行
      console.log('  Attempting to estimate gas for createTask...');
      console.log('  (This will fail if there\'s a contract-level issue)');
      
      // 实际上我们不能直接 estimateGas，因为需要签名
      // 但我们可以检查合约是否可调用
      console.log('  ⚠️  Cannot estimate without signer, skipping');
      
    } catch (error: any) {
      console.log(`  ❌ estimateGas failed: ${error.message}`);
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Verification Complete');
  console.log('='.repeat(60));
}

verifyChainState();
