/**
 * 列出所有注册的 profiles
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: 'desc' },
  });
  
  console.log(`Found ${profiles.length} profiles in database:\n`);
  
  profiles.forEach((profile) => {
    console.log(`Address: ${profile.address}`);
    console.log(`  Nickname: ${profile.nickname}`);
    console.log(`  City: ${profile.city}`);
    console.log(`  Contacts: ${profile.contacts || 'N/A'}`);
    console.log('');
  });
  
  // 检查 creator 地址
  const creatorAddress = '0xD68a76259d4100A2622D643d5e62F5F92C28C4fe';
  console.log(`\nLooking for creator: ${creatorAddress}`);
  console.log(`Looking for creator (lowercase): ${creatorAddress.toLowerCase()}`);
  
  const exactMatch = profiles.find(p => p.address === creatorAddress);
  const lowerMatch = profiles.find(p => p.address.toLowerCase() === creatorAddress.toLowerCase());
  
  if (exactMatch) {
    console.log('✅ Found exact match:', exactMatch.address);
  } else if (lowerMatch) {
    console.log('✅ Found case-insensitive match:', lowerMatch.address);
  } else {
    console.log('❌ No match found');
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
