/**
 * 修复 Task 3 的 category 为 coffeechat
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const CURRENT_CHAIN_ID = process.env.CHAIN_ID || '84532';

async function fixTask3Category() {
  console.log('='.repeat(60));
  console.log('🔧 Fixing Task 3 Category');
  console.log('='.repeat(60));

  try {
    // 更新 category 为 coffeechat
    console.log('\n🔄 Updating Task 3 category to "coffeechat"...');
    const updated = await prisma.task.update({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId: '3' }
      },
      data: {
        category: 'coffeechat',
      },
    });

    console.log('\n✅ Task 3 category updated successfully!');
    console.log('  Title:', updated.title);
    console.log('  Category:', updated.category);
    console.log('  Expected badge: "Coffee Chat / Coffeechat" (violet)');

    console.log('\n📝 Next steps:');
    console.log('  1. Refresh the browser (F5 or Ctrl+R)');
    console.log('  2. Task 3 should now show "Coffee Chat / Coffeechat" badge');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Fix Complete');
  console.log('='.repeat(60));
}

fixTask3Category();
