/**
 * 测试区块链任务验证器
 * P0 Fix 验证脚本
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:3001';

async function testBlockchainValidator() {
  console.log('🧪 Testing Blockchain Task Validator');
  console.log('=' .repeat(40));

  try {
    // 1. 测试健康检查
    console.log('🏥 Testing backend health...');
    const healthResponse = await fetch(`${BACKEND_URL}/healthz`);
    if (healthResponse.ok) {
      console.log('✅ Backend is healthy');
    } else {
      throw new Error('Backend health check failed');
    }

    // 2. 测试不存在的任务
    console.log('\n🚫 Testing non-existent task validation...');
    const nonExistentTaskId = '999999';
    
    const testMetadata = {
      title: 'Test Task',
      description: 'Testing metadata endpoint',
      contactsPlaintext: 'test@example.com',
      category: 'development',
      createdAt: Date.now(),
      creatorAddress: '0x1234567890123456789012345678901234567890'
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${nonExistentTaskId}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMetadata),
      });

      const result = await response.json();
      
      if (response.status === 404 && result.error === 'TaskNotOnChain') {
        console.log('✅ Non-existent task validation passed:', result.message);
      } else {
        console.log('❌ Non-existent task validation failed:', result);
      }
    } catch (error) {
      console.error('❌ Non-existent task test failed:', error);
    }

    // 3. 测试现有任务（如果有的话）
    console.log('\n🔍 Testing existing task validation...');
    
    // 尝试任务 ID 1, 2, 3
    for (const taskId of ['1', '2', '3']) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/metadata`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...testMetadata,
            creatorAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' // Hardhat 默认账户
          }),
        });

        const result = await response.json();
        console.log(`Task ${taskId} response:`, {
          status: response.status,
          message: result.message || result.error
        });
        
        if (response.ok || response.status === 403) {
          // 成功或授权失败都是预期的
          break;
        }
      } catch (error) {
        console.log(`Task ${taskId} test error:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(40));
    console.log('🎉 Blockchain validator testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testBlockchainValidator().catch(console.error);
}

export { testBlockchainValidator };