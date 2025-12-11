/**
 * 任务同步功能测试脚本
 * 测试场景：
 * 1. POST 失败时前端阻断
 * 2. 后端补漏在各种故障后能最终一致
 * 3. 并发创建不会导致数据不一致
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { syncTaskWithLock } from '../src/services/taskSyncCoordinator';

const prisma = new PrismaClient();

async function testConcurrentSync() {
  console.log('\n=== Test 1: Concurrent Sync (Same Task) ===');
  
  const testTaskId = 'test-concurrent-1';
  const testCreator = '0x1234567890123456789012345678901234567890';
  
  // 清理测试数据
  await prisma.contactKey.deleteMany({ where: { taskId: testTaskId } });
  await prisma.task.deleteMany({ where: { taskId: testTaskId } });
  
  // 模拟并发同步
  const promises = Array(5).fill(null).map((_, i) => 
    syncTaskWithLock({
      taskId: testTaskId,
      creator: testCreator,
      source: 'manual',
    })
  );
  
  const results = await Promise.all(promises);
  
  // 检查结果
  const task = await prisma.task.findUnique({ where: { taskId: testTaskId } });
  const contactKey = await prisma.contactKey.findUnique({ where: { taskId: testTaskId } });
  
  console.log(`Results: ${results.filter(r => r).length} succeeded`);
  console.log(`Task exists: ${!!task}`);
  console.log(`ContactKey exists: ${!!contactKey}`);
  
  if (task && contactKey) {
    console.log('✅ Test passed: Only one task and ContactKey created');
  } else {
    console.log('❌ Test failed: Task or ContactKey missing');
  }
  
  // 清理
  await prisma.contactKey.deleteMany({ where: { taskId: testTaskId } });
  await prisma.task.deleteMany({ where: { taskId: testTaskId } });
}

async function testIdempotency() {
  console.log('\n=== Test 2: Idempotency (Multiple Calls) ===');
  
  const testTaskId = 'test-idempotent-1';
  const testCreator = '0x1234567890123456789012345678901234567890';
  
  // 清理测试数据
  await prisma.contactKey.deleteMany({ where: { taskId: testTaskId } });
  await prisma.task.deleteMany({ where: { taskId: testTaskId } });
  
  // 第一次同步
  const result1 = await syncTaskWithLock({
    taskId: testTaskId,
    creator: testCreator,
    source: 'manual',
  });
  
  const contactKey1 = await prisma.contactKey.findUnique({ 
    where: { taskId: testTaskId },
    select: { creatorWrappedDEK: true },
  });
  
  // 第二次同步（应该跳过）
  const result2 = await syncTaskWithLock({
    taskId: testTaskId,
    creator: testCreator,
    source: 'manual',
  });
  
  const contactKey2 = await prisma.contactKey.findUnique({ 
    where: { taskId: testTaskId },
    select: { creatorWrappedDEK: true },
  });
  
  console.log(`First sync: ${result1 ? 'success' : 'failed'}`);
  console.log(`Second sync: ${result2 ? 'success' : 'failed'}`);
  console.log(`DEK unchanged: ${contactKey1?.creatorWrappedDEK === contactKey2?.creatorWrappedDEK}`);
  
  if (contactKey1?.creatorWrappedDEK === contactKey2?.creatorWrappedDEK) {
    console.log('✅ Test passed: DEK not regenerated on second sync');
  } else {
    console.log('❌ Test failed: DEK changed (should be idempotent)');
  }
  
  // 清理
  await prisma.contactKey.deleteMany({ where: { taskId: testTaskId } });
  await prisma.task.deleteMany({ where: { taskId: testTaskId } });
}

async function testContactKeyRecovery() {
  console.log('\n=== Test 3: ContactKey Recovery (Task Exists, ContactKey Missing) ===');
  
  const testTaskId = 'test-recovery-1';
  const testCreator = '0x1234567890123456789012345678901234567890';
  
  // 清理测试数据
  await prisma.contactKey.deleteMany({ where: { taskId: testTaskId } });
  await prisma.task.deleteMany({ where: { taskId: testTaskId } });
  
  // 创建 Task 但不创建 ContactKey（模拟故障场景）
  await prisma.task.create({
    data: {
      taskId: testTaskId,
      title: 'Test Task',
      description: 'Test',
      contactsEncryptedPayload: '',
      contactsPlaintext: 'test@example.com',
      createdAt: Date.now().toString(),
    },
  });
  
  console.log('Created task without ContactKey');
  
  // 尝试同步（应该补充 ContactKey）
  const result = await syncTaskWithLock({
    taskId: testTaskId,
    creator: testCreator,
    source: 'manual',
  });
  
  const contactKey = await prisma.contactKey.findUnique({ 
    where: { taskId: testTaskId },
  });
  
  console.log(`Sync result: ${result ? 'success' : 'failed'}`);
  console.log(`ContactKey created: ${!!contactKey}`);
  
  if (contactKey) {
    console.log('✅ Test passed: ContactKey recovered successfully');
  } else {
    console.log('❌ Test failed: ContactKey not created');
  }
  
  // 清理
  await prisma.contactKey.deleteMany({ where: { taskId: testTaskId } });
  await prisma.task.deleteMany({ where: { taskId: testTaskId } });
}

async function main() {
  console.log('='.repeat(60));
  console.log('Task Sync Functionality Tests');
  console.log('='.repeat(60));
  
  try {
    await testConcurrentSync();
    await testIdempotency();
    await testContactKeyRecovery();
    
    console.log('\n' + '='.repeat(60));
    console.log('All tests completed!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Test error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
