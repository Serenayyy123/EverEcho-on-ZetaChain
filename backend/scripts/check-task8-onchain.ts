/**
 * 检查链上 Task 8 的完整状态
 */

import { ethers } from 'ethers';

const RPC_URL = process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/y7anxz3Urn0udDBD6u8TU';
const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS || '0xC71040C8916E145f937Da3D094323C8f136c2E2F';

const TASK_ESCROW_ABI = [
  'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
];

const STATUS_NAMES = ['Open', 'InProgress', 'Submitted', 'Completed', 'Cancelled'];

async function checkTask8() {
  try {
    console.log('\n🔍 Checking Task 8 on-chain status...\n');

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(TASK_ESCROW_ADDRESS, TASK_ESCROW_ABI, provider);

    const task = await contract.tasks(8);

    console.log('Task 8 On-Chain State:');
    console.log('='.repeat(60));
    console.log(`taskId: ${task[0]}`);
    console.log(`creator: ${task[1]}`);
    console.log(`helper: ${task[2]}`);
    console.log(`reward: ${ethers.formatEther(task[3])} EOCHO`);
    console.log(`taskURI: ${task[4]}`);
    console.log(`status: ${task[5]} (${STATUS_NAMES[task[5]] || 'Unknown'})`);
    console.log(`createdAt: ${task[6]} (${new Date(Number(task[6]) * 1000).toISOString()})`);
    console.log(`acceptedAt: ${task[7]} (${task[7] > 0 ? new Date(Number(task[7]) * 1000).toISOString() : 'N/A'})`);
    console.log(`submittedAt: ${task[8]} (${task[8] > 0 ? new Date(Number(task[8]) * 1000).toISOString() : 'N/A'})`);
    console.log(`terminateRequestedBy: ${task[9]}`);
    console.log(`terminateRequestedAt: ${task[10]}`);
    console.log(`fixRequested: ${task[11]}`);
    console.log(`fixRequestedAt: ${task[12]}`);
    console.log('='.repeat(60));

    // 检查 confirmComplete 的前置条件
    console.log('\n✅ confirmComplete Prerequisites Check:\n');
    
    const isCreator = task[1] !== ethers.ZeroAddress;
    const hasHelper = task[2] !== ethers.ZeroAddress;
    const statusValue = Number(task[5]);
    const isSubmitted = statusValue === 2; // Submitted
    const hasSubmittedAt = Number(task[8]) > 0;
    
    console.log(`✓ Has creator: ${isCreator ? '✅' : '❌'} (${task[1]})`);
    console.log(`✓ Has helper: ${hasHelper ? '✅' : '❌'} (${task[2]})`);
    console.log(`✓ Status is Submitted: ${isSubmitted ? '✅' : '❌'} (current: ${statusValue} = ${STATUS_NAMES[statusValue]})`);
    console.log(`✓ Has submittedAt: ${hasSubmittedAt ? '✅' : '❌'} (${task[8]})`);
    console.log(`✓ fixRequested: ${task[11] ? '⚠️  YES' : '✅ NO'}`);

    const canConfirmComplete = isCreator && hasHelper && isSubmitted && hasSubmittedAt;
    
    console.log(`\n${canConfirmComplete ? '✅' : '❌'} Can confirmComplete: ${canConfirmComplete}`);

    if (!canConfirmComplete) {
      console.log('\n❌ Prerequisites NOT met. Reasons:');
      if (!isSubmitted) console.log('  - Status is not Submitted');
      if (!hasHelper) console.log('  - No helper assigned');
      if (!hasSubmittedAt) console.log('  - No submittedAt timestamp');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTask8();
