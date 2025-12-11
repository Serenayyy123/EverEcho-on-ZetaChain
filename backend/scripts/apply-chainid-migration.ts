/**
 * 应用 chainId 迁移
 * 这个脚本会关闭所有数据库连接，然后应用迁移
 */

import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function applyMigration() {
  console.log('='.repeat(60));
  console.log('🔧 Applying ChainId Migration');
  console.log('='.repeat(60));

  // 1. 确保所有 Prisma 连接都关闭
  console.log('\n📌 Step 1: Closing all database connections...');
  const prisma = new PrismaClient();
  await prisma.$disconnect();
  console.log('  ✅ Connections closed');

  // 2. 等待一下确保锁释放
  console.log('\n⏳ Step 2: Waiting for database lock to release...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('  ✅ Wait complete');

  // 3. 应用迁移
  console.log('\n🚀 Step 3: Applying migration...');
  try {
    const { stdout, stderr } = await execAsync('npx prisma migrate dev', {
      cwd: process.cwd(),
    });
    
    console.log(stdout);
    if (stderr) {
      console.error('Stderr:', stderr);
    }
    
    console.log('\n✅ Migration applied successfully!');
  } catch (error: any) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    if (error.stdout) console.log('Stdout:', error.stdout);
    if (error.stderr) console.error('Stderr:', error.stderr);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Migration Complete');
  console.log('='.repeat(60));
}

applyMigration();
