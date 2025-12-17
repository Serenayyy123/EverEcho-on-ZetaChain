/**
 * 测试 Chain-first 任务创建流程
 * P0 Fix 验证脚本
 */

import { ethers } from 'ethers';
import fetch from 'node-fetch';

// 配置 - 从后端环境变量读取
const RPC_URL = 'http://localhost:8545'; // 本地 hardhat
const TASK_ESCROW_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // 修复后的TaskEscrow地址
const BACKEND_URL = 'http://localhost:3001';

// TaskEscrow ABI (简化版)
const TASK_ESCROW_ABI = [
  'function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt, uint256 echoPostFee, address rewardAsset, uint256 rewardAmount)',
  'function taskCounter() view returns (uint256)',
  'event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 reward, string taskURI)'
];

async function testChainFirstFlow() {
  console.log('🧪 Testing Chain-first Task Creation Flow');
  console.log('=' .repeat(50));

  try {
    // 1. 连接到区块链
    console.log('📡 Connecting to blockchain...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(TASK_ESCROW_ADDRESS, TASK_ESCROW_ABI, provider);

    // 2. 获取当前 taskCounter
    console.log('📋 Getting current task counter...');
    const taskCounter = await contract.taskCounter();
    console.log(`Current task counter: ${taskCounter}`);

    // 3. 测试现有任务的验证
    if (taskCounter > 0) {
      console.log('\n🔍 Testing existing task validation...');
      const taskId = '1'; // 测试任务 1
      
      // 读取链上任务数据
      const taskData = await contract.tasks(taskId);
      console.log(`Task ${taskId} on blockchain:`, {
        creator: taskData[1],
        reward: taskData[3].toString(),
        status: taskData[5].toString(),
        taskURI: taskData[4]
      });

      // 4. 测试新的 metadata 端点
      console.log('\n📝 Testing metadata endpoint...');
      
      const testMetadata = {
        title: 'Test Chain-first Task',
        description: 'Testing the new chain-first metadata endpoint',
        contactsPlaintext: 'test@example.com',
        category: 'development',
        createdAt: Date.now(),
        creatorAddress: taskData[1] // 使用链上的真实创建者地址
      };

      try {
        const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/metadata`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testMetadata),
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log('✅ Metadata endpoint test passed:', result);
        } else {
          console.log('⚠️ Metadata endpoint returned error (expected for existing task):', result);
        }
      } catch (error) {
        console.error('❌ Metadata endpoint test failed:', error);
      }

      // 5. 测试不存在的任务
      console.log('\n🚫 Testing non-existent task validation...');
      const nonExistentTaskId = (Number(taskCounter) + 100).toString();
      
      try {
        const response = await fetch(`${BACKEND_URL}/api/tasks/${nonExistentTaskId}/metadata`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...testMetadata,
            creatorAddress: '0x1234567890123456789012345678901234567890'
          }),
        });

        const result = await response.json();
        
        if (response.status === 404 && result.error === 'TaskNotOnChain') {
          console.log('✅ Non-existent task validation passed:', result);
        } else {
          console.log('❌ Non-existent task validation failed:', result);
        }
      } catch (error) {
        console.error('❌ Non-existent task test failed:', error);
      }

      // 6. 测试授权验证
      console.log('\n🔐 Testing authorization validation...');
      
      try {
        const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/metadata`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...testMetadata,
            creatorAddress: '0x9999999999999999999999999999999999999999' // 错误的创建者地址
          }),
        });

        const result = await response.json();
        
        if (response.status === 403 && result.error === 'Unauthorized') {
          console.log('✅ Authorization validation passed:', result);
        } else {
          console.log('❌ Authorization validation failed:', result);
        }
      } catch (error) {
        console.error('❌ Authorization test failed:', error);
      }
    } else {
      console.log('⚠️ No tasks found on blockchain, skipping validation tests');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Chain-first flow testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testChainFirstFlow().catch(console.error);
}

export { testChainFirstFlow };