import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const STAGING_API = 'https://everecho-staging-backend.onrender.com';

async function fetchJSON(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

async function main() {
  console.log('=== Syncing Profiles from Staging (via Tasks) ===\n');

  try {
    // 1. 从本地数据库获取所有任务的 creator 地址
    console.log('1. Getting creator addresses from local tasks...');
    const tasks = await prisma.task.findMany({
      where: { chainId: '84532' },
      select: { creator: true },
    });

    const addresses = [...new Set(tasks.map(t => t.creator).filter(Boolean))];
    console.log(`   Found ${addresses.length} unique creator addresses\n`);

    // 2. 从 staging API 获取每个地址的 Profile
    console.log('2. Syncing profiles from staging API...');
    let syncedCount = 0;
    let failedCount = 0;

    for (const address of addresses) {
      try {
        const profileData = await fetchJSON(`${STAGING_API}/api/profile/${address}`);
        
        // 转换 skills 数组为字符串
        const skillsStr = Array.isArray(profileData.skills) 
          ? profileData.skills.join(', ') 
          : profileData.skills || null;
        
        // 存储到本地数据库
        await prisma.profile.upsert({
          where: { address },
          update: {
            nickname: profileData.nickname,
            city: profileData.city || null,
            skills: skillsStr,
            encryptionPubKey: profileData.encryptionPubKey,
            contacts: profileData.contacts || null,
          },
          create: {
            address,
            nickname: profileData.nickname,
            city: profileData.city || null,
            skills: skillsStr,
            encryptionPubKey: profileData.encryptionPubKey,
            contacts: profileData.contacts || null,
          },
        });
        
        console.log(`   ✅ ${profileData.nickname} (${address.slice(0, 10)}...)`);
        syncedCount++;
      } catch (error: any) {
        if (error.message.includes('404')) {
          console.log(`   ⚠️  Profile not found for ${address.slice(0, 10)}...`);
        } else {
          console.log(`   ❌ Failed: ${address.slice(0, 10)}... - ${error.message}`);
        }
        failedCount++;
      }
    }

    console.log(`\n=== Sync Complete ===`);
    console.log(`✅ Synced: ${syncedCount} profiles`);
    if (failedCount > 0) {
      console.log(`❌ Failed: ${failedCount} profiles`);
    }

  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
