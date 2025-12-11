import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkTask8OnChain() {
  console.log('=== Checking Task8 on Chain ===\n');

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(
    process.env.TASK_ESCROW_ADDRESS!,
    [
      'function taskCounter() view returns (uint256)',
      'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
    ],
    provider
  );

  // 1. 检查 taskCounter
  const taskCounter = await contract.taskCounter();
  console.log(`Task Counter: ${taskCounter}`);

  // 2. 检查 Task8
  if (Number(taskCounter) >= 8) {
    console.log('\n--- Task8 Data ---');
    const task8 = await contract.tasks(8);
    console.log('Task ID:', task8[0].toString());
    console.log('Creator:', task8[1]);
    console.log('Helper:', task8[2]);
    console.log('Reward:', ethers.formatEther(task8[3]), 'ECHO');
    console.log('Task URI:', task8[4]);
    console.log('Status:', task8[5]);
    console.log('Created At:', new Date(Number(task8[6]) * 1000).toISOString());
  } else {
    console.log('\n✗ Task8 does not exist on chain (taskCounter < 8)');
  }

  // 3. 列出所有任务
  console.log('\n--- All Tasks ---');
  for (let i = 1; i <= Number(taskCounter); i++) {
    const task = await contract.tasks(i);
    console.log(`Task ${i}: ${task[4]} (Status: ${task[5]})`);
  }
}

checkTask8OnChain().catch(console.error);
