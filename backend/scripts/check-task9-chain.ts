import 'dotenv/config';
import { ethers } from 'ethers';

const RPC_URL = process.env.RPC_URL!;
const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS!;

const TASK_ESCROW_ABI = [
  'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(TASK_ESCROW_ADDRESS, TASK_ESCROW_ABI, provider);
  
  const task = await contract.tasks(9);
  
  console.log('Task 9 on chain:');
  console.log('  taskId:', task[0].toString());
  console.log('  creator:', task[1]);
  console.log('  helper:', task[2]);
  console.log('  reward:', ethers.formatEther(task[3]), 'EOCHO');
  console.log('  taskURI:', task[4]);
  console.log('  status:', task[5], getStatusName(task[5]));
  console.log('  createdAt:', new Date(Number(task[6]) * 1000).toISOString());
  console.log('  acceptedAt:', task[7].toString());
  console.log('  submittedAt:', task[8].toString());
}

function getStatusName(status: number): string {
  const names = ['Open', 'InProgress', 'Submitted', 'Completed', 'Terminated'];
  return names[status] || 'Unknown';
}

main().catch(console.error);
