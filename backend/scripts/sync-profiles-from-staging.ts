import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const STAGING_API = 'https://everecho-staging-backend.onrender.com';
const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';
const REGISTER_ADDRESS = '0xae8d98a0AF4ECe6240949bB74E03A9281Ce58151'; // Base Sepolia

// Register 合约 ABI（只需要 ProfileRegistered 事件）
const REGISTER_ABI = [
  'event ProfileRegistered(address indexed user, string profileURI)',
];

async function fetchJSON(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

async function main() {
  console.log('=== Syncing Profiles from Staging ===\n');

  try {
    // 1. 从链上获取所有注册的地址
    console.log('1. Fetching registered addresses from chain...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const registerContract = new ethers.Contract(
      REGISTER_ADDRESS,
      REGISTER_ABI,
      provider
    );

    // 获取所有 ProfileRegistered 事件
    const filter = registerContract.filters.ProfileRegistered();
    const events = await registerContract.queryFilter(filter, 0, 'latest');
    
    const addresses = [...new Set(events.map(event => event.args![0]))];
    console.log(`   Found ${addresses.length} registered addresses\n`);

    // 2. 从 staging API 获取每个地址的 Profile
    console.log('2. Syncing profiles from staging API...');
    let syncedCount = 0;
    let failedCount = 0;

    for (const address of addresses) {
      try {
        const profileData = await fetchJSON(`${STAGING_API}/api/profile/${address}`);
        
        // 存储到本地数据库
        await prisma.profile.upsert({
          where: { address },
          update: {
            nickname: profileData.nickname,
            city: profileData.city || null,
            skills: profileData.skills || null,
            encryptionPubKey: profileData.encryptionPubKey,
            bio: profileData.bio || null,
            avatar: profileData.avatar || null,
            contacts: profileData.contacts || null,
          },
          create: {
            address,
            nickname: profileData.nickname,
            city: profileData.city || null,
            skills: profileData.skills || null,
            encryptionPubKey: profileData.encryptionPubKey,
            bio: profileData.bio || null,
            avatar: profileData.avatar || null,
            contacts: profileData.contacts || null,
          },
        });
        
        console.log(`   ✅ Synced profile: ${profileData.nickname} (${address.slice(0, 10)}...)`);
        syncedCount++;
      } catch (error: any) {
        if (error.message.includes('404')) {
          console.log(`   ⚠️  Profile not found for ${address.slice(0, 10)}...`);
        } else {
          console.log(`   ❌ Failed to sync ${address.slice(0, 10)}...: ${error.message}`);
        }
        failedCount++;
      }
    }

    console.log(`\n=== Sync Complete ===`);
    console.log(`✅ Synced: ${syncedCount} profiles`);
    console.log(`❌ Failed: ${failedCount} profiles`);
    console.log(`📊 Total addresses: ${addresses.length}`);

  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
