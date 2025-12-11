/**
 * 任务同步协调器
 * 统一管理 Task 和 ContactKey 的创建逻辑，避免 EventListener 和 ChainSync 的竞态
 */

import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import { generateDEK, wrapDEK, encryptContacts } from './encryptionService';
import { getCurrentChainId } from '../config/chainConfig';

// 严格获取 chainId（无默认回落）
const CURRENT_CHAIN_ID = getCurrentChainId();

const prisma = new PrismaClient();

/**
 * 从 taskURI 获取真实的 metadata
 */
async function fetchMetadataFromURI(taskURI: string): Promise<{ title: string; description: string } | null> {
  try {
    // 解析 taskURI
    // 格式: https://api.everecho.io/task/{taskId}.json
    const match = taskURI.match(/\/task\/(\d+)\.json$/);
    if (!match) {
      console.log(`[TaskSync] Cannot parse taskURI: ${taskURI}`);
      return null;
    }
    
    const originalTaskId = match[1];
    console.log(`[TaskSync] Fetching metadata for original taskId: ${originalTaskId}`);
    
    // 从数据库读取原始任务的 metadata
    const originalTask = await prisma.task.findUnique({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId: originalTaskId }
      },
      select: { title: true, description: true },
    });
    
    if (originalTask && originalTask.title && !originalTask.title.includes('synced from chain')) {
      console.log(`[TaskSync] Found original metadata: ${originalTask.title}`);
      return {
        title: originalTask.title,
        description: originalTask.description,
      };
    }
    
    return null;
  } catch (error) {
    console.error(`[TaskSync] Error fetching metadata from URI:`, error);
    return null;
  }
}

// 内存锁（简单实现，生产环境应使用 Redis 分布式锁）
const taskLocks = new Map<string, Promise<void>>();

/**
 * 获取任务锁（防止并发创建）
 */
async function acquireTaskLock(taskId: string): Promise<() => void> {
  // 如果已有锁，等待
  while (taskLocks.has(taskId)) {
    await taskLocks.get(taskId);
    await new Promise(resolve => setTimeout(resolve, 100)); // 等待 100ms
  }
  
  // 创建新锁
  let releaseLock: () => void;
  const lockPromise = new Promise<void>(resolve => {
    releaseLock = resolve;
  });
  
  taskLocks.set(taskId, lockPromise);
  
  return () => {
    taskLocks.delete(taskId);
    releaseLock!();
  };
}

export interface SyncTaskParams {
  taskId: string;
  creator: string;
  helper?: string;
  taskURI?: string;
  source: 'event' | 'chain-sync' | 'manual';
}

/**
 * 统一的任务同步方法（幂等、原子、带锁）
 */
export async function syncTaskWithLock(params: SyncTaskParams): Promise<boolean> {
  const { taskId, creator, helper, taskURI, source } = params;
  
  console.log(`[TaskSync] [${source}] Syncing task ${taskId}...`);
  
  // 获取锁
  const releaseLock = await acquireTaskLock(taskId);
  
  try {
    // 1. 检查任务是否已存在
    const existingTask = await prisma.task.findUnique({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
      },
    });
    
    if (existingTask) {
      console.log(`[TaskSync] [${source}] Task ${taskId} already exists`);
      
      // 检查 ContactKey 是否存在
      const existingContactKey = await prisma.contactKey.findUnique({
        where: {
          chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
        },
      });
      
      if (existingContactKey) {
        // 检查是否需要更新 helperWrappedDEK
        if (helper && helper !== ethers.ZeroAddress && !existingContactKey.helperWrappedDEK) {
          console.log(`[TaskSync] [${source}] Task ${taskId} ContactKey exists but missing helperWrappedDEK, updating...`);
          return await updateHelperWrappedDEK(taskId, creator, helper);
        }
        
        console.log(`[TaskSync] [${source}] Task ${taskId} and ContactKey both complete, skipping`);
        return true; // 已完整，无需操作
      }
      
      // Task 存在但 ContactKey 缺失，补充 ContactKey
      console.log(`[TaskSync] [${source}] Task ${taskId} exists but ContactKey missing, creating...`);
      return await createContactKeyOnly(taskId, creator, helper);
    }
    
    // 2. 任务不存在，创建完整的 Task + ContactKey
    console.log(`[TaskSync] [${source}] Task ${taskId} not found, creating...`);
    return await createTaskAndContactKey(taskId, creator, helper, taskURI);
  } catch (error) {
    console.error(`[TaskSync] [${source}] Error syncing task ${taskId}:`, error);
    return false;
  } finally {
    releaseLock();
  }
}

/**
 * 创建完整的 Task + ContactKey（原子操作）
 */
async function createTaskAndContactKey(
  taskId: string,
  creator: string,
  helper?: string,
  taskURI?: string
): Promise<boolean> {
  try {
    // 1. 获取 creator 的 profile
    const creatorProfile = await prisma.profile.findUnique({
      where: { address: creator },
    });
    
    if (!creatorProfile || !creatorProfile.encryptionPubKey) {
      console.error(`[TaskSync] Creator ${creator} not found or has no encryption key`);
      return false;
    }
    
    // 验证公钥
    const cleanHex = creatorProfile.encryptionPubKey.startsWith('0x')
      ? creatorProfile.encryptionPubKey.slice(2)
      : creatorProfile.encryptionPubKey;
    const byteLength = cleanHex.length / 2;
    
    if (byteLength !== 32) {
      console.error(`[TaskSync] Invalid public key for creator ${creator}: ${byteLength} bytes`);
      return false;
    }
    
    // 2. 准备数据
    const contactsPlaintext = creatorProfile.contacts || 'N/A';
    const dek = generateDEK();
    const encryptedPayload = encryptContacts(contactsPlaintext, dek);
    const creatorWrappedDEK = wrapDEK(dek, creatorProfile.encryptionPubKey);
    
    let helperWrappedDEK = '';
    if (helper && helper !== ethers.ZeroAddress) {
      const helperProfile = await prisma.profile.findUnique({
        where: { address: helper },
      });
      
      if (helperProfile && helperProfile.encryptionPubKey) {
        helperWrappedDEK = wrapDEK(dek, helperProfile.encryptionPubKey);
      }
    }
    
    // 3. 尝试从 taskURI 获取真实的 metadata
    let title = `Task ${taskId} (synced from chain)`;
    let description = 'This task was automatically synced from blockchain';
    
    if (taskURI) {
      const metadata = await fetchMetadataFromURI(taskURI);
      if (metadata) {
        title = metadata.title;
        description = metadata.description;
        console.log(`[TaskSync] Using real metadata for task ${taskId}: ${title}`);
      } else {
        console.warn(`[TaskSync] Cannot fetch metadata from taskURI for task ${taskId}, using default`);
      }
    } else {
      console.warn(`[TaskSync] No taskURI provided for task ${taskId}, using default`);
    }
    
    // 4. 使用事务创建
    await prisma.$transaction(async (tx) => {
      // 创建 Task
      await tx.task.create({
        data: {
          chainId: CURRENT_CHAIN_ID,
          taskId,
          title,
          description,
          contactsEncryptedPayload: encryptedPayload,
          contactsPlaintext,
          createdAt: Date.now().toString(),
        },
      });
      
      // 创建 ContactKey
      await tx.contactKey.create({
        data: {
          chainId: CURRENT_CHAIN_ID,
          taskId,
          creatorWrappedDEK,
          helperWrappedDEK,
        },
      });
    });
    
    console.log(`[TaskSync] ✅ Task ${taskId} and ContactKey created successfully`);
    return true;
  } catch (error) {
    console.error(`[TaskSync] Error creating task ${taskId}:`, error);
    return false;
  }
}

/**
 * 仅创建 ContactKey（Task 已存在）
 */
async function createContactKeyOnly(
  taskId: string,
  creator: string,
  helper?: string
): Promise<boolean> {
  try {
    // 1. 获取 Task
    const task = await prisma.task.findUnique({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
      },
    });
    
    if (!task) {
      console.error(`[TaskSync] Task ${taskId} not found`);
      return false;
    }
    
    // 2. 获取 creator 的 profile
    const creatorProfile = await prisma.profile.findUnique({
      where: { address: creator },
    });
    
    if (!creatorProfile || !creatorProfile.encryptionPubKey) {
      console.error(`[TaskSync] Creator ${creator} not found or has no encryption key`);
      return false;
    }
    
    // 验证公钥
    const cleanHex = creatorProfile.encryptionPubKey.startsWith('0x')
      ? creatorProfile.encryptionPubKey.slice(2)
      : creatorProfile.encryptionPubKey;
    const byteLength = cleanHex.length / 2;
    
    if (byteLength !== 32) {
      console.error(`[TaskSync] Invalid public key for creator ${creator}: ${byteLength} bytes`);
      return false;
    }
    
    // 3. 生成 DEK 和包裹
    const contactsPlaintext = task.contactsPlaintext || 'N/A';
    const dek = generateDEK();
    const encryptedPayload = encryptContacts(contactsPlaintext, dek);
    const creatorWrappedDEK = wrapDEK(dek, creatorProfile.encryptionPubKey);
    
    let helperWrappedDEK = '';
    if (helper && helper !== ethers.ZeroAddress) {
      const helperProfile = await prisma.profile.findUnique({
        where: { address: helper },
      });
      
      if (helperProfile && helperProfile.encryptionPubKey) {
        helperWrappedDEK = wrapDEK(dek, helperProfile.encryptionPubKey);
      }
    }
    
    // 4. 使用事务创建 ContactKey 并更新 Task
    await prisma.$transaction(async (tx) => {
      // 创建 ContactKey
      await tx.contactKey.create({
        data: {
          chainId: CURRENT_CHAIN_ID,
          taskId,
          creatorWrappedDEK,
          helperWrappedDEK,
        },
      });
      
      // 更新 Task 的加密 payload
      await tx.task.update({
        where: {
          chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
        },
        data: { contactsEncryptedPayload: encryptedPayload },
      });
    });
    
    console.log(`[TaskSync] ✅ ContactKey for task ${taskId} created successfully`);
    return true;
  } catch (error) {
    console.error(`[TaskSync] Error creating ContactKey for task ${taskId}:`, error);
    return false;
  }
}

/**
 * 更新 helperWrappedDEK（Task 和 ContactKey 都存在，但缺少 helperWrappedDEK）
 */
async function updateHelperWrappedDEK(
  taskId: string,
  creator: string,
  helper: string
): Promise<boolean> {
  try {
    // 1. 获取 Task
    const task = await prisma.task.findUnique({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
      },
    });
    
    if (!task || !task.contactsPlaintext) {
      console.error(`[TaskSync] Task ${taskId} not found or missing contactsPlaintext`);
      return false;
    }
    
    // 2. 获取 creator 和 helper 的公钥
    const creatorProfile = await prisma.profile.findUnique({
      where: { address: creator },
    });
    
    const helperProfile = await prisma.profile.findUnique({
      where: { address: helper },
    });
    
    if (!creatorProfile?.encryptionPubKey || !helperProfile?.encryptionPubKey) {
      console.error(`[TaskSync] Missing encryption keys for task ${taskId}`);
      return false;
    }
    
    // 验证公钥长度
    const creatorKeyClean = creatorProfile.encryptionPubKey.startsWith('0x')
      ? creatorProfile.encryptionPubKey.slice(2)
      : creatorProfile.encryptionPubKey;
    const helperKeyClean = helperProfile.encryptionPubKey.startsWith('0x')
      ? helperProfile.encryptionPubKey.slice(2)
      : helperProfile.encryptionPubKey;
    
    if (creatorKeyClean.length / 2 !== 32 || helperKeyClean.length / 2 !== 32) {
      console.error(`[TaskSync] Invalid key length for task ${taskId}`);
      return false;
    }
    
    // 3. 重新生成 DEK 并包裹
    const dek = generateDEK();
    const encryptedPayload = encryptContacts(task.contactsPlaintext, dek);
    const creatorWrappedDEK = wrapDEK(dek, creatorProfile.encryptionPubKey);
    const helperWrappedDEK = wrapDEK(dek, helperProfile.encryptionPubKey);
    
    // 4. 使用事务更新
    await prisma.$transaction(async (tx) => {
      await tx.contactKey.update({
        where: {
          chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
        },
        data: {
          creatorWrappedDEK,
          helperWrappedDEK,
        },
      });
      
      await tx.task.update({
        where: {
          chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
        },
        data: {
          contactsEncryptedPayload: encryptedPayload,
        },
      });
    });
    
    console.log(`[TaskSync] ✅ Updated helperWrappedDEK for task ${taskId}`);
    return true;
  } catch (error) {
    console.error(`[TaskSync] Error updating helperWrappedDEK for task ${taskId}:`, error);
    return false;
  }
}

/**
 * 批量同步缺失的任务
 */
export async function syncMissingTasks(
  contract: ethers.Contract,
  source: 'event' | 'chain-sync' | 'manual' = 'manual'
): Promise<{ synced: number; failed: number }> {
  try {
    // 1. 获取链上 taskCounter
    const taskCounter = await contract.taskCounter();
    const totalTasks = Number(taskCounter);
    
    if (totalTasks === 0) {
      return { synced: 0, failed: 0 };
    }
    
    console.log(`[TaskSync] [${source}] Chain has ${totalTasks} tasks, checking for missing...`);
    
    // 2. 获取数据库中已有的 taskId
    const existingTasks = await prisma.task.findMany({
      where: { chainId: CURRENT_CHAIN_ID },
      select: { taskId: true },
    });
    const existingTaskIds = new Set(existingTasks.map(t => t.taskId));
    
    // 3. 找出缺失的 taskId
    const missingTaskIds: string[] = [];
    for (let i = 1; i <= totalTasks; i++) {
      if (!existingTaskIds.has(i.toString())) {
        missingTaskIds.push(i.toString());
      }
    }
    
    // 4. 检查缺失的 ContactKey 和 helperWrappedDEK
    const tasksWithoutContactKey: string[] = [];
    const tasksWithoutHelperDEK: Array<{ taskId: string; helper: string }> = [];
    
    for (const task of existingTasks) {
      const contactKey = await prisma.contactKey.findUnique({
        where: {
          chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId: task.taskId }
        },
      });
      
      if (!contactKey) {
        tasksWithoutContactKey.push(task.taskId);
      } else {
        // 检查是否缺少 helperWrappedDEK
        // 从链上读取 helper 地址
        try {
          const taskOnChain = await contract.tasks(task.taskId);
          const helper = taskOnChain[2];
          const status = Number(taskOnChain[5]);
          
          // 如果任务已被接受但缺少 helperWrappedDEK
          if (helper !== ethers.ZeroAddress && status > 0 && !contactKey.helperWrappedDEK) {
            tasksWithoutHelperDEK.push({ taskId: task.taskId, helper });
          }
        } catch (error) {
          // 忽略链上读取错误
        }
      }
    }
    
    if (missingTaskIds.length === 0 && tasksWithoutContactKey.length === 0 && tasksWithoutHelperDEK.length === 0) {
      console.log(`[TaskSync] [${source}] No missing tasks, ContactKeys, or helperWrappedDEKs`);
      return { synced: 0, failed: 0 };
    }
    
    console.log(`[TaskSync] [${source}] Found ${missingTaskIds.length} missing tasks`);
    console.log(`[TaskSync] [${source}] Found ${tasksWithoutContactKey.length} tasks without ContactKey`);
    console.log(`[TaskSync] [${source}] Found ${tasksWithoutHelperDEK.length} tasks without helperWrappedDEK`);
    
    let synced = 0;
    let failed = 0;
    
    // 5. 同步缺失的任务
    for (const taskId of missingTaskIds) {
      try {
        const taskOnChain = await contract.tasks(taskId);
        const creator = taskOnChain[1];
        const helper = taskOnChain[2];
        const taskURI = taskOnChain[4];
        
        const success = await syncTaskWithLock({
          taskId,
          creator,
          helper: helper !== ethers.ZeroAddress ? helper : undefined,
          taskURI,
          source,
        });
        
        if (success) {
          synced++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`[TaskSync] [${source}] Error syncing task ${taskId}:`, error);
        failed++;
      }
    }
    
    // 6. 补充缺失的 ContactKey
    for (const taskId of tasksWithoutContactKey) {
      try {
        const taskOnChain = await contract.tasks(taskId);
        const creator = taskOnChain[1];
        const helper = taskOnChain[2];
        
        const success = await syncTaskWithLock({
          taskId,
          creator,
          helper: helper !== ethers.ZeroAddress ? helper : undefined,
          source,
        });
        
        if (success) {
          synced++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`[TaskSync] [${source}] Error syncing ContactKey for task ${taskId}:`, error);
        failed++;
      }
    }
    
    // 7. 修复缺失的 helperWrappedDEK
    for (const { taskId, helper } of tasksWithoutHelperDEK) {
      try {
        console.log(`[TaskSync] [${source}] Fixing helperWrappedDEK for task ${taskId}...`);
        
        const taskOnChain = await contract.tasks(taskId);
        const creator = taskOnChain[1];
        
        const success = await syncTaskWithLock({
          taskId,
          creator,
          helper,
          source,
        });
        
        if (success) {
          synced++;
          console.log(`[TaskSync] [${source}] ✅ Fixed helperWrappedDEK for task ${taskId}`);
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`[TaskSync] [${source}] Error fixing helperWrappedDEK for task ${taskId}:`, error);
        failed++;
      }
    }
    
    console.log(`[TaskSync] [${source}] ✅ Sync completed: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  } catch (error) {
    console.error(`[TaskSync] [${source}] Error in syncMissingTasks:`, error);
    return { synced: 0, failed: 0 };
  }
}
