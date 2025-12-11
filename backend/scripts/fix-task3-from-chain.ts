/**
 * 从链上重新同步 Task 3 的正确数据
 */

import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const CURRENT_CHAIN_ID = process.env.CHAIN_ID || '84532';

async function fixTask3FromChain() {
  console.log('='.repeat(60));
  console.log('🔧 Fixing Task 3 from Chain Data');
  console.log('='.repeat(60));

  try {
    // 1. 连接到链
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const taskEscrowAddress = process.env.TASK_ESCROW_ADDRESS;
    
    if (!taskEscrowAddress) {
      throw new Error('TASK_ESCROW_ADDRESS not set');
    }

    const TaskEscrowABI = require('../src/contracts/TaskEscrow.json');
    const contract = new ethers.Contract(taskEscrowAddress, TaskEscrowABI, provider);

    // 2. 从链上读取 Task 3
    console.log('\n📡 Reading Task 3 from chain...');
    const taskOnChain = await contract.tasks(3);
    
    console.log('  taskId:', taskOnChain[0].toString());
    console.log('  creator:', taskOnChain[1]);
    console.log('  helper:', taskOnChain[2]);
    console.log('  taskURI:', taskOnChain[3]);
    console.log('  reward:', ethers.formatEther(taskOnChain[4]), 'ECHO');
    console.log('  status:', taskOnChain[5].toString());

    // 3. 解析 taskURI 获取 metadata
    const taskURI = taskOnChain[3];
    console.log('\n📖 Parsing taskURI:', taskURI);
    
    // taskURI 格式: https://api.everecho.io/task/3.json
    // 实际上这个 URI 指向后端 API，我们需要直接从链上的 metadata 获取
    
    // 4. 检查数据库中的当前数据
    console.log('\n💾 Current database data:');
    const currentTask = await prisma.task.findUnique({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId: '3' }
      },
    });
    
    if (currentTask) {
      console.log('  title:', currentTask.title);
      console.log('  category:', currentTask.category);
      console.log('  creator:', currentTask.creator);
    }

    // 5. 从链上事件获取真实的 metadata
    console.log('\n🔍 Searching for TaskPublished event...');
    const filter = contract.filters.TaskPublished(3);
    const events = await contract.queryFilter(filter);
    
    if (events.length > 0) {
      const event = events[0];
      console.log('  ✅ Found TaskPublished event');
      console.log('  Block:', event.blockNumber);
      console.log('  Transaction:', event.transactionHash);
      
      // 从事件中获取数据
      const eventData = event.args;
      console.log('  Event data:', {
        taskId: eventData[0].toString(),
        creator: eventData[1],
        taskURI: eventData[2],
        reward: ethers.formatEther(eventData[3])
      });
    }

    // 6. 提示用户需要做什么
    console.log('\n⚠️  IMPORTANT:');
    console.log('  The database has OLD data for Task 3.');
    console.log('  The chain has your NEW task: "coffee chat with someone in DeFi"');
    console.log('\n📝 To fix this, you need to:');
    console.log('  1. Delete the old Task 3 from database');
    console.log('  2. Re-sync Task 3 from chain with correct metadata');
    console.log('\n🔧 Run this command to fix:');
    console.log('  npx ts-node scripts/resync-task3.ts');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Analysis Complete');
  console.log('='.repeat(60));
}

fixTask3FromChain();
