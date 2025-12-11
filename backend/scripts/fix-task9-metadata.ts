/**
 * 修复 Task 9 的 metadata
 * 从 taskURI 指向的原始任务获取真实标题
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

const TASK_ESCROW_ABI = [
  'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
];

async function main() {
  console.log('Fixing Task 9 metadata...\n');
  
  // 1. 从链上读取 taskURI
  const RPC_URL = process.env.RPC_URL!;
  const TASK_ESCROW_ADDRESS = process.env.TASK_ESCROW_ADDRESS!;
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(TASK_ESCROW_ADDRESS, TASK_ESCROW_ABI, provider);
  
  const taskOnChain = await contract.tasks(9);
  const taskURI = taskOnChain[4];
  
  console.log('Task 9 on chain:');
  console.log('  taskURI:', taskURI);
  console.log('');
  
  // 2. 解析 taskURI 获取原始 taskId
  const match = taskURI.match(/\/task\/(\d+)\.json$/);
  if (!match) {
    console.error('❌ Cannot parse taskURI');
    return;
  }
  
  const originalTaskId = match[1];
  console.log('Original taskId from URI:', originalTaskId);
  console.log('');
  
  // 3. 从数据库读取原始任务的 metadata
  const originalTask = await prisma.task.findUnique({
    where: { taskId: originalTaskId },
    select: { title: true, description: true },
  });
  
  if (!originalTask) {
    console.error(`❌ Original task ${originalTaskId} not found in database`);
    return;
  }
  
  console.log('Original task metadata:');
  console.log('  Title:', originalTask.title);
  console.log('  Description:', originalTask.description);
  console.log('');
  
  // 4. 更新 Task 9
  const result = await prisma.task.update({
    where: { taskId: '9' },
    data: {
      title: originalTask.title,
      description: originalTask.description,
    },
  });
  
  console.log('✅ Task 9 updated successfully!');
  console.log('  New Title:', result.title);
  console.log('  New Description:', result.description);
  
  await prisma.$disconnect();
}

main().catch(console.error);
