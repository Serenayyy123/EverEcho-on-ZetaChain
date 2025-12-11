import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('=== Checking Local Database ===\n');

  // 检查 Profile 数量
  const profileCount = await prisma.profile.count();
  console.log(`Profiles: ${profileCount}`);

  // 检查 Task 数量
  const taskCount = await prisma.task.count();
  console.log(`Tasks: ${taskCount}`);

  // 检查 ContactKey 数量
  const contactKeyCount = await prisma.contactKey.count();
  console.log(`ContactKeys: ${contactKeyCount}`);

  console.log('\n=== Database Status ===');
  if (profileCount === 0 && taskCount === 0) {
    console.log('✅ Database is empty (expected after PG migration)');
    console.log('💡 You need to register a new profile and create tasks');
  } else {
    console.log(`✅ Database has data: ${profileCount} profiles, ${taskCount} tasks`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
