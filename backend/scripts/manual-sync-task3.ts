/**
 * 手动从链上同步 Task 3
 */

import { ethers } from 'ethers';
import { syncTaskWithLock } from '../src/services/taskSyncCoordinator';
import * as dotenv from 'dotenv';

dotenv.config();

async function manualSyncTask3() {
  console.log('='.repeat(60));
  console.log('🔄 Manually Syncing Task 3 from Chain');
  console.log('='.repeat(60));

  try {
    // 1. 连接到链
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const taskEscrowAddress = process.env.TASK_ESCROW_ADDRESS;
    
    if (!taskEscrowAddress) {
      throw new Error('TASK_ESCROW_ADDRESS not set');
    }

    const TaskEscrowJSON = require('../../artifacts/contracts/TaskEscrow.sol/TaskEscrow.json');
    const contract = new ethers.Contract(taskEscrowAddress, TaskEscrowJSON.abi, provider);

    // 2. 从链上读取 Task 3
    console.log('\n📡 Reading Task 3 from chain...');
    const taskOnChain = await contract.tasks(3);
    
    console.log('Raw task data:', taskOnChain);
    console.log('Task data length:', taskOnChain.length);
    
    // 解构任务数据
    const taskId = taskOnChain.taskId ? taskOnChain.taskId.toString() : taskOnChain[0].toString();
    const creator = taskOnChain.creator || taskOnChain[1];
    const helper = taskOnChain.helper || taskOnChain[2];
    const taskURI = taskOnChain.taskURI || taskOnChain[3];
    const reward = taskOnChain.reward ? ethers.formatEther(taskOnChain.reward) : ethers.formatEther(taskOnChain[4]);
    const status = taskOnChain.status ? taskOnChain.status.toString() : taskOnChain[5].toString();
    
    console.log('  taskId:', taskId);
    console.log('  creator:', creator);
    console.log('  helper:', helper);
    console.log('  taskURI:', taskURI);
    console.log('  reward:', reward, 'ECHO');
    console.log('  status:', status);

    // 3. 使用 taskSyncCoordinator 同步
    console.log('\n🔄 Syncing task using taskSyncCoordinator...');
    const success = await syncTaskWithLock({
      taskId,
      creator,
      helper: helper !== ethers.ZeroAddress ? helper : undefined,
      taskURI,
      source: 'manual'
    });

    if (success) {
      console.log('\n✅ Task 3 synced successfully!');
      console.log('\n📝 Note:');
      console.log('  The task metadata comes from taskURI:', taskURI);
      console.log('  If the title/description is still wrong, it means:');
      console.log('  1. The taskURI points to the old task data');
      console.log('  2. You need to update the task metadata manually');
    } else {
      console.log('\n❌ Failed to sync Task 3');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Sync Complete');
  console.log('='.repeat(60));
}

manualSyncTask3();
