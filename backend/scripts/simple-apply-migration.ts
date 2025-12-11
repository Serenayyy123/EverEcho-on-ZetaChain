/**
 * 简单地应用 chainId 迁移
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('='.repeat(60));
  console.log('🔧 Applying ChainId Migration');
  console.log('='.repeat(60));

  try {
    console.log('\n🚀 Step 1: Creating new tables with chainId...');
    
    // 1. Create new ContactKey table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "new_ContactKey" (
        "chainId" TEXT NOT NULL,
        "taskId" TEXT NOT NULL,
        "creatorWrappedDEK" TEXT NOT NULL,
        "helperWrappedDEK" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("chainId", "taskId")
      )
    `);
    console.log('  ✅ new_ContactKey table created');

    // 2. Migrate ContactKey data
    await prisma.$executeRawUnsafe(`
      INSERT INTO "new_ContactKey" ("chainId", "createdAt", "creatorWrappedDEK", "helperWrappedDEK", "taskId")
      SELECT '84532', "createdAt", "creatorWrappedDEK", "helperWrappedDEK", "taskId" FROM "ContactKey"
    `);
    console.log('  ✅ ContactKey data migrated');

    // 3. Drop old ContactKey table
    await prisma.$executeRawUnsafe(`DROP TABLE "ContactKey"`);
    console.log('  ✅ Old ContactKey table dropped');

    // 4. Rename new table
    await prisma.$executeRawUnsafe(`ALTER TABLE "new_ContactKey" RENAME TO "ContactKey"`);
    console.log('  ✅ new_ContactKey renamed to ContactKey');

    // 5. Create index
    await prisma.$executeRawUnsafe(`CREATE INDEX "ContactKey_chainId_idx" ON "ContactKey"("chainId")`);
    console.log('  ✅ ContactKey index created');

    console.log('\n🚀 Step 2: Migrating Task table...');

    // 6. Create new Task table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "new_Task" (
        "chainId" TEXT NOT NULL,
        "taskId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "contactsEncryptedPayload" TEXT NOT NULL,
        "contactsPlaintext" TEXT,
        "createdAt" TEXT NOT NULL,
        "category" TEXT,
        "creator" TEXT,
        "updatedAt" DATETIME NOT NULL,
        PRIMARY KEY ("chainId", "taskId")
      )
    `);
    console.log('  ✅ new_Task table created');

    // 7. Migrate Task data
    await prisma.$executeRawUnsafe(`
      INSERT INTO "new_Task" ("chainId", "category", "contactsEncryptedPayload", "contactsPlaintext", "createdAt", "creator", "description", "taskId", "title", "updatedAt")
      SELECT '84532', "category", "contactsEncryptedPayload", "contactsPlaintext", "createdAt", "creator", "description", "taskId", "title", "updatedAt" FROM "Task"
    `);
    console.log('  ✅ Task data migrated');

    // 8. Drop old Task table
    await prisma.$executeRawUnsafe(`DROP TABLE "Task"`);
    console.log('  ✅ Old Task table dropped');

    // 9. Rename new table
    await prisma.$executeRawUnsafe(`ALTER TABLE "new_Task" RENAME TO "Task"`);
    console.log('  ✅ new_Task renamed to Task');

    // 10. Create index
    await prisma.$executeRawUnsafe(`CREATE INDEX "Task_chainId_idx" ON "Task"("chainId")`);
    console.log('  ✅ Task index created');

    console.log('\n✅ Migration completed successfully!');

  } catch (error: any) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Migration Complete');
  console.log('='.repeat(60));
}

applyMigration();
