/**
 * 测试创建任务的逻辑
 * 模拟后端 POST /api/task 的 taskId 计算
 */

import { ethers } from 'ethers';
import { getCurrentChainId } from '../src/config/chainConfig';
import * as dotenv from 'dotenv';

dotenv.config();

async function testCreateTaskLogic() {
  console.log('='.repeat(60));
  console.log('🧪 Test Create Task Logic');
  console.log('='.repeat(60));

  try {
    const RPC_URL = process.env.RPC_URL;
    const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS;
    const CURRENT_CHAIN_ID = getCurrentChainId();
    
    console.log('\n📋 Backend Configuration:');
    console.log(`  RPC_URL: ${RPC_URL}`);
    console.log(`  TASK_ESCROW_ADDRESS: ${TASK_ESCROW_ADDRESS}`);
    console.log(`  CURRENT_CHAIN_ID: ${CURRENT_CHAIN_ID}`);

    // 模拟后端逻辑
    console.log('\n🔄 Simulating backend POST /api/task logic...');
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      TASK_ESCROW_ADDRESS!,
      ['function taskCounter() view returns (uint256)'],
      provider
    );
    
    const taskCounter = await contract.taskCounter();
    const nextTaskId = (Number(taskCounter) + 1).toString();
    
    console.log(`  📊 Chain taskCounter: ${taskCounter}`);
    console.log(`  📊 Backend calculates nextTaskId: ${nextTaskId}`);
    console.log(`  📊 Backend will try to create Task ${nextTaskId}`);

    // 检查这个 taskId 是否已经存在
    console.log('\n🔍 Checking if this taskId already exists on chain...');
    
    const TASK_ABI = [
      'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
    ];
    
    const taskContract = new ethers.Contract(
      TASK_ESCROW_ADDRESS!,
      TASK_ABI,
      provider
    );
    
    try {
      const task = await taskContract.tasks(nextTaskId);
      const [, creator] = task;
      
      if (creator !== ethers.ZeroAddress) {
        console.log(`  ❌ Task ${nextTaskId} ALREADY EXISTS on chain!`);
        console.log(`     Creator: ${creator}`);
        console.log('\n  🚨 PROBLEM:');
        console.log(`     Backend thinks it should create Task ${nextTaskId}`);
        console.log(`     But Task ${nextTaskId} already exists`);
        console.log(`     This will cause a conflict!`);
      } else {
        console.log(`  ✅ Task ${nextTaskId} does NOT exist yet (good)`);
        console.log(`     Backend can safely create Task ${nextTaskId}`);
      }
    } catch (error: any) {
      console.log(`  ✅ Task ${nextTaskId} does NOT exist yet (good)`);
    }

    // 分析
    console.log('\n📊 Summary:');
    console.log(`  Chain taskCounter: ${taskCounter}`);
    console.log(`  Backend next taskId: ${nextTaskId}`);
    
    if (Number(taskCounter) === Number(nextTaskId)) {
      console.log('\n  ❌ LOGIC ERROR:');
      console.log('     Backend is using taskCounter + 1');
      console.log('     But if taskCounter = 3, next should be 4');
      console.log('     Something is wrong with the calculation');
    } else {
      console.log('\n  ✅ Logic seems correct');
      console.log('     Backend correctly calculates: taskCounter + 1');
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test Complete');
  console.log('='.repeat(60));
}

testCreateTaskLogic();
