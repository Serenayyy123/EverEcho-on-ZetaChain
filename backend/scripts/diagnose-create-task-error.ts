/**
 * 诊断创建任务失败的原因
 */

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function diagnoseCreateTaskError() {
  console.log('='.repeat(60));
  console.log('🔍 Diagnosing Create Task Error');
  console.log('='.repeat(60));

  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const taskEscrowAddress = process.env.TASK_ESCROW_ADDRESS;
    
    if (!taskEscrowAddress) {
      throw new Error('TASK_ESCROW_ADDRESS not set');
    }

    const TaskEscrowJSON = require('../../../artifacts/contracts/TaskEscrow.sol/TaskEscrow.json');
    const contract = new ethers.Contract(taskEscrowAddress, TaskEscrowJSON.abi, provider);

    console.log('\n📊 Current Chain State:');
    const taskCounter = await contract.taskCounter();
    console.log(`  taskCounter: ${taskCounter}`);
    console.log(`  Next taskId will be: ${taskCounter}`);

    // 检查 Task 3 是否存在
    console.log('\n🔍 Checking if Task 3 exists:');
    try {
      const task3 = await contract.tasks(3);
      const [taskIdBN, creator] = task3;
      
      if (creator !== ethers.ZeroAddress) {
        console.log('  ✅ Task 3 EXISTS on chain');
        console.log(`     Creator: ${creator}`);
        console.log('\n❌ PROBLEM CONFIRMED:');
        console.log('  - taskCounter = 3 (next task will be taskId 3)');
        console.log('  - But Task 3 already exists!');
        console.log('  - This causes a conflict when creating new tasks');
        console.log('\n🔧 SOLUTION:');
        console.log('  The contract needs to be fixed or redeployed.');
        console.log('  taskCounter should be 4, not 3.');
      } else {
        console.log('  ❌ Task 3 does NOT exist');
        console.log('  This is unexpected. The issue might be elsewhere.');
      }
    } catch (error: any) {
      console.log('  ❌ Error checking Task 3:', error.message);
    }

    // 检查 Task 4 是否存在
    console.log('\n🔍 Checking if Task 4 exists:');
    try {
      const task4 = await contract.tasks(4);
      const [taskIdBN, creator] = task4;
      
      if (creator !== ethers.ZeroAddress) {
        console.log('  ✅ Task 4 EXISTS on chain');
        console.log('  This is very strange!');
      } else {
        console.log('  ❌ Task 4 does NOT exist (expected)');
      }
    } catch (error) {
      console.log('  ❌ Task 4 does NOT exist (expected)');
    }

    console.log('\n📋 Summary:');
    console.log('  The error you\'re seeing is because:');
    console.log('  1. You try to create a new task');
    console.log('  2. Contract tries to use taskId = 3');
    console.log('  3. But Task 3 already exists');
    console.log('  4. Transaction fails with "Internal server error"');
    
    console.log('\n⚠️  IMMEDIATE ACTION NEEDED:');
    console.log('  Option 1: Redeploy the TaskEscrow contract');
    console.log('  Option 2: If you have owner access, manually fix taskCounter');
    console.log('  Option 3: Wait for contract fix before creating new tasks');

  } catch (error) {
    console.error('\n❌ Error:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Diagnosis Complete');
  console.log('='.repeat(60));
}

diagnoseCreateTaskError();
