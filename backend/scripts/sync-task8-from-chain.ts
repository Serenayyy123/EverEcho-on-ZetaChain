import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function syncTask8() {
  console.log('=== Syncing Task8 from Chain ===\n');

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(
    process.env.TASK_ESCROW_ADDRESS!,
    [
      'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)',
    ],
    provider
  );

  // 1. 从链上读取 Task8
  console.log('1. Reading Task8 from chain...');
  const task8 = await contract.tasks(8);
  
  const taskData = {
    taskId: task8[0].toString(),
    creator: task8[1],
    helper: task8[2],
    reward: ethers.formatEther(task8[3]),
    taskURI: task8[4],
    status: Number(task8[5]),
    createdAt: Number(task8[6]),
    acceptedAt: Number(task8[7]),
    submittedAt: Number(task8[8]),
  };

  console.log('Task8 data:', taskData);

  // 2. 从 taskURI 获取 metadata
  console.log('\n2. Fetching metadata from taskURI...');
  let metadata: any = null;
  
  try {
    const response = await fetch(taskData.taskURI);
    if (response.ok) {
      metadata = await response.json();
      console.log('Metadata:', {
        title: metadata.title,
        description: metadata.description?.substring(0, 50) + '...',
        category: metadata.category,
      });
    } else {
      console.warn('Failed to fetch metadata:', response.status);
    }
  } catch (error) {
    console.warn('Error fetching metadata:', error);
  }

  // 3. 如果没有 metadata，创建默认值
  if (!metadata) {
    console.log('\n⚠️  No metadata found, creating default...');
    metadata = {
      taskId: '8',
      title: 'Task 8 (synced from chain)',
      description: 'This task was synced from the blockchain. Original metadata unavailable.',
      contactsEncryptedPayload: 'N/A',
      createdAt: taskData.createdAt,
      category: 'other',
    };
  }

  // 4. 获取 chainId
  const chainId = process.env.CHAIN_ID || '84532';
  console.log(`\n3. Using chainId: ${chainId}`);

  // 5. 写入数据库
  console.log('\n4. Writing to database...');
  
  try {
    const result = await prisma.task.upsert({
      where: {
        chainId_taskId: {
          chainId,
          taskId: '8',
        },
      },
      create: {
        chainId,
        taskId: '8',
        title: metadata.title,
        description: metadata.description,
        category: metadata.category || 'other',
        contactsEncryptedPayload: metadata.contactsEncryptedPayload || 'N/A',
        createdAt: new Date(taskData.createdAt * 1000).toISOString(),
        creator: taskData.creator,
      },
      update: {
        title: metadata.title,
        description: metadata.description,
        category: metadata.category || 'other',
        contactsEncryptedPayload: metadata.contactsEncryptedPayload || 'N/A',
        creator: taskData.creator,
      },
    });

    console.log('✓ Task8 synced successfully!');
    console.log('Database record:', {
      chainId: result.chainId,
      taskId: result.taskId,
      title: result.title,
      category: result.category,
    });
  } catch (error) {
    console.error('✗ Failed to write to database:', error);
    throw error;
  }

  await prisma.$disconnect();
  console.log('\n=== Sync Complete ===');
}

syncTask8().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
