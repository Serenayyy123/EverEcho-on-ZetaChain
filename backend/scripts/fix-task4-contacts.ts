/**
 * 修复 task 4 的联系方式
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const taskId = '4';
  const testContacts = '@test_user_task4';
  
  console.log('Updating task 4 contacts...\n');
  
  // 更新 Task
  await prisma.task.update({
    where: { taskId },
    data: {
      contactsPlaintext: testContacts,
    },
  });
  
  console.log('✅ Task updated');
  
  // 更新 ContactKey
  await prisma.contactKey.update({
    where: { taskId },
    data: {
      creatorWrappedDEK: testContacts,
      helperWrappedDEK: testContacts,
    },
  });
  
  console.log('✅ ContactKey updated');
  console.log(`\n🎉 Task 4 now has contacts: ${testContacts}`);
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
