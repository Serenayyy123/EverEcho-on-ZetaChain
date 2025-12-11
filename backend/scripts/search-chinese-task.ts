/**
 * 搜索包含中文的任务
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Searching for tasks with Chinese content...\n');
  
  const allTasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
  });
  
  console.log(`Total tasks: ${allTasks.length}\n`);
  
  allTasks.forEach((task) => {
    console.log(`Task ID: ${task.taskId}`);
    console.log(`  Title: ${task.title}`);
    console.log(`  Description: ${task.description.slice(0, 100)}...`);
    console.log(`  Created: ${new Date(parseInt(task.createdAt)).toLocaleString()}`);
    console.log('');
  });
  
  // 搜索包含"猫"或"成都"的任务
  const chineseTasks = allTasks.filter(t => 
    t.title.includes('猫') || 
    t.title.includes('成都') || 
    t.description.includes('猫') || 
    t.description.includes('成都')
  );
  
  if (chineseTasks.length > 0) {
    console.log('\n✅ Found Chinese tasks:');
    chineseTasks.forEach(t => {
      console.log(`  Task ${t.taskId}: ${t.title}`);
    });
  } else {
    console.log('\n❌ No Chinese tasks found');
    console.log('The task might not have been saved to the database.');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
