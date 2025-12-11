/**
 * 更新 task 3 的联系方式为真实 creator 的联系方式
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const creatorAddress = '0xD68a76259d4100A2622D643d5e62F5F92C28C4fe';
  
  // 获取 creator profile
  const profile = await prisma.profile.findUnique({
    where: { address: creatorAddress },
  });
  
  if (!profile) {
    console.log('❌ Creator not found');
    return;
  }
  
  console.log('✅ Creator found:');
  console.log('  Nickname:', profile.nickname);
  console.log('  Contacts:', profile.contacts);
  
  // 更新 task 3 的 ContactKey
  const contactKey = await prisma.contactKey.update({
    where: { taskId: '3' },
    data: {
      creatorWrappedDEK: profile.contacts || '@serena_369y',
      helperWrappedDEK: profile.contacts || '@serena_369y',
    },
  });
  
  console.log('\n✅ Task 3 ContactKey updated:');
  console.log('  creatorWrappedDEK:', contactKey.creatorWrappedDEK);
  console.log('  helperWrappedDEK:', contactKey.helperWrappedDEK);
  console.log('\n🎉 Now refresh the browser and click "View Contacts" again!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
