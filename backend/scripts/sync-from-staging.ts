import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载本地环境变量
dotenv.config({ path: path.join(__dirname, '../.env') });

const localPrisma = new PrismaClient();

// Staging 数据库连接（从环境变量或硬编码）
const STAGING_DATABASE_URL = process.env.STAGING_DATABASE_URL || 
  'postgresql://everecho_staging_db_user:your_password@dpg-xxx.oregon-postgres.render.com/everecho_staging_db';

const stagingPrisma = new PrismaClient({
  datasources: {
    db: {
      url: STAGING_DATABASE_URL,
    },
  },
});

async function main() {
  console.log('=== Syncing Data from Staging to Local ===\n');

  try {
    // 1. 同步 Profiles
    console.log('1. Syncing Profiles...');
    const stagingProfiles = await stagingPrisma.profile.findMany({
      where: { chainId: 84532 }, // 只同步 Base Sepolia 的数据
    });
    
    for (const profile of stagingProfiles) {
      await localPrisma.profile.upsert({
        where: { address: profile.address },
        update: profile,
        create: profile,
      });
    }
    console.log(`   ✅ Synced ${stagingProfiles.length} profiles`);

    // 2. 同步 Tasks
    console.log('2. Syncing Tasks...');
    const stagingTasks = await stagingPrisma.task.findMany({
      where: { chainId: 84532 },
    });
    
    for (const task of stagingTasks) {
      await localPrisma.task.upsert({
        where: {
          chainId_taskId: {
            chainId: task.chainId,
            taskId: task.taskId,
          },
        },
        update: task,
        create: task,
      });
    }
    console.log(`   ✅ Synced ${stagingTasks.length} tasks`);

    // 3. 同步 ContactKeys
    console.log('3. Syncing ContactKeys...');
    const stagingContactKeys = await stagingPrisma.contactKey.findMany({
      where: { chainId: 84532 },
    });
    
    for (const key of stagingContactKeys) {
      await localPrisma.contactKey.upsert({
        where: {
          chainId_taskId: {
            chainId: key.chainId,
            taskId: key.taskId,
          },
        },
        update: key,
        create: key,
      });
    }
    console.log(`   ✅ Synced ${stagingContactKeys.length} contact keys`);

    console.log('\n=== Sync Complete ===');
    console.log(`Total: ${stagingProfiles.length} profiles, ${stagingTasks.length} tasks, ${stagingContactKeys.length} keys`);

  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await localPrisma.$disconnect();
    await stagingPrisma.$disconnect();
  });
