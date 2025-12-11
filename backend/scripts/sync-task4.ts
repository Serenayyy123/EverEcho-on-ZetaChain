/**
 * 从链上同步 task 4 到数据库
 */

import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const TASK_ESCROW_ABI = [
  'function tasks(uint256) view returns (address creator, address helper, uint8 status, uint256 reward, string taskURI)',
];

async function main() {
  const taskId = '4';
  const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
  const taskEscrowAddress = process.env.TASK_ESCROW_ADDRESS;
  
  if (!taskEscrowAddress) {
    throw new Error('TASK_ESCROW_ADDRESS not configured');
  }
  
  console.log(`Syncing task ${taskId} from chain...\n`);
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const taskEscrow = new ethers.Contract(taskEscrowAddress, TASK_ESCROW_ABI, provider);
  
  // 读取链上任务
  const task = await taskEscrow.tasks(taskId);
  const creator = task.creator;
  const helper = task.helper;
  const status = Number(task.status);
  const taskURI = task.taskURI;
  
  console.log('Task from chain:');
  console.log('  Creator:', creator);
  console.log('  Helper:', helper);
  console.log('  Status:', status);
  console.log('  TaskURI:', taskURI);
  
  // 获取 creator 的 profile
  const creatorProfile = await prisma.profile.findUnique({
    where: { address: creator },
  });
  
  if (!creatorProfile) {
    console.log('\n❌ Creator profile not found');
    console.log('Creator must register first');
    return;
  }
  
  console.log('\n✅ Creator profile found:');
  console.log('  Nickname:', creatorProfile.nickname);
  console.log('  Contacts:', creatorProfile.contacts);
  
  // 创建 Task 记录
  const newTask = await prisma.task.upsert({
    where: { taskId },
    update: {},
    create: {
      taskId,
      title: `Task ${taskId} (synced from chain)`,
      description: 'This task was synced from blockchain',
      contactsEncryptedPayload: '0x',
      contactsPlaintext: creatorProfile.contacts || 'N/A',
      createdAt: Date.now().toString(),
    },
  });
  
  console.log('\n✅ Task created in database');
  
  // 创建 ContactKey
  const contactKey = await prisma.contactKey.upsert({
    where: { taskId },
    update: {},
    create: {
      taskId,
      creatorWrappedDEK: creatorProfile.contacts || 'N/A',
      helperWrappedDEK: creatorProfile.contacts || 'N/A',
    },
  });
  
  console.log('✅ ContactKey created');
  console.log('\n🎉 Task 4 synced successfully!');
  console.log('Now you can decrypt contacts for this task.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
