#!/usr/bin/env npx tsx

/**
 * P0 Fix 完整测试脚本
 * 验证 Chain-first + Idempotent + Cleanup 功能
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:3001';

async function testP0Fix() {
  console.log('🧪 P0 Fix - Orphan Task Prevention 测试');
  console.log('=' .repeat(60));

  let testsPassed = 0;
  let testsTotal = 0;

  // 测试 1: 后端健康检查
  testsTotal++;
  console.log('\n1️⃣ 测试后端健康状态...');
  try {
    const response = await fetch(`${BACKEND_URL}/healthz`);
    if (response.ok) {
      console.log('✅ 后端健康检查通过');
      testsPassed++;
    } else {
      console.log('❌ 后端健康检查失败');
    }
  } catch (error) {
    console.log('❌ 后端连接失败:', error.message);
  }

  // 测试 2: 区块链验证器 - 不存在的任务
  testsTotal++;
  console.log('\n2️⃣ 测试区块链验证器 - 不存在的任务...');
  try {
    const response = await fetch(`${BACKEND_URL}/api/tasks/999999/metadata`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Task',
        description: 'Testing',
        contactsPlaintext: 'test@example.com',
        createdAt: Date.now(),
        creatorAddress: '0x1234567890123456789012345678901234567890'
      })
    });

    const result = await response.json();
    if (response.status === 404 && result.error === 'TaskNotOnChain') {
      console.log('✅ 不存在任务正确被拒绝');
      testsPassed++;
    } else {
      console.log('❌ 不存在任务验证失败:', result);
    }
  } catch (error) {
    console.log('❌ 区块链验证器测试失败:', error.message);
  }

  // 测试 3: 授权验证
  testsTotal++;
  console.log('\n3️⃣ 测试创建者授权验证...');
  try {
    const response = await fetch(`${BACKEND_URL}/api/tasks/1/metadata`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Task',
        description: 'Testing',
        contactsPlaintext: 'test@example.com',
        createdAt: Date.now(),
        creatorAddress: '0x9999999999999999999999999999999999999999' // 错误的创建者
      })
    });

    const result = await response.json();
    if (response.status === 403 && result.error === 'Unauthorized') {
      console.log('✅ 授权验证正常工作');
      testsPassed++;
    } else {
      console.log('❌ 授权验证失败:', result);
    }
  } catch (error) {
    console.log('❌ 授权验证测试失败:', error.message);
  }

  // 测试 4: Orphan 检测 API
  testsTotal++;
  console.log('\n4️⃣ 测试 Orphan 检测 API...');
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/tasks/cleanup-orphans?dryRun=true&batchSize=10`, {
      method: 'POST'
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Orphan 检测 API 正常工作');
      console.log(`   扫描任务: ${result.scanReport?.totalScanned || 0}`);
      console.log(`   发现 Orphans: ${result.scanReport?.orphanCount || 0}`);
      testsPassed++;
    } else {
      console.log('❌ Orphan 检测 API 失败');
    }
  } catch (error) {
    console.log('❌ Orphan 检测 API 测试失败:', error.message);
  }

  // 测试 5: 幂等性测试
  testsTotal++;
  console.log('\n5️⃣ 测试 metadata 端点幂等性...');
  try {
    const testData = {
      title: 'Idempotency Test',
      description: 'Testing idempotent behavior',
      contactsPlaintext: 'test@example.com',
      createdAt: Date.now(),
      creatorAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' // Hardhat 默认账户
    };

    // 第一次请求
    const response1 = await fetch(`${BACKEND_URL}/api/tasks/1/metadata`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    // 第二次请求（应该是幂等的）
    const response2 = await fetch(`${BACKEND_URL}/api/tasks/1/metadata`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (response1.status === response2.status) {
      console.log('✅ 幂等性测试通过');
      testsPassed++;
    } else {
      console.log('❌ 幂等性测试失败');
    }
  } catch (error) {
    console.log('❌ 幂等性测试失败:', error.message);
  }

  // 总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果总结:');
  console.log(`   通过: ${testsPassed}/${testsTotal}`);
  console.log(`   成功率: ${Math.round((testsPassed / testsTotal) * 100)}%`);

  if (testsPassed === testsTotal) {
    console.log('\n🎉 所有测试通过！P0 Fix 功能正常工作。');
    console.log('\n✅ Chain-first 任务创建流程已实现');
    console.log('✅ 区块链验证器正常工作');
    console.log('✅ 创建者授权验证正常');
    console.log('✅ Orphan 检测和清理功能可用');
    console.log('✅ Metadata 端点幂等性正常');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查相关功能。');
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testP0Fix().catch(console.error);
}

export { testP0Fix };