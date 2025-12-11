/**
 * 列出链上所有任务
 */

import { ethers } from 'ethers';

const RPC_URL = process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/y7anxz3Urn0udDBD6u8TU';
const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS || '0xC71040C8916E145f937Da3D094323C8f136c2E2F';

const TASK_ESCROW_ABI = [
  'function taskCounter() view returns (uint256)',
  'function tasks(uint256) view returns (address creator, address helper, uint8 status, uint256 reward, string taskURI)',
];

async function listTasks() {
  try {
    console.log('\n📋 Listing all tasks from chain...\n');

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(TASK_ESCROW_ADDRESS, TASK_ESCROW_ABI, provider);

    // 获取任务总数
    const taskCounter = await contract.taskCounter();
    console.log(`Total tasks: ${taskCounter}\n`);

    // 列出所有任务
    for (let i = 1; i <= Number(taskCounter); i++) {
      try {
        const task = await contract.tasks(i);
        console.log(`Task ${i}:`);
        console.log(`  Creator: ${task.creator}`);
        console.log(`  Helper: ${task.helper}`);
        console.log(`  Status: ${task.status}`);
        console.log(`  Reward: ${ethers.formatEther(task.reward)} EOCHO`);
        console.log(`  TaskURI: ${task.taskURI}`);
        console.log('');
      } catch (error) {
        console.log(`Task ${i}: Error reading task`);
        console.log('');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

listTasks();
