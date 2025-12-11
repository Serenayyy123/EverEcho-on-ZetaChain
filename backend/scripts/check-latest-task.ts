import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

dotenv.config();

const prisma = new PrismaClient();

async function checkLatestTask() {
  console.log('=== 检查最新创建的任务 ===\n');

  try {
    // 1. 获取最新的任务
    const latestTask = await prisma.task.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latestTask) {
      console.log('❌ 没有任务');
      return;
    }

    console.log(`最新任务: Task ${latestTask.taskId}`);
    console.log(`  title: ${latestTask.title}`);
    console.log(`  contactsPlaintext: ${latestTask.contactsPlaintext}`);
    console.log('');

    // 2. 检查 ContactKey
    const contactKey = await prisma.contactKey.findUnique({
      where: { taskId: latestTask.taskId },
    });

    if (!contactKey) {
      console.log('❌ ContactKey 不存在');
      return;
    }

    console.log('ContactKey:');
    console.log(`  creatorWrappedDEK: ${contactKey.creatorWrappedDEK ? '存在' : '不存在'}`);
    console.log(`  helperWrappedDEK: ${contactKey.helperWrappedDEK ? '存在' : '不存在'}`);
    console.log('');

    // 3. 检查链上状态
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(
      process.env.TASK_ESCROW_ADDRESS!,
      ['function taskCounter() view returns (uint256)', 'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)'],
      provider
    );

    const taskCounter = await contract.taskCounter();
    console.log(`链上 taskCounter: ${taskCounter}`);

    // 查找对应的链上任务
    for (let i = 1; i <= Number(taskCounter); i++) {
      const taskOnChain = await contract.tasks(i);
      const taskURI = taskOnChain[4];
      const match = taskURI.match(/\/task\/(\d+)\.json$/);
      
      if (match && match[1] === latestTask.taskId) {
        console.log(`\n链上 Task ${i} 对应数据库 Task ${latestTask.taskId}:`);
        console.log(`  creator: ${taskOnChain[1]}`);
        console.log(`  helper: ${taskOnChain[2]}`);
        console.log(`  status: ${taskOnChain[5]}`);
        
        if (taskOnChain[2] !== ethers.ZeroAddress) {
          console.log(`\n⚠️  任务已被接受，但 helperWrappedDEK 为空！`);
          console.log(`需要运行修复脚本`);
        } else {
          console.log(`\n✅ 任务尚未被接受，helperWrappedDEK 为空是正常的`);
        }
        break;
      }
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestTask();
