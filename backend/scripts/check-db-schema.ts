/**
 * 检查数据库实际的 Schema
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchema() {
  console.log('='.repeat(60));
  console.log('🔍 Checking Database Schema');
  console.log('='.repeat(60));

  try {
    // 使用原始 SQL 查询表结构
    const taskSchema = await prisma.$queryRaw`
      PRAGMA table_info(Task);
    `;
    
    console.log('\n📋 Task Table Schema:');
    const taskFields = taskSchema as any[];
    taskFields.forEach((field: any) => {
      console.log(`  - ${field.name}: ${field.type} (pk: ${field.pk})`);
    });

    const contactKeySchema = await prisma.$queryRaw`
      PRAGMA table_info(ContactKey);
    `;
    
    console.log('\n📋 ContactKey Table Schema:');
    const contactKeyFields = contactKeySchema as any[];
    contactKeyFields.forEach((field: any) => {
      console.log(`  - ${field.name}: ${field.type} (pk: ${field.pk})`);
    });

    // 检查是否有 chainId 字段
    const hasChainId = taskFields.some((field: any) => field.name === 'chainId');
    
    console.log('\n🔧 Verification:');
    console.log(`  Task table has chainId: ${hasChainId ? '✅ YES' : '❌ NO'}`);
    
    if (!hasChainId) {
      console.log('\n⚠️  WARNING: chainId field is missing!');
      console.log('  The migration may not have been applied correctly.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Check Complete');
  console.log('='.repeat(60));
}

checkSchema();
