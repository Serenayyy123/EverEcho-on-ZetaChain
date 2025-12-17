#!/usr/bin/env tsx

/**
 * 修复 TaskID 解析问题的解决方案
 */

import { ethers } from 'ethers';

// 正确的 TaskID 解析方法
export async function parseTaskIdFromReceipt(
  provider: ethers.Provider,
  txHash: string,
  taskEscrowAddress: string
): Promise<number | null> {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }

    // TaskEscrow 合约的 TaskCreated 事件 ABI
    const taskCreatedEventABI = [
      "event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 reward, string taskURI)"
    ];

    const iface = new ethers.Interface(taskCreatedEventABI);

    // 查找 TaskCreated 事件
    for (const log of receipt.logs) {
      try {
        if (log.address.toLowerCase() === taskEscrowAddress.toLowerCase()) {
          const parsed = iface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsed && parsed.name === 'TaskCreated') {
            const taskId = Number(parsed.args.taskId);
            console.log('✅ Parsed TaskID from receipt:', taskId);
            return taskId;
          }
        }
      } catch (parseError) {
        // 忽略解析错误，继续下一个 log
        continue;
      }
    }

    console.warn('⚠️ TaskCreated event not found in receipt');
    return null;
  } catch (error) {
    console.error('❌ Failed to parse TaskID from receipt:', error);
    return null;
  }
}

// 备用方案：查询最新的 TaskID
export async function getLatestTaskId(
  provider: ethers.Provider,
  taskEscrowAddress: string,
  creatorAddress: string
): Promise<number | null> {
  try {
    const taskEscrowABI = [
      "function nextTaskId() external view returns (uint256)",
      "function tasks(uint256) external view returns (tuple(uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt, uint256 echoPostFee, address rewardAsset, uint256 rewardAmount))"
    ];

    const contract = new ethers.Contract(taskEscrowAddress, taskEscrowABI, provider);
    const nextTaskId = await contract.nextTaskId();
    
    // 检查最近创建的任务
    for (let i = Number(nextTaskId) - 1; i >= Math.max(1, Number(nextTaskId) - 10); i--) {
      try {
        const task = await contract.tasks(i);
        if (task.creator.toLowerCase() === creatorAddress.toLowerCase()) {
          // 检查创建时间是否在最近5分钟内
          const now = Math.floor(Date.now() / 1000);
          if (now - Number(task.createdAt) < 300) { // 5分钟
            console.log('✅ Found recent task by creator:', i);
            return i;
          }
        }
      } catch (taskError) {
        // 任务不存在，继续
        continue;
      }
    }

    console.warn('⚠️ No recent task found for creator');
    return null;
  } catch (error) {
    console.error('❌ Failed to get latest TaskID:', error);
    return null;
  }
}

// 测试函数
async function testTaskIdParsing() {
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  const taskEscrowAddress = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'; // 示例地址
  
  // 测试解析现有交易
  const testTxHash = '0x...'; // 替换为实际的交易哈希
  const taskId = await parseTaskIdFromReceipt(provider, testTxHash, taskEscrowAddress);
  
  if (taskId) {
    console.log('Parsed TaskID:', taskId);
  } else {
    console.log('Failed to parse TaskID');
  }
}

if (require.main === module) {
  testTaskIdParsing().catch(console.error);
}