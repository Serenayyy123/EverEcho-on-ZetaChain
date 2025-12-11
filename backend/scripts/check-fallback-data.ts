/**
 * 检查 fallback 数据是否正确写入
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { getCurrentChainId } from '../src/config/chainConfig';

const prisma = new PrismaClient();

async function main() {
  const chainId = getCurrentChainId();
  
  console.log('🔍 Checking fallback data in database...\n');
  
  const tasks = await prisma.task.findMany({
    where: { chainId },
    orderBy: { taskId: 'asc' },
  });
  
  console.log(`Found ${tasks.length} tasks:\n`);
  
  tasks.forEach((task) => {
    const isFallback = task.title.includes('(synced from chain)');
    console.log(`Task ${task.taskId}:`);
    console.log(`  Title: ${task.title}`);
    console.log(`  Description: ${task.description.substring(0, 50)}...`);
    console.log(`  Is Fallback: ${isFallback ? '🔄 YES' : '✅ NO'}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
