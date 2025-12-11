/**
 * 从链上同步任务到数据库
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
  const taskId = '3';
  const rpcUrl = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
  const taskEscrowAddress = process.env.TASK_ESCROW_ADDRESS;
  
  if (!taskEscrowAddress) {
    throw new Error('TASK_ESCROW_ADDRESS not configured');
  }
  
  console.log(`Syncing task ${taskId} from chain...`);
  console.log(`RPC: ${rpcUrl}`);
  console.log(`Contract: ${taskEscrowAddress}\n`);
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const taskEscrow = new ethers.Contract(taskEscrowAddress, TASK_ESCROW_ABI, provider);
  
  // 读取链上任务
  const task = await taskEscrow.tasks(taskId);
  console.log('Task from chain:', {
    creator: task.creator,
    helper: task.helper,
    status: Number(task.status),
    taskURI: task.taskURI,
  });
  
  // 从 taskURI 获取任务详情
  console.log('\nFetching task details from backend...');
  const taskURI = task.taskURI;
  // taskURI 格式: https://api.everecho.io/task/3.json
  // 我们需要从后端 API 获取
  const backendUrl = 'http://localhost:3001';
  const response = await fetch(`${backendUrl}/api/task/${taskId}`);
  
  if (!response.ok) {
    console.log('Task not found in backend, creating...');
    
    // 创建任务记录（使用占位数据）
    const newTask = await prisma.task.create({
      data: {
        taskId,
        title: `Task ${taskId} (synced from chain)`,
        description: 'This task was synced from blockchain',
        contactsEncryptedPayload: '0x',
        contactsPlaintext: 'telegram: @test_user',
        createdAt: Date.now().toString(),
      },
    });
    
    console.log('Task created in database:', newTask);
    
    // 创建 ContactKey
    const contactKey = await prisma.contactKey.create({
      data: {
        taskId,
        creatorWrappedDEK: 'telegram: @test_user',
        helperWrappedDEK: 'telegram: @test_user',
      },
    });
    
    console.log('ContactKey created:', contactKey);
    console.log('\n✅ Task synced successfully!');
  } else {
    const taskData: any = await response.json();
    console.log('Task found in backend:', taskData);
    
    // 检查是否有 ContactKey
    const contactKey = await prisma.contactKey.findUnique({
      where: { taskId },
    });
    
    if (!contactKey) {
      console.log('Creating ContactKey...');
      const newContactKey = await prisma.contactKey.create({
        data: {
          taskId,
          creatorWrappedDEK: (taskData.contactsPlaintext as string) || 'telegram: @test_user',
          helperWrappedDEK: (taskData.contactsPlaintext as string) || 'telegram: @test_user',
        },
      });
      console.log('ContactKey created:', newContactKey);
    } else {
      console.log('ContactKey already exists');
    }
    
    console.log('\n✅ Task synced successfully!');
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
