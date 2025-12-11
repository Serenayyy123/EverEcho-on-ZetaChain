/**
 * 同步链上历史 Profile 到 Postgres
 * 
 * 用途：
 * - 从链上 Register 合约读取所有 UserRegistered 事件
 * - 获取每个用户的 profileURI 并拉取 metadata
 * - 写入 staging 数据库（失败时写入占位数据）
 * 
 * 约束：
 * - 只读取现有 service/config，不修改任何 src/ 文件
 * - 失败的 profileURI 必须写入占位数据（不跳过）
 * - Profile schema 没有 chainId，按 address 去重
 */

import 'dotenv/config';
import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Register 合约 ABI（最小化，只包含需要的部分）
const REGISTER_ABI = [
  'event UserRegistered(address indexed user, string profileURI, uint256 mintedAmount)',
  'function profileURI(address) view returns (string)',
];

async function main() {
  console.log('[SyncProfiles] 🔄 Starting historical profile sync...\n');

  // 1. 读取环境变量
  const rpcUrl = process.env.RPC_URL;
  const registerAddress = process.env.REGISTER_ADDRESS;
  const syncFromBlock = parseInt(process.env.SYNC_FROM_BLOCK || '0');

  if (!rpcUrl || !registerAddress) {
    throw new Error('[SyncProfiles] Missing RPC_URL or REGISTER_ADDRESS');
  }

  console.log(`[SyncProfiles] RPC URL: ${rpcUrl}`);
  console.log(`[SyncProfiles] Register: ${registerAddress}`);
  console.log(`[SyncProfiles] Sync from block: ${syncFromBlock}\n`);

  // 2. 初始化 provider 和合约
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(registerAddress, REGISTER_ABI, provider);

  // 3. 查询历史事件（分批避免 RPC 限制）
  console.log('[SyncProfiles] 📡 Querying UserRegistered events...');
  const currentBlock = await provider.getBlockNumber();
  const BATCH_SIZE = 50000; // 安全的批次大小
  
  let allEvents: any[] = [];
  let fromBlock = syncFromBlock;
  
  while (fromBlock <= currentBlock) {
    const toBlock = Math.min(fromBlock + BATCH_SIZE - 1, currentBlock);
    console.log(`[SyncProfiles]   Querying blocks ${fromBlock} to ${toBlock}...`);
    
    const filter = contract.filters.UserRegistered();
    const batchEvents = await contract.queryFilter(filter, fromBlock, toBlock);
    allEvents = allEvents.concat(batchEvents);
    
    console.log(`[SyncProfiles]   Found ${batchEvents.length} events in this batch`);
    fromBlock = toBlock + 1;
  }
  
  const events = allEvents;
  console.log(`[SyncProfiles] 📊 Total found: ${events.length} registration events\n`);

  if (events.length === 0) {
    console.log('[SyncProfiles] ✅ No profiles to sync');
    return;
  }

  let synced = 0;
  let failed = 0;

  // 4. 处理每个事件
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const userAddress = event.args![0] as string;
    const profileURIValue = event.args![1] as string;

    console.log(`[SyncProfiles] [${i + 1}/${events.length}] Processing ${userAddress}`);

    try {
      // 4.1 检查是否已存在
      const existing = await prisma.profile.findUnique({
        where: { address: userAddress },
      });

      if (existing) {
        console.log(`[SyncProfiles]   ⏭️  Already exists, skipping`);
        continue;
      }

      // 4.2 尝试获取 metadata
      let metadata: any = null;
      let usedPlaceholder = false;

      if (profileURIValue && profileURIValue !== '') {
        console.log(`[SyncProfiles]   📥 Fetching metadata from: ${profileURIValue}`);
        
        try {
          const response = await fetch(profileURIValue);
          if (response.ok) {
            metadata = await response.json();
          } else {
            console.log(`[SyncProfiles]   ⚠️  HTTP ${response.status}, using placeholder`);
            usedPlaceholder = true;
          }
        } catch (fetchError: any) {
          console.log(`[SyncProfiles]   ⚠️  Fetch failed: ${fetchError.message}, using placeholder`);
          usedPlaceholder = true;
        }
      } else {
        console.log(`[SyncProfiles]   ⚠️  Empty profileURI, using placeholder`);
        usedPlaceholder = true;
      }

      // 4.3 准备数据（失败时使用占位符）
      const profileData = metadata
        ? {
            address: userAddress,
            nickname: metadata.nickname || `User ${userAddress.slice(0, 6)}`,
            city: metadata.city || '',
            skills: metadata.skills || '[]',
            encryptionPubKey: metadata.encryptionPubKey || '',
            contacts: metadata.contacts || null,
          }
        : {
            address: userAddress,
            nickname: `User (synced from chain)`,
            city: '',
            skills: '[]',
            encryptionPubKey: '',
            contacts: null,
          };

      // 4.4 写入数据库
      await prisma.profile.create({
        data: profileData,
      });

      if (usedPlaceholder) {
        console.log(`[SyncProfiles]   ✅ Synced with placeholder: ${profileData.nickname}`);
        failed++;
      } else {
        console.log(`[SyncProfiles]   ✅ Synced: ${profileData.nickname}`);
        synced++;
      }
    } catch (error: any) {
      console.error(`[SyncProfiles]   ❌ Error: ${error.message}`);
      
      // 即使出错也尝试写入占位数据
      try {
        await prisma.profile.create({
          data: {
            address: userAddress,
            nickname: `User (synced from chain)`,
            city: '',
            skills: '[]',
            encryptionPubKey: '',
            contacts: null,
          },
        });
        console.log(`[SyncProfiles]   ✅ Synced with placeholder (after error)`);
        failed++;
      } catch (retryError: any) {
        console.error(`[SyncProfiles]   ❌ Failed to write placeholder: ${retryError.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('[SyncProfiles] 📊 Sync Summary:');
  console.log(`[SyncProfiles]   ✅ Synced (with metadata): ${synced}`);
  console.log(`[SyncProfiles]   ⚠️  Synced (with placeholder): ${failed}`);
  console.log(`[SyncProfiles]   📝 Total: ${synced + failed}`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('\n[SyncProfiles] ❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
