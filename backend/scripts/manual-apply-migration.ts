/**
 * 手动应用 chainId 迁移
 * 直接使用 Prisma 的 $executeRawUnsafe 来执行 SQL
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function manualApplyMigration() {
  console.log('='.repeat(60));
  console.log('🔧 Manually Applying ChainId Migration');
  console.log('='.repeat(60));

  try {
    // 读取迁移 SQL 文件
    const migrationPath = path.join(
      __dirname,
      '../prisma/migrations/20251126061750_add_chainid_isolation/migration.sql'
    );
    
    console.log('\n📖 Reading migration file...');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log('  ✅ Migration file loaded');

    // 分割 SQL 语句（按分号分割，但要小心注释）
    const statements = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('/*') && line.trim())
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`\n🚀 Executing ${statements.length} SQL statements...`);

    // 执行每个语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.includes('PRAGMA') || statement.includes('CREATE') || 
          statement.includes('INSERT') || statement.includes('DROP') || 
          statement.includes('ALTER')) {
        console.log(`  ${i + 1}. Executing: ${statement.substring(0, 50)}...`);
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log(`     ✅ Success`);
        } catch (error: any) {
          console.error(`     ❌ Failed: ${error.message}`);
          throw error;
        }
      }
    }

    console.log('\n✅ All SQL statements executed successfully!');

    // 更新迁移记录
    console.log('\n📝 Updating migration record...');
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (
        lower(hex(randomblob(16))),
        '${generateChecksum()}',
        datetime('now'),
        '20251126061750_add_chainid_isolation',
        NULL,
        NULL,
        datetime('now'),
        1
      )
    `);
    console.log('  ✅ Migration record updated');

  } catch (error: any) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Migration Complete');
  console.log('='.repeat(60));
}

function generateChecksum(): string {
  // 简单的校验和生成
  return Math.random().toString(36).substring(2, 15);
}

manualApplyMigration();
