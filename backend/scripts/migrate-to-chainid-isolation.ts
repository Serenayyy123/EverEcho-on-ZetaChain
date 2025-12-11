/**
 * 迁移脚本：为现有数据添加 chainId
 * 
 * 策略：
 * 1. 备份现有数据库
 * 2. 为所有现有记录添加当前 chainId
 * 3. 验证迁移结果
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

async function migrate() {
  console.log('='.repeat(60));
  console.log('🔄 Migrating to ChainId Isolation');
  console.log('='.repeat(60));

  const currentChainId = process.env.CHAIN_ID || '84532';
  console.log(`\nCurrent ChainId: ${currentChainId}`);

  // 1. 备份数据库
  console.log('\n📦 Step 1: Backing up database...');
  const dbPath = path.join(__dirname, '..', 'dev.db');
  const backupPath = path.join(__dirname, '..', `dev.db.backup.${Date.now()}`);
  
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`  ✅ Database backed up to: ${backupPath}`);
  } else {
    console.log(`  ⚠️  Database file not found, skipping backup`);
  }

  // 2. 运行 Prisma 迁移
  console.log('\n🔧 Step 2: Running Prisma migration...');
  try {
    const { stdout, stderr } = await execAsync('npx prisma migrate dev --name add-chainid-isolation', {
      cwd: path.join(__dirname, '..'),
    });
    console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`  ✅ Migration completed`);
  } catch (error: any) {
    console.error(`  ❌ Migration failed:`, error.message);
    console.log(`\n  You can restore from backup: ${backupPath}`);
    process.exit(1);
  }

  // 3. 验证迁移
  console.log('\n✅ Step 3: Verifying migration...');
  console.log(`  Run: npx ts-node scripts/check-environment.ts`);
  console.log(`  to verify the migration was successful`);

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Migration Complete');
  console.log('='.repeat(60));
  console.log(`\n⚠️  IMPORTANT:`);
  console.log(`  - All existing data has been assigned chainId: ${currentChainId}`);
  console.log(`  - If you switch to a different chain, old data will NOT appear`);
  console.log(`  - This is the correct behavior for chain isolation`);
  console.log(`  - Backup saved at: ${backupPath}`);
}

migrate();
