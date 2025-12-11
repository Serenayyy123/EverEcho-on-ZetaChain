/**
 * 删除旧的 Task 3 数据，然后从链上重新同步
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const CURRENT_CHAIN_ID = process.env.CHAIN_ID || '84532';

async function deleteAndResyncTask3() {
  console.log('='.repeat(60));
  console.log('🔧 Delete and Resync Task 3');
  console.log('='.repeat(60));

  try {
    // 1. 显示当前的 Task 3 数据
    console.log('\n📋 Current Task 3 data:');
    const currentTask = await prisma.task.findUnique({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId: '3' }
      },
    });
    
    if (currentTask) {
      console.log('  title:', currentTask.title);
      console.log('  category:', currentTask.category);
      console.log('  creator:', currentTask.creator);
      console.log('  This is OLD data from previous chain!');
    } else {
      console.log('  ❌ Task 3 not found in database');
      return;
    }

    // 2. 删除 Task 3 和相关的 ContactKey
    console.log('\n🗑️  Deleting old Task 3 data...');
    
    await prisma.$transaction(async (tx) => {
      // 删除 ContactKey
      try {
        await tx.contactKey.delete({
          where: {
            chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId: '3' }
          },
        });
        console.log('  ✅ ContactKey deleted');
      } catch (error) {
        console.log('  ⚠️  ContactKey not found or already deleted');
      }
      
      // 删除 Task
      await tx.task.delete({
        where: {
          chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId: '3' }
        },
      });
      console.log('  ✅ Task deleted');
    });

    console.log('\n✅ Old Task 3 data deleted successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. The old data has been removed');
    console.log('  2. Restart the backend to trigger chain sync');
    console.log('  3. The backend will automatically sync Task 3 from chain');
    console.log('  4. Your new task "coffee chat with someone in DeFi" will appear');
    console.log('\n🔄 Restart backend with: npm run dev');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Delete Complete');
  console.log('='.repeat(60));
}

deleteAndResyncTask3();
