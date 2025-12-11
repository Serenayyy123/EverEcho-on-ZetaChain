import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  encryptAndStoreContacts, 
  getWrappedDEK, 
  validateEncryptionPubKey 
} from '../services/encryptionService';
import { 
  verifySignature, 
  extractTaskIdFromMessage 
} from '../services/authService';
import { 
  getTaskOnChainStatus, 
  isStatusAllowedForDecryption, 
  checkTaskParticipant 
} from '../services/chainService';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/contacts/encrypt
 * 加密 contacts 并存储 wrapped DEKs
 * 冻结点 2.2-P1-B3：contacts 加密发生在 Creator 发布任务链下阶段
 */
router.post('/encrypt', async (req: Request, res: Response) => {
  try {
    const { taskId, creatorAddress, helperAddress, contactsPlaintext } = req.body;
    
    // 参数校验
    if (!taskId || !creatorAddress || !helperAddress || !contactsPlaintext) {
      return res.status(400).json({
        error: 'Missing required fields: taskId, creatorAddress, helperAddress, contactsPlaintext',
      });
    }
    
    // 从 Profile 获取双方的 encryptionPubKey
    // 注意：这里简化处理，实际应该从 profileService 获取
    // 为了最小实现，假设前端直接传入 pubKey
    const { creatorPubKey, helperPubKey } = req.body;
    
    if (!creatorPubKey || !helperPubKey) {
      return res.status(400).json({
        error: 'Missing encryptionPubKey for creator or helper',
      });
    }
    
    // 校验公钥格式
    if (!validateEncryptionPubKey(creatorPubKey) || !validateEncryptionPubKey(helperPubKey)) {
      return res.status(400).json({
        error: 'Invalid encryptionPubKey format (must be 32 bytes hex)',
      });
    }
    
    // 加密并存储
    const contactsEncryptedPayload = await encryptAndStoreContacts(
      taskId,
      creatorPubKey,
      helperPubKey,
      contactsPlaintext
    );
    
    res.status(200).json({
      success: true,
      contactsEncryptedPayload,
    });
  } catch (error) {
    console.error('Error encrypting contacts:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/contacts/decrypt
 * 解密 contacts（返回 wrappedDEK）
 * 冻结点 1.3-13/15/16/17：仅 InProgress/Submitted/Completed 允许解密
 */
router.post('/decrypt', async (req: Request, res: Response) => {
  try {
    const { taskId, address, signature, message } = req.body;
    
    console.log('[/decrypt] Request received:', {
      taskId,
      address,
      signature: signature?.slice(0, 20) + '...',
      message,
    });
    
    // 参数校验
    if (!taskId || !address || !signature || !message) {
      return res.status(400).json({
        error: 'Missing required fields: taskId, address, signature, message',
      });
    }
    
    // 1. 验证签名
    console.log('[/decrypt] Verifying signature...');
    const isValid = verifySignature(message, signature, address);
    console.log('[/decrypt] Signature valid:', isValid);
    
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid signature',
      });
    }
    
    // 2. 验证 message 中的 taskId 匹配
    const extractedTaskId = extractTaskIdFromMessage(message);
    if (extractedTaskId !== taskId) {
      return res.status(401).json({
        error: 'TaskId mismatch in signature message',
      });
    }
    
    // 3. 读取链上任务状态
    console.log('[/decrypt] Reading on-chain task status...');
    const taskOnChain = await getTaskOnChainStatus(taskId);
    if (!taskOnChain) {
      console.log('[/decrypt] Failed to read task from chain');
      return res.status(503).json({
        error: 'Unable to verify task status on chain. Please try again later.',
        details: 'RPC connection issue',
      });
    }
    console.log('[/decrypt] Task status:', taskOnChain.status);
    
    // 4. 检查状态是否允许解密（冻结点 1.3-13/15/16/17）
    console.log('[/decrypt] Checking if status allows decryption...');
    if (!isStatusAllowedForDecryption(taskOnChain.status)) {
      console.log('[/decrypt] Status not allowed:', taskOnChain.status);
      return res.status(403).json({
        error: 'Task status does not allow decryption',
        allowedStatuses: ['InProgress', 'Submitted', 'Completed'],
        currentStatus: taskOnChain.status,
      });
    }
    console.log('[/decrypt] Status check passed');
    
    // 5. 检查用户是否为任务参与者
    console.log('[/decrypt] Checking participant...', {
      address,
      creator: taskOnChain.creator,
      helper: taskOnChain.helper,
    });
    const participant = checkTaskParticipant(
      address,
      taskOnChain.creator,
      taskOnChain.helper
    );
    console.log('[/decrypt] Participant check result:', participant);
    
    if (!participant.isParticipant) {
      console.log('[/decrypt] User is not a participant');
      return res.status(403).json({
        error: 'Only task creator or helper can decrypt contacts',
      });
    }
    
    // 6. 获取对应的 wrappedDEK
    console.log('[/decrypt] Getting wrappedDEK...');
    const wrappedDEK = await getWrappedDEK(taskId, address, participant.isCreator);
    console.log('[/decrypt] wrappedDEK result:', wrappedDEK ? 'found' : 'not found');
    
    if (!wrappedDEK) {
      console.log('[/decrypt] Wrapped DEK not found for task:', taskId);
      return res.status(404).json({
        error: 'Wrapped DEK not found',
      });
    }
    
    // 7. 获取明文联系方式（简化实现：直接从数据库读取）
    // 注意：这是 MVP 简化方案，生产环境应该让前端解密
    console.log('[/decrypt] Getting plaintext contacts...');
    const { getCurrentChainId } = require('../config/chainConfig');
    const CURRENT_CHAIN_ID = getCurrentChainId();
    const task = await prisma.task.findUnique({
      where: {
        chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
      },
      select: { contactsPlaintext: true },
    });
    
    if (!task || !task.contactsPlaintext) {
      console.log('[/decrypt] Plaintext contacts not found');
      return res.status(404).json({
        error: 'Contacts not found',
      });
    }
    
    console.log('[/decrypt] Contacts from DB:', task.contactsPlaintext.slice(0, 50) + '...');
    console.log('[/decrypt] Contacts length:', task.contactsPlaintext.length);
    console.log('[/decrypt] Contacts looks like hex:', /^[0-9a-f]+$/i.test(task.contactsPlaintext));
    
    // 8. 检查 contactsPlaintext 是否是加密数据（回退逻辑）
    let plaintext = task.contactsPlaintext;
    
    // 如果 contactsPlaintext 看起来像加密数据（长hex字符串），尝试从 Profile 获取原始明文
    if (/^[0-9a-f]{64,}$/i.test(plaintext)) {
      console.log('[/decrypt] contactsPlaintext appears to be encrypted, fetching from creator profile...');
      
      // 从任务获取创建者地址
      const taskWithCreator = await prisma.task.findUnique({
        where: {
          chainId_taskId: { chainId: CURRENT_CHAIN_ID, taskId }
        },
        select: { creator: true },
      });
      
      if (taskWithCreator?.creator) {
        // 从创建者的 Profile 获取明文联系方式
        const creatorProfile = await prisma.profile.findUnique({
          where: { address: taskWithCreator.creator },
          select: { contacts: true },
        });
        
        if (creatorProfile?.contacts) {
          plaintext = creatorProfile.contacts;
          console.log('[/decrypt] Using contacts from creator profile:', plaintext);
        } else {
          console.log('[/decrypt] Creator profile contacts not found');
        }
      } else {
        console.log('[/decrypt] Task creator not found');
      }
    }
    
    // 9. 返回明文联系方式
    res.status(200).json({
      success: true,
      contacts: plaintext,
      wrappedDEK, // 保留 wrappedDEK 用于未来的完整实现
    });
  } catch (error) {
    console.error('Error decrypting contacts:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
