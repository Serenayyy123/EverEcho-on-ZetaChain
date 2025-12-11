/**
 * 检查 task creator 的联系方式
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const creatorAddress = '0xD68a76259d4100A2622D643d5e62F5F92C28C4fe';
  
  console.log(`Looking for creator profile: ${creatorAddress}\n`);
  
  // 查找 creator 的 profile
  const profile = await prisma.profile.findUnique({
    where: { 
      address: creatorAddress.toLowerCase() 
    },
  });
  
  if (!profile) {
    console.log('❌ Creator profile not found in database');
    console.log('This means the creator has not registered yet.');
    return;
  }
  
  console.log('✅ Creator profile found:');
  console.log('  Nickname:', profile.nickname);
  console.log('  City:', profile.city);
  console.log('  Contacts:', profile.contacts || 'N/A');
  console.log('  Encryption PubKey:', profile.encryptionPubKey.slice(0, 20) + '...');
  
  // 更新 task 3 的 ContactKey
  if (profile.contacts) {
    console.log('\n📝 Updating task 3 ContactKey with real creator contacts...');
    
    const contactKey = await prisma.contactKey.update({
      where: { taskId: '3' },
      data: {
        creatorWrappedDEK: profile.contacts,
        helperWrappedDEK: profile.contacts,
      },
    });
    
    console.log('✅ ContactKey updated:', contactKey);
  } else {
    console.log('\n⚠️  Creator has no contacts in profile');
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
