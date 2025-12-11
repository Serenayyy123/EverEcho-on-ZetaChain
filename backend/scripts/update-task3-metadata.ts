/**
 * 手动更新 Task 3 的 metadata 为正确的数据
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const CURRENT_CHAIN_ID = process.env.CHAIN_ID || '84532';

async function updateTask3Metadata() {
  console.log('='.repeat(60));
  console.log('🔧 Updating Task 3 Metadata');
  console.log('='.repeat(60));

  try {
    // 新的正确数据
    const newTitle = "Wish a coffee chat with someone in DeFi";
    const newDescription = "I'm interested in learning more about DeFi and would love to chat with someone experienced in this field.";
    const newCategory = "social"; // 或者其他合适的 category

    console.log('\n📝 New metadata:');
    console.log('  title:', newTitle);
    console.log('  description:', newDescription);
    console.log('  category:', newCategory);

    // 更新数据库
    console.log('\n🔄 Updating database...');
    const updated = await prisma.task.update({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId: '3' }
      },
      data: {
        title: newTitle,
        description: newDescription,
        category: newCategory,
      },
    });

    console.log('\n✅ Task 3 updated successfully!');
    console.log('  Updated title:', updated.title);
    console.log('  Updated category:', updated.category);

    console.log('\n📝 Next steps:');
    console.log('  1. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('  2. Refresh TaskSquare');
    console.log('  3. Task 3 should now show the correct data');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Update Complete');
  console.log('='.repeat(60));
}

updateTask3Metadata();
