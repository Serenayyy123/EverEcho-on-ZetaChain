import { Router, Request, Response } from 'express';
import { getBlockchainTaskValidator } from '../services/blockchainTaskValidator';
import { validateTaskInput } from '../models/Task';
import { getProfile } from '../services/profileService';
import { encryptContacts, generateDEK, wrapDEK } from '../services/encryptionService';
import { PrismaClient } from '@prisma/client';
import { getCurrentChainId } from '../config/chainConfig';

const router = Router();
const prisma = new PrismaClient();
const CURRENT_CHAIN_ID = getCurrentChainId();

// 公钥缓存（避免重复查询数据库）
const publicKeyCache = new Map<string, string>();

/**
 * 从数据库获取用户的加密公钥（带缓存）
 */
async function getPublicKey(address: string): Promise<string | null> {
  const lowerAddress = address.toLowerCase();
  
  if (publicKeyCache.has(lowerAddress)) {
    return publicKeyCache.get(lowerAddress)!;
  }
  
  const profile = await getProfile(address);
  if (!profile || !profile.encryptionPubKey) {
    return null;
  }
  
  publicKeyCache.set(lowerAddress, profile.encryptionPubKey);
  return profile.encryptionPubKey;
}

/**
 * PUT /api/tasks/:taskId/metadata
 * P0 Fix: Chain-first metadata endpoint with blockchain verification
 * 只有在区块链上确认任务存在后才允许写入 metadata
 */
router.put('/:taskId/metadata', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { title, description, contactsPlaintext, category, createdAt, creatorAddress } = req.body;

    console.log(`[MetadataEndpoint] Processing metadata for task ${taskId}`);

    // 1. 基础参数验证
    if (!taskId || taskId.trim() === '') {
      return res.status(400).json({
        error: 'Invalid taskId',
        details: ['taskId is required']
      });
    }

    if (!title || typeof title !== 'string') {
      return res.status(400).json({
        error: 'Invalid metadata',
        details: ['title is required and must be a string']
      });
    }

    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        error: 'Invalid metadata',
        details: ['description is required and must be a string']
      });
    }

    if (!contactsPlaintext || typeof contactsPlaintext !== 'string') {
      return res.status(400).json({
        error: 'Invalid metadata',
        details: ['contactsPlaintext is required and must be a string']
      });
    }

    if (!creatorAddress || typeof creatorAddress !== 'string') {
      return res.status(400).json({
        error: 'Invalid metadata',
        details: ['creatorAddress is required and must be a string']
      });
    }

    // 2. P0 Fix: 区块链验证 - 确保任务存在于链上
    console.log(`[MetadataEndpoint] Validating task ${taskId} on blockchain...`);
    const validator = getBlockchainTaskValidator();
    const validation = await validator.validateTaskExists(taskId);

    if (!validation.exists) {
      console.log(`[MetadataEndpoint] ❌ Task ${taskId} not found on blockchain:`, validation.error);
      return res.status(404).json({
        error: 'TaskNotOnChain',
        message: 'Task does not exist on blockchain',
        details: [validation.error || 'Task not found on blockchain']
      });
    }

    // 3. P0 Fix: 创建者授权验证
    const isAuthorized = await validator.validateCreatorAuthorization(taskId, creatorAddress);
    if (!isAuthorized) {
      console.log(`[MetadataEndpoint] ❌ Authorization failed for task ${taskId}:`, {
        blockchainCreator: validation.creator,
        requestCreator: creatorAddress
      });
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'Only task creator can write metadata',
        details: ['Creator address does not match blockchain task creator']
      });
    }

    console.log(`[MetadataEndpoint] ✅ Task ${taskId} validated on blockchain, creator authorized`);

    // 4. 检查任务是否已存在（幂等性支持）
    const existingTask = await prisma.task.findUnique({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
      },
    });

    if (existingTask) {
      console.log(`[MetadataEndpoint] Task ${taskId} metadata already exists, updating...`);
      
      // 幂等更新
      await prisma.task.update({
        where: {
          chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
        },
        data: {
          title,
          description,
          contactsPlaintext,
          category: category || undefined,
          updatedAt: new Date()
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Task metadata updated successfully',
        taskId
      });
    }

    // 5. 获取 Creator 的公钥进行加密
    console.log(`[MetadataEndpoint] Getting creator public key for ${creatorAddress}`);
    const creatorPubKey = await getPublicKey(creatorAddress);
    
    let encryptedPayload = '';
    let contactKeyCreated = false;
    
    if (creatorPubKey) {
      const cleanHex = creatorPubKey.startsWith('0x') ? creatorPubKey.slice(2) : creatorPubKey;
      const byteLength = cleanHex.length / 2;
      
      if (byteLength === 32) {
        console.log(`[MetadataEndpoint] Encrypting contacts for creator ${creatorAddress}`);
        
        const dek = generateDEK();
        encryptedPayload = encryptContacts(contactsPlaintext, dek);
        const creatorWrappedDEK = wrapDEK(dek, creatorPubKey);
        
        await prisma.contactKey.create({
          data: {
            chainId: CURRENT_CHAIN_ID,
            taskId,
            creatorWrappedDEK,
            helperWrappedDEK: '',
          },
        });
        
        contactKeyCreated = true;
        console.log(`[MetadataEndpoint] Contacts encrypted and DEK stored for task ${taskId}`);
      } else {
        console.warn(`[MetadataEndpoint] Invalid public key length: ${byteLength} bytes (expected 32)`);
      }
    } else {
      console.warn(`[MetadataEndpoint] Creator public key not found for ${creatorAddress}`);
    }

    // 6. 创建任务 metadata 记录
    await prisma.task.create({
      data: {
        chainId: CURRENT_CHAIN_ID,
        taskId,
        title,
        description,
        contactsEncryptedPayload: encryptedPayload,
        contactsPlaintext,
        createdAt: createdAt ? createdAt.toString() : Date.now().toString(),
        category: category || undefined,
        creator: creatorAddress,
      },
    });

    console.log(`[MetadataEndpoint] ✅ Task ${taskId} metadata created successfully`);

    res.status(201).json({
      success: true,
      message: 'Task metadata created successfully',
      taskId,
      encrypted: contactKeyCreated
    });

  } catch (error) {
    console.error(`[MetadataEndpoint] Error processing metadata:`, error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;