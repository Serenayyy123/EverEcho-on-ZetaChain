/**
 * 检查 Task 3 的状态
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTask3() {
  try {
    console.log('\n🔍 Checking Task 3 status...\n');

    // 检查 Task
    const task = await prisma.task.findUnique({
      where: { taskId: '3' },
    });

    if (task) {
      console.log('✅ Task 3 exists:');
      console.log(`   Title: ${task.title}`);
      console.log(`   Contacts (plaintext): ${task.contactsPlaintext}`);
    } else {
      console.log('❌ Task 3 NOT found in database');
    }

    // 检查 ContactKey
    const contactKey = await prisma.contactKey.findUnique({
      where: { taskId: '3' },
    });

    if (contactKey) {
      console.log('\n✅ ContactKey exists:');
      console.log(`   creatorWrappedDEK: ${contactKey.creatorWrappedDEK.substring(0, 20)}...`);
      console.log(`   helperWrappedDEK: ${contactKey.helperWrappedDEK ? contactKey.helperWrappedDEK.substring(0, 20) + '...' : 'N/A'}`);
    } else {
      console.log('\n❌ ContactKey NOT found for Task 3');
    }

    console.log('\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTask3();
