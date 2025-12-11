/**
 * 简单查询 Task 3 的数据
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function queryTask3() {
  console.log('=== Querying Task 3 ===\n');

  try {
    // 查询 task 3
    const task = await prisma.task.findUnique({
      where: { taskId: '3' },
    });

    if (task) {
      console.log('Task 3 found in database:');
      console.log(JSON.stringify(task, null, 2));
    } else {
      console.log('Task 3 NOT FOUND in database');
    }

    // 查询所有任务
    console.log('\n=== All Tasks ===\n');
    const allTasks = await prisma.task.findMany({
      orderBy: { taskId: 'asc' },
    });

    console.log(`Total tasks: ${allTasks.length}`);
    allTasks.forEach(task => {
      console.log(`\nTask ${task.taskId}:`);
      console.log(`  Title: ${task.title}`);
      console.log(`  Description: ${task.description.substring(0, 100)}...`);
      console.log(`  CreatedAt: ${task.createdAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

queryTask3();
