import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllProfiles() {
  try {
    // 查询所有 Profile，包括可能的软删除
    const profiles = await prisma.profile.findMany({
      orderBy: { address: 'asc' }
    });
    
    console.log(`\n📊 Total profiles: ${profiles.length}\n`);
    
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.address}`);
      console.log(`   Nickname: ${profile.nickname}`);
      console.log(`   City: ${profile.city}`);
      console.log(`   Contacts: ${profile.contacts ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // 检查是否有你的地址
    const yourAddress = '0x099Fb550F7Dc5842621344c5a1678F943eEF3488';
    const yourProfile = profiles.find(p => p.address.toLowerCase() === yourAddress.toLowerCase());
    
    if (yourProfile) {
      console.log(`✅ Found your profile: ${yourProfile.nickname}`);
    } else {
      console.log(`❌ Your address ${yourAddress} not found in database`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllProfiles();
