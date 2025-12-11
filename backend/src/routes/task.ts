import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import { validateTaskInput } from '../models/Task';
import { upsertTask, getTask, generateTaskURI } from '../services/taskService';
import { getProfile } from '../services/profileService';
import { encryptContacts, generateDEK, wrapDEK } from '../services/encryptionService';
import { PrismaClient } from '@prisma/client';
import { getCurrentChainId } from '../config/chainConfig';

// 严格获取 chainId（无默认回落）
const CURRENT_CHAIN_ID = getCurrentChainId();

const router = Router();
const prisma = new PrismaClient();

// 公钥缓存（避免重复查询数据库）
const publicKeyCache = new Map<string, string>();

/**
 * 从数据库获取用户的加密公钥（带缓存）
 * @param address 用户地址
 * @returns encryptionPubKey 或 null
 */
async function getPublicKey(address: string): Promise<string | null> {
  const lowerAddress = address.toLowerCase();
  
  // 检查缓存
  if (publicKeyCache.has(lowerAddress)) {
    return publicKeyCache.get(lowerAddress)!;
  }
  
  // 从数据库查询
  const profile = await getProfile(address);
  if (!profile || !profile.encryptionPubKey) {
    return null;
  }
  
  // 存入缓存
  publicKeyCache.set(lowerAddress, profile.encryptionPubKey);
  return profile.encryptionPubKey;
}

/**
 * POST /api/task
 * 创建或更新 Task
 * 冻结点 1.4-22：必须校验 schema，缺字段直接 400
 * 联系方式加密：接收明文 contactsPlaintext，加密后存储
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, contactsEncryptedPayload, createdAt } = req.body;
    
    // 检查是否包含明文联系方式（新流程）
    const contactsPlaintext = contactsEncryptedPayload; // 前端传递的是明文
    
    // 从链上读取最新的 taskCounter，确保 taskId 与链上同步
    let taskId: string;
    try {
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const contract = new ethers.Contract(
        process.env.TASK_ESCROW_ADDRESS!,
        ['function taskCounter() view returns (uint256)'],
        provider
      );
      
      const taskCounter = await contract.taskCounter();
      taskId = (Number(taskCounter) + 1).toString(); // 下一个 taskId
      
      console.log(`[Task] Chain taskCounter: ${taskCounter}, using taskId: ${taskId}`);
    } catch (error) {
      console.error('[Task] Failed to read taskCounter from chain:', error);
      return res.status(500).json({
        error: 'Failed to read taskCounter from blockchain',
        details: ['Please check RPC connection'],
      });
    }
    
    // 基础字段验证（taskId 不再从前端接收）
    
    if (!title || typeof title !== 'string') {
      return res.status(400).json({
        error: 'Invalid task data',
        details: ['title is required and must be a string'],
      });
    }
    
    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        error: 'Invalid task data',
        details: ['description is required and must be a string'],
      });
    }
    
    if (!contactsPlaintext || typeof contactsPlaintext !== 'string') {
      return res.status(400).json({
        error: 'Invalid task data',
        details: ['contactsEncryptedPayload (contactsPlaintext) is required and must be a string'],
      });
    }

    // 从 taskId 推断 creator 地址（需要从链上或其他方式获取）
    // 临时方案：从请求头或 body 中获取 creator 地址
    // 注意：生产环境应该从认证中间件获取
    const creatorAddress = req.body.creatorAddress || req.headers['x-creator-address'];
    
    if (!creatorAddress || typeof creatorAddress !== 'string') {
      return res.status(400).json({
        error: 'Creator address is required',
        details: ['creatorAddress must be provided in request body or headers'],
      });
    }

    // 检查任务是否已存在（幂等性）
    const existingTask = await prisma.task.findUnique({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
      },
    });
    
    if (existingTask) {
      console.log(`[Task ${taskId}] Already exists, checking ContactKey...`);
      
      // 检查 ContactKey 是否存在（完整性检查）
      const existingContactKey = await prisma.contactKey.findUnique({
        where: {
          chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
        },
      });
      
      if (!existingContactKey) {
        console.warn(`[Task ${taskId}] Task exists but ContactKey missing, will recreate ContactKey`);
        
        // 获取 Creator 的公钥
        const creatorPubKey = await getPublicKey(creatorAddress as string);
        
        if (creatorPubKey) {
          const cleanHex = creatorPubKey.startsWith('0x') ? creatorPubKey.slice(2) : creatorPubKey;
          const byteLength = cleanHex.length / 2;
          
          if (byteLength === 32 && existingTask.contactsPlaintext) {
            // 重新生成 ContactKey
            const dek = generateDEK();
            const encryptedPayload = encryptContacts(existingTask.contactsPlaintext, dek);
            const creatorWrappedDEK = wrapDEK(dek, creatorPubKey);
            
            await prisma.contactKey.create({
              data: {
                chainId: CURRENT_CHAIN_ID,
                taskId,
                creatorWrappedDEK,
                helperWrappedDEK: '',
              },
            });
            
            // 更新加密 payload
            await prisma.task.update({
              where: {
                chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
              },
              data: { contactsEncryptedPayload: encryptedPayload },
            });
            
            console.log(`[Task ${taskId}] ContactKey recreated successfully`);
          }
        }
      }
      
      return res.status(200).json({
        taskURI: generateTaskURI(taskId),
        message: 'Task already exists',
      });
    }

    // 获取 Creator 的公钥
    console.log(`[Task ${taskId}] Getting creator public key for ${creatorAddress}`);
    const creatorPubKey = await getPublicKey(creatorAddress as string);
    
    let encryptedPayload = '';
    let contactKeyCreated = false;
    
    if (creatorPubKey) {
      // 验证公钥长度
      const cleanHex = creatorPubKey.startsWith('0x') ? creatorPubKey.slice(2) : creatorPubKey;
      const byteLength = cleanHex.length / 2;
      
      if (byteLength === 32) {
        // 加密联系方式（首次加密，只用 Creator 公钥）
        console.log(`[Task ${taskId}] Encrypting contacts for creator ${creatorAddress}`);
        console.log(`[Task ${taskId}] Creator public key:`, creatorPubKey);
        
        // 1. 生成随机 DEK
        const dek = generateDEK();
        
        // 2. 使用 AES-256-GCM 加密联系方式
        encryptedPayload = encryptContacts(contactsPlaintext, dek);
        
        // 3. 使用 Creator 公钥包裹 DEK
        const creatorWrappedDEK = wrapDEK(dek, creatorPubKey);
        
        // 4. 存储 wrapped DEK 到数据库（Helper 的 wrappedDEK 暂时为空字符串）
        await prisma.contactKey.upsert({
          where: {
            chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
          },
          update: {
            creatorWrappedDEK,
            helperWrappedDEK: '', // Helper 接受任务后再更新
          },
          create: {
            chainId: CURRENT_CHAIN_ID,
            taskId,
            creatorWrappedDEK,
            helperWrappedDEK: '', // 初始为空
          },
        });
        
        contactKeyCreated = true;
        console.log(`[Task ${taskId}] Contacts encrypted and DEK stored`);
      } else {
        console.warn(`[Task ${taskId}] Invalid public key length: ${byteLength} bytes (expected 32), will create task without encryption`);
      }
    } else {
      console.warn(`[Task ${taskId}] Creator public key not found, will create task without encryption (can be added later by event listener)`);
    }

    // 5. 存储任务数据（使用加密后的 payload）
    const taskData = {
      taskId,
      title,
      description,
      contactsEncryptedPayload: encryptedPayload, // 存储加密后的数据
      createdAt,
    };
    
    // Schema 校验
    const validation = validateTaskInput(taskData);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid task data',
        details: validation.errors,
      });
    }

    // 使用事务保证 Task 和 ContactKey 原子性创建
    // 注意：DEK 和 wrappedDEK 已在事务外生成
    let finalCreatorWrappedDEK = '';
    if (contactKeyCreated && creatorPubKey) {
      // 重新生成（因为之前的逻辑可能不完整）
      const dek = generateDEK();
      const newEncryptedPayload = encryptContacts(contactsPlaintext, dek);
      finalCreatorWrappedDEK = wrapDEK(dek, creatorPubKey);
      encryptedPayload = newEncryptedPayload; // 更新 payload
    }
    
    // 获取可选字段
    const category = req.body.category || undefined;
    
    await prisma.$transaction(async (tx) => {
      // 存储 Task（同时存储明文联系方式用于重加密）
      await tx.task.upsert({
        where: {
          chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
        },
        update: {
          title,
          description,
          contactsEncryptedPayload: encryptedPayload,
          contactsPlaintext,
          category,
          creator: creatorAddress as string,
        },
        create: {
          chainId: CURRENT_CHAIN_ID,
          taskId,
          title,
          description,
          contactsEncryptedPayload: encryptedPayload,
          contactsPlaintext,
          createdAt: createdAt ? createdAt.toString() : Date.now().toString(),
          category,
          creator: creatorAddress as string,
        },
      });
      
      // 如果有加密，同时创建 ContactKey
      if (contactKeyCreated && finalCreatorWrappedDEK) {
        // 使用 upsert 保证幂等性
        await tx.contactKey.upsert({
          where: {
            chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
          },
          update: {
            creatorWrappedDEK: finalCreatorWrappedDEK,
            // 不更新 helperWrappedDEK，保留已有值
          },
          create: {
            chainId: CURRENT_CHAIN_ID,
            taskId,
            creatorWrappedDEK: finalCreatorWrappedDEK,
            helperWrappedDEK: '',
          },
        });
      }
    });

    // 返回 taskURI
    const taskURI = generateTaskURI(taskId);

    res.status(200).json({
      success: true,
      taskURI,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/task/:taskId
 * 获取 Task JSON（包含 creator 和 helper 的昵称）
 */
router.get('/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    // taskId 格式校验（简单非空检查）
    if (!taskId || taskId.trim() === '') {
      return res.status(400).json({
        error: 'Invalid taskId',
      });
    }

    const task = await getTask(taskId);

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    // 优化：优先从数据库返回，异步补充链上数据
    // 如果数据库中有 creator，直接使用；否则从链上读取
    if (task.creator) {
      // 快速路径：直接查询昵称
      const creatorProfile = await prisma.profile.findUnique({
        where: { address: task.creator },
        select: { nickname: true },
      });

      res.status(200).json({
        ...task,
        creator: task.creator,
        creatorNickname: creatorProfile?.nickname || null,
        helper: null, // 简化：不查询 helper（前端会从链上获取）
        helperNickname: null,
      });
    } else {
      // 慢速路径：需要从链上读取（仅在数据库缺失时）
      try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const contract = new ethers.Contract(
          process.env.TASK_ESCROW_ADDRESS!,
          ['function tasks(uint256) view returns (uint256 taskId, address creator, address helper, uint256 reward, string taskURI, uint8 status, uint256 createdAt, uint256 acceptedAt, uint256 submittedAt, address terminateRequestedBy, uint256 terminateRequestedAt, bool fixRequested, uint256 fixRequestedAt)'],
          provider
        );

        // 减少超时到 3 秒
        const taskOnChain = await Promise.race([
          contract.tasks(taskId),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('RPC timeout')), 3000)
          ),
        ]);
        
        const creator = (taskOnChain as any)[1];
        const helper = (taskOnChain as any)[2];

        // 查询 creator 和 helper 的昵称
        const creatorProfile = await prisma.profile.findUnique({
          where: { address: creator },
          select: { nickname: true },
        });

        let helperProfile = null;
        if (helper !== ethers.ZeroAddress) {
          helperProfile = await prisma.profile.findUnique({
            where: { address: helper },
            select: { nickname: true },
          });
        }

        // 返回任务数据 + 昵称
        res.status(200).json({
          ...task,
          creator,
          creatorNickname: creatorProfile?.nickname || null,
          helper,
          helperNickname: helperProfile?.nickname || null,
        });
      } catch (chainError) {
        // 如果链上读取失败，仍然返回任务数据（不包含昵称）
        console.warn(`Failed to read chain data for task ${taskId}:`, chainError);
        res.status(200).json(task);
      }
    }
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/task/update-helper
 * Helper 接受任务后，重新加密联系方式（添加 Helper 的 wrappedDEK）
 */
router.post('/update-helper', async (req: Request, res: Response) => {
  try {
    const { taskId, helperAddress } = req.body;
    
    // 参数验证
    if (!taskId || typeof taskId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        details: ['taskId is required and must be a string'],
      });
    }
    
    if (!helperAddress || typeof helperAddress !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        details: ['helperAddress is required and must be a string'],
      });
    }

    console.log(`[Task ${taskId}] Updating encryption for helper ${helperAddress}`);

    // 1. 检查任务是否存在
    const task = await getTask(taskId);
    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    // 2. 获取现有的 contactKey
    const contactKey = await prisma.contactKey.findUnique({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
      },
    });
    
    if (!contactKey) {
      return res.status(404).json({
        error: 'Contact key not found for this task',
      });
    }

    // 3. 获取 Helper 的公钥
    const helperPubKey = await getPublicKey(helperAddress);
    if (!helperPubKey) {
      return res.status(400).json({
        error: 'Helper public key not found',
        details: ['Helper must register and have an encryption public key'],
      });
    }

    // 4. 重新生成 DEK 并包裹给 Helper
    // 注意：这里我们需要重新生成 DEK，因为无法从 wrappedDEK 中恢复原始 DEK
    // 更好的方案是在创建任务时保存明文联系方式（加密存储），然后在这里重新加密
    
    // 临时方案：从 contactsEncryptedPayload 中无法恢复明文
    // 我们需要在数据库中额外存储明文联系方式（仅用于重加密）
    
    // 检查是否有存储的明文联系方式
    const taskWithContacts = await prisma.task.findUnique({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
      },
      select: { contactsPlaintext: true },
    });
    
    if (!taskWithContacts?.contactsPlaintext) {
      return res.status(500).json({
        error: 'Cannot re-encrypt contacts',
        details: ['Original plaintext contacts not found. This task was created with old flow.'],
      });
    }

    // 5. 重新加密联系方式
    const dek = generateDEK();
    const encryptedPayload = encryptContacts(taskWithContacts.contactsPlaintext, dek);
    
    // 6. 包裹 DEK 给 Creator 和 Helper
    // 获取 Creator 地址（从链上或数据库）
    // 临时方案：从现有的 contactKey 推断或从请求中获取
    const creatorAddress = req.body.creatorAddress;
    if (!creatorAddress) {
      return res.status(400).json({
        error: 'Creator address is required for re-encryption',
      });
    }
    
    const creatorPubKey = await getPublicKey(creatorAddress);
    if (!creatorPubKey) {
      return res.status(400).json({
        error: 'Creator public key not found',
      });
    }
    
    const creatorWrappedDEK = wrapDEK(dek, creatorPubKey);
    const helperWrappedDEK = wrapDEK(dek, helperPubKey);

    // 7. 更新数据库
    await prisma.contactKey.update({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
      },
      data: {
        creatorWrappedDEK,
        helperWrappedDEK,
      },
    });
    
    // 8. 更新任务的 contactsEncryptedPayload
    await prisma.task.update({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
      },
      data: {
        contactsEncryptedPayload: encryptedPayload,
      },
    });

    console.log(`[Task ${taskId}] Contacts re-encrypted for helper ${helperAddress}`);

    res.status(200).json({
      success: true,
      message: 'Contacts re-encrypted successfully',
    });
  } catch (error) {
    console.error('Error updating helper encryption:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
