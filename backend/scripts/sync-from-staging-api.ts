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
  console.log('=== Syncing Data from Staging API to Local ===\n');

  try {
    // 注意：这个方法只能同步公开的数据
    // 私密数据（如 contactsPlaintext）无法通过 API 获取
    
    console.log('⚠️  Warning: This script can only sync public data.');
    console.log('   Private data (contactsPlaintext, wrappedDEKs) cannot be synced via API.\n');

    // 获取所有任务 ID（从链上或 API）
    console.log('Fetching tasks from staging...');
    
    // 尝试获取任务 1-10
    let syncedTasks = 0;
    for (let taskId = 1; taskId <= 10; taskId++) {
      try {
        const taskData = await fetchJSON(`${STAGING_API}/api/task/${taskId}`);
        
        // 存储到本地数据库
        await prisma.task.upsert({
          where: {
            chainId_taskId: {
              chainId: '84532',
              taskId: taskId.toString(),
            },
          },
          update: {
            title: taskData.title,
            description: taskData.description,
            contactsEncryptedPayload: taskData.contactsEncryptedPayload,
            createdAt: taskData.createdAt?.toString() || Date.now().toString(),
            category: taskData.category,
            creator: taskData.creator,
          },
          create: {
            chainId: '84532',
            taskId: taskId.toString(),
            title: taskData.title,
            description: taskData.description,
            contactsEncryptedPayload: taskData.contactsEncryptedPayload,
            contactsPlaintext: '', // 无法从 API 获取
            createdAt: taskData.createdAt?.toString() || Date.now().toString(),
            category: taskData.category,
            creator: taskData.creator,
          },
        });
        
        console.log(`   ✅ Synced task ${taskId}: ${taskData.title}`);
        syncedTasks++;
      } catch (error: any) {
        if (error.message.includes('404')) {
          // 任务不存在，跳过
          continue;
        }
        console.log(`   ⚠️  Task ${taskId}: ${error.message}`);
      }
    }

    console.log(`\n=== Sync Complete ===`);
    console.log(`Synced ${syncedTasks} tasks from staging`);
    console.log('\n⚠️  Note: contactsPlaintext and ContactKeys were not synced.');
    console.log('   You need to register profiles and create tasks locally to test full functionality.');

  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
