/**
 * 完整验证 Task 3 的数据
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const CURRENT_CHAIN_ID = process.env.CHAIN_ID || '84532';

async function verifyTask3() {
  console.log('='.repeat(60));
  console.log('🔍 Verifying Task 3 Complete Data');
  console.log('='.repeat(60));

  try {
    const task3 = await prisma.task.findUnique({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId: '3' }
      },
    });

    if (!task3) {
      console.log('\n❌ Task 3 not found!');
      return;
    }

    console.log('\n📋 Task 3 Data:');
    console.log('  chainId:', task3.chainId);
    console.log('  taskId:', task3.taskId);
    console.log('  title:', task3.title);
    console.log('  category:', task3.category);
    console.log('  creator:', task3.creator);
    console.log('  createdAt:', task3.createdAt);
    console.log('  description (first 100 chars):', task3.description.substring(0, 100));

    // 检查是否是住宿相关的内容
    const isHostingRelated = 
      task3.title.toLowerCase().includes('accommodation') ||
      task3.title.toLowerCase().includes('guangzhou') ||
      task3.description.toLowerCase().includes('shenyang') ||
      task3.description.toLowerCase().includes('backpacker');

    console.log('\n🔍 Content Verification:');
    console.log('  Is hosting-related content:', isHostingRelated ? '✅ YES' : '❌ NO');
    console.log('  Category matches content:', task3.category === 'hosting' ? '✅ YES' : '❌ NO');

    if (task3.category === 'hosting' && isHostingRelated) {
      console.log('\n✅ Task 3 data is CORRECT!');
      console.log('   - Category: hosting ✅');
      console.log('   - Content: Accommodation in Guangzhou ✅');
      console.log('   - This is the RIGHT data, not old data!');
    } else {
      console.log('\n⚠️  Task 3 data might be incorrect');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Verification Complete');
  console.log('='.repeat(60));
}

verifyTask3();
