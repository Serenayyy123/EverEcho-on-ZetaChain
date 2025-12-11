/**
 * 环境自检脚本
 * 用于确认当前运行环境的链配置和数据库状态
 */

import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkEnvironment() {
  console.log('='.repeat(60));
  console.log('🔍 Environment Self-Check');
  console.log('='.repeat(60));

  // 1. 后端配置
  console.log('\n📋 Backend Configuration:');
  console.log(`  RPC_URL: ${process.env.RPC_URL}`);
  console.log(`  CHAIN_ID: ${process.env.CHAIN_ID}`);
  console.log(`  TASK_ESCROW_ADDRESS: ${process.env.TASK_ESCROW_ADDRESS}`);
  console.log(`  DATABASE_URL: ${process.env.DATABASE_URL}`);

  // 2. 链上状态
  console.log('\n⛓️  On-Chain Status:');
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const network = await provider.getNetwork();
    console.log(`  Connected ChainId: ${network.chainId}`);
    
    const contract = new ethers.Contract(
      process.env.TASK_ESCROW_ADDRESS!,
      ['function taskCounter() view returns (uint256)'],
      provider
    );
    
    const taskCounter = await contract.taskCounter();
    console.log(`  Task Counter: ${taskCounter}`);
  } catch (error) {
    console.error(`  ❌ Failed to connect to chain:`, error);
  }

  // 3. 数据库状态
  console.log('\n💾 Database Status:');
  try {
    const taskCount = await prisma.task.count();
    console.log(`  Total Tasks in DB: ${taskCount}`);
    
    const tasks = await prisma.task.findMany({
      take: 5,
      orderBy: { taskId: 'asc' },
      select: {
        taskId: true,
        title: true,
        category: true,
        creator: true,
      },
    });
    
    console.log(`  Sample Tasks:`);
    tasks.forEach(task => {
      console.log(`    - Task ${task.taskId}: "${task.title}" (${task.category || 'no category'})`);
    });

    const profileCount = await prisma.profile.count();
    console.log(`  Total Profiles in DB: ${profileCount}`);

    const contactKeyCount = await prisma.contactKey.count();
    console.log(`  Total ContactKeys in DB: ${contactKeyCount}`);
  } catch (error) {
    console.error(`  ❌ Failed to query database:`, error);
  }

  // 4. 数据库 Schema 检查
  console.log('\n🔧 Schema Check:');
  const hasChainId = await checkIfTableHasColumn('Task', 'chainId');
  console.log(`  Task table has chainId field: ${hasChainId ? '✅ YES' : '❌ NO'}`);
  
  if (!hasChainId) {
    console.log(`  ⚠️  WARNING: Database does NOT have chainId isolation!`);
    console.log(`  ⚠️  This means tasks from different chains will mix together!`);
  }

  // 5. 环境一致性检查
  console.log('\n✅ Consistency Check:');
  const envChainId = process.env.CHAIN_ID;
  const rpcUrl = process.env.RPC_URL;
  
  if (envChainId === '84532' && rpcUrl?.includes('base.org')) {
    console.log(`  ✅ Backend is configured for Base Sepolia (84532)`);
  } else if (envChainId === '11155111' && rpcUrl?.includes('sepolia')) {
    console.log(`  ⚠️  Backend is configured for Sepolia (11155111)`);
  } else {
    console.log(`  ❌ Backend configuration mismatch!`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Check Complete');
  console.log('='.repeat(60));

  await prisma.$disconnect();
}

async function checkIfTableHasColumn(tableName: string, columnName: string): Promise<boolean> {
  try {
    // SQLite specific query
    const result = await prisma.$queryRawUnsafe<any[]>(
      `PRAGMA table_info(${tableName})`
    );
    return result.some((col: any) => col.name === columnName);
  } catch (error) {
    return false;
  }
}

checkEnvironment();
