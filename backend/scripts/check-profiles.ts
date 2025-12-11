import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProfiles() {
  try {
    const profiles = await prisma.profile.findMany();
    
    console.log(`\n📊 Total profiles in database: ${profiles.length}\n`);
    
    if (profiles.length === 0) {
      console.log('❌ No profiles found in database!');
    } else {
      profiles.forEach((profile, index) => {
        console.log(`Profile ${index + 1}:`);
        console.log(`  Address: ${profile.address}`);
        console.log(`  Nickname: ${profile.nickname}`);
        console.log(`  City: ${profile.city}`);
        console.log(`  Skills: ${profile.skills}`);
        console.log(`  Has contacts: ${profile.contacts ? 'Yes' : 'No'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error checking profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfiles();
