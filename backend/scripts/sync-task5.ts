/**
 * 手动同步 task 5
 */

import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { generateDEK, wrapDEK, encryptContacts } from '../src/services/encryptionService';

dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

const prisma = new PrismaClient();

const TASK_ESCROW_ABI = [
  'function tasks(uint256) view returns (address creator, address helper, uint8 status, uint256 reward, string taskURI)',
];

async function main() {
  const taskId = '5';
  const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
  const taskEscrowAddress = process.env.TASK_ESCROW_ADDRESS;
  
  if (!taskEscrowAddress) {
    throw new Error('TASK_ESCROW_ADDRESS not configured');
  }
  
  console.log('Syncing task 5 from chain...\n');
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const taskEscrow = new ethers.Contract(taskEscrowAddress, TASK_ESCROW_ABI, provider);
  
  const task = await taskEscrow.tasks(taskId);
  const creator = task.creator;
  
  console.log('Task 5 on chain:');
  console.log('  Creator:', creator);
  console.log('  TaskURI:', task.taskURI);
  
  // 获取 creator profile
  const creatorProfile = await prisma.profile.findUnique({
    where: { address: creator },
  });
  
  if (!creatorProfile) {
    console.log('\n❌ Creator not found:', creator);
    return;
  }
  
  console.log('\n✅ Creator found:', creatorProfile.nickname);
  console.log('   Contacts:', creatorProfile.contacts);
  
  // 从 taskURI 获取任务详情
  try {
    const response = await fetch(`http://localhost:3001/api/task/${taskId}`);
    const taskData: any = await response.json();
    
    console.log('\n✅ Task data from backend:');
    console.log('   Title:', taskData.title);
    console.log('   Description:', taskData.description);
    
    // 检查是否已存在
    const existing = await prisma.task.findUnique({ where: { taskId } });
    if (existing) {
      console.log('\n✅ Task already exists in database');
      
      // 检查 ContactKey
      const contactKey = await prisma.contactKey.findUnique({ where: { taskId } });
      if (!contactKey) {
        console.log('Creating ContactKey...');
        await prisma.contactKey.create({
          data: {
            taskId,
            creatorWrappedDEK: creatorProfile.contacts || 'N/A',
            helperWrappedDEK: '',
          },
        });
        console.log('✅ ContactKey created');
      } else {
        console.log('✅ ContactKey already exists');
      }
    } else {
      console.log('\n⚠️  Task not in database, this should not happen');
    }
    
    console.log('\n🎉 Task 5 synced successfully!');
  } catch (error) {
    console.error('Error fetching task data:', error);
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
