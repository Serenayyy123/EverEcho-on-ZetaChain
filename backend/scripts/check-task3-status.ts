/**
 * 检查 task 3 的链上状态
 */

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载 backend/.env
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

const TASK_ESCROW_ABI = [
  'function tasks(uint256) view returns (address creator, address helper, uint8 status, uint256 reward, string taskURI)',
];

const STATUS_NAMES = ['Open', 'InProgress', 'Submitted', 'Completed', 'Cancelled'];

async function main() {
  const taskId = '3';
  const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
  const taskEscrowAddress = process.env.TASK_ESCROW_ADDRESS;
  
  if (!taskEscrowAddress) {
    throw new Error('TASK_ESCROW_ADDRESS not configured');
  }
  
  console.log('Checking task 3 on chain...\n');
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const taskEscrow = new ethers.Contract(taskEscrowAddress, TASK_ESCROW_ABI, provider);
  
  const task = await taskEscrow.tasks(taskId);
  const status = Number(task.status);
  
  console.log('Task 3 Details:');
  console.log('  Creator:', task.creator);
  console.log('  Helper:', task.helper);
  console.log('  Status:', status, `(${STATUS_NAMES[status] || 'Unknown'})`);
  console.log('  Reward:', ethers.formatEther(task.reward), 'EOCHO');
  console.log('  TaskURI:', task.taskURI);
  
  console.log('\n📊 Status Analysis:');
  if (status === 0) {
    console.log('  ✅ Task is Open - can be accepted by a helper');
  } else if (status === 1) {
    console.log('  ✅ Task is InProgress - helper can submit work');
  } else if (status === 2) {
    console.log('  ✅ Task is Submitted - creator can confirm completion');
  } else if (status === 3) {
    console.log('  ✅ Task is Completed - all done!');
  } else if (status === 4) {
    console.log('  ⚠️  Task is Cancelled');
  }
  
  console.log('\n💡 Recommendations:');
  if (status === 0) {
    console.log('  - Helper can accept this task');
  } else if (status === 1) {
    console.log('  - Helper can submit work');
  } else if (status === 2) {
    console.log('  - Creator can confirm completion');
  } else if (status === 3) {
    console.log('  - Task is already completed');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });
