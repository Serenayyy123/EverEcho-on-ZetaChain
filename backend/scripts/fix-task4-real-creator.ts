/**
 * 使用真实 creator 的联系方式更新 task 4
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
  
  console.log('Reading task 4 from chain...\n');
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const taskEscrow = new ethers.Contract(taskEscrowAddress, TASK_ESCROW_ABI, provider);
  
  // 读取链上任务
  const task = await taskEscrow.tasks(taskId);
  const creator = task.creator;
  const helper = task.helper;
  
  console.log('Task 4 on chain:');
  console.log('  Creator:', creator);
  console.log('  Helper:', helper);
  
  // 获取 creator 的 profile
  const creatorProfile = await prisma.profile.findUnique({
    where: { address: creator },
  });
  
  if (!creatorProfile) {
    console.log('\n❌ Creator profile not found:', creator);
    console.log('Checking if this is the zero address issue...');
    
    // 如果 creator 是无效地址，使用 helper 的信息
    if (creator === '0x0000000000000000000000000000000000000004' || 
        creator.toLowerCase().startsWith('0x000000')) {
      console.log('⚠️  Creator address is invalid, using helper instead');
      
      const helperProfile = await prisma.profile.findUnique({
        where: { address: helper },
      });
      
      if (helperProfile) {
        console.log('\n✅ Helper profile found:', helperProfile.nickname);
        console.log('   Contacts:', helperProfile.contacts);
        
        await updateTask(taskId, helperProfile.contacts || 'N/A');
        return;
      }
    }
    
    console.log('\n❌ Cannot find valid creator or helper profile');
    return;
  }
  
  console.log('\n✅ Creator profile found:', creatorProfile.nickname);
  console.log('   Contacts:', creatorProfile.contacts);
  
  await updateTask(taskId, creatorProfile.contacts || 'N/A');
}

async function updateTask(taskId: string, contacts: string) {
  // 更新 Task
  await prisma.task.update({
    where: { taskId },
    data: {
      contactsPlaintext: contacts,
    },
  });
  
  console.log('\n✅ Task updated');
  
  // 更新 ContactKey
  await prisma.contactKey.update({
    where: { taskId },
    data: {
      creatorWrappedDEK: contacts,
      helperWrappedDEK: contacts,
    },
  });
  
  console.log('✅ ContactKey updated');
  console.log(`\n🎉 Task 4 now has correct contacts: ${contacts}`);
  console.log('Refresh the browser and try "View Contacts" again!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
