#!/usr/bin/env tsx

/**
 * 测试自动重试机制
 * 验证 API 客户端的重试逻辑是否正常工作
 */

import { apiClient } from '../frontend/src/api/client';

async function testAutoRetryMechanism() {
  console.log('🧪 Testing Auto-Retry Mechanism');
  console.log('================================');

  // Test 1: 测试健康检查（应该成功）
  console.log('\n1. Testing Health Check (should succeed)...');
  try {
    const health = await apiClient.healthCheck();
    console.log('✅ Health check successful:', health);
  } catch (error) {
    console.log('❌ Health check failed:', error);
  }

  // Test 2: 测试不存在的端点（应该重试后失败）
  console.log('\n2. Testing non-existent endpoint (should retry then fail)...');
  try {
    const result = await (apiClient as any).request('/api/nonexistent', { method: 'GET' });
    console.log('❌ Unexpected success:', result);
  } catch (error) {
    console.log('✅ Expected failure after retries:', error.message);
  }

  // Test 3: 测试联系方式解密（模拟请求）
  console.log('\n3. Testing contacts decrypt with invalid data (should retry then fail)...');
  try {
    const result = await apiClient.decryptContacts({
      taskId: 'invalid',
      address: '0x0000000000000000000000000000000000000000',
      signature: 'invalid',
      message: 'invalid'
    });
    console.log('❌ Unexpected success:', result);
  } catch (error) {
    console.log('✅ Expected failure after retries:', error.message);
  }

  // Test 4: 测试 Profile API
  console.log('\n4. Testing profile API with invalid data...');
  try {
    const result = await apiClient.getProfile('invalid-profile-uri');
    console.log('❌ Unexpected success:', result);
  } catch (error) {
    console.log('✅ Expected failure:', error.message);
  }

  console.log('\n🎯 Auto-Retry Mechanism Test Complete');
  console.log('=====================================');
  console.log('The retry mechanism should now handle:');
  console.log('- HTTP 404 errors (especially for contacts decryption)');
  console.log('- Network connection issues');
  console.log('- Server errors (5xx)');
  console.log('- Automatic exponential backoff');
  console.log('\nCheck the console logs above to see retry attempts in action.');
}

// 运行测试
testAutoRetryMechanism().catch(console.error);