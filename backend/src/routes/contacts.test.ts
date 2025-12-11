import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';
import * as chainService from '../services/chainService';
import * as authService from '../services/authService';
import * as encryptionService from '../services/encryptionService';

const prisma = new PrismaClient();

// Mock chain service
jest.mock('../services/chainService');
const mockGetTaskOnChainStatus = chainService.getTaskOnChainStatus as jest.MockedFunction<typeof chainService.getTaskOnChainStatus>;

// Mock auth service
jest.mock('../services/authService');
const mockVerifySignature = authService.verifySignature as jest.MockedFunction<typeof authService.verifySignature>;
const mockExtractTaskIdFromMessage = authService.extractTaskIdFromMessage as jest.MockedFunction<typeof authService.extractTaskIdFromMessage>;

describe('Contacts API - P1-B3', () => {
  beforeAll(async () => {
    // 清空测试数据
    await prisma.contactKey.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/contacts/encrypt', () => {
    const validEncryptRequest = {
      taskId: '1',
      creatorAddress: '0x1234567890123456789012345678901234567890',
      helperAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      contactsPlaintext: 'WeChat: alice123, Email: alice@example.com',
      creatorPubKey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      helperPubKey: 'abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    };

    it('应该成功加密 contacts 并返回 contactsEncryptedPayload', async () => {
      const response = await request(app)
        .post('/api/contacts/encrypt')
        .send(validEncryptRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.contactsEncryptedPayload).toBeDefined();
      expect(typeof response.body.contactsEncryptedPayload).toBe('string');
      expect(response.body.contactsEncryptedPayload.length).toBeGreaterThan(0);
    });

    it('应该拒绝缺少必填字段的请求（400）', async () => {
      const invalidRequest = {
        taskId: '2',
        creatorAddress: '0x1234567890123456789012345678901234567890',
        // 缺少 helperAddress, contactsPlaintext, pubKeys
      };

      const response = await request(app)
        .post('/api/contacts/encrypt')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.error).toContain('Missing required fields');
    });

    it('应该拒绝无效的 encryptionPubKey 格式（400）', async () => {
      const invalidRequest = {
        ...validEncryptRequest,
        creatorPubKey: 'invalid_key', // 无效格式
      };

      const response = await request(app)
        .post('/api/contacts/encrypt')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.error).toContain('Invalid encryptionPubKey format');
    });

    it('应该支持幂等性：同一 taskId 多次加密覆盖旧数据', async () => {
      const taskId = '100';
      
      // 第一次加密
      const firstRequest = {
        ...validEncryptRequest,
        taskId,
        contactsPlaintext: 'Original contacts',
      };

      const firstResponse = await request(app)
        .post('/api/contacts/encrypt')
        .send(firstRequest)
        .expect(200);

      // 第二次加密
      const secondRequest = {
        ...validEncryptRequest,
        taskId,
        contactsPlaintext: 'Updated contacts',
      };

      const secondResponse = await request(app)
        .post('/api/contacts/encrypt')
        .send(secondRequest)
        .expect(200);

      // 两次返回的 payload 应该不同（因为内容不同）
      expect(firstResponse.body.contactsEncryptedPayload)
        .not.toBe(secondResponse.body.contactsEncryptedPayload);
    });
  });

  describe('POST /api/contacts/decrypt', () => {
    const taskId = '200';
    const creatorAddress = '0x1234567890123456789012345678901234567890';
    const helperAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    const message = `EverEcho: Decrypt contacts for task ${taskId}`;
    const signature = '0x1234567890abcdef...'; // Mock signature

    beforeAll(async () => {
      // 准备测试数据：先加密一个 task
      await request(app)
        .post('/api/contacts/encrypt')
        .send({
          taskId,
          creatorAddress,
          helperAddress,
          contactsPlaintext: 'Test contacts for decrypt',
          creatorPubKey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          helperPubKey: 'abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        });
    });

    it('应该拒绝 Open 状态的任务解密（403）', async () => {
      // Mock 链上状态为 Open
      mockGetTaskOnChainStatus.mockResolvedValue({
        status: chainService.TaskStatus.Open,
        creator: creatorAddress,
        helper: helperAddress,
      });

      // Mock 签名验证通过
      mockVerifySignature.mockReturnValue(true);
      mockExtractTaskIdFromMessage.mockReturnValue(taskId);

      const response = await request(app)
        .post('/api/contacts/decrypt')
        .send({
          taskId,
          address: creatorAddress,
          signature,
          message,
        })
        .expect(403);

      expect(response.body.error).toContain('Task status does not allow decryption');
    });

    it('应该拒绝 Cancelled 状态的任务解密（403）', async () => {
      // Mock 链上状态为 Cancelled
      mockGetTaskOnChainStatus.mockResolvedValue({
        status: chainService.TaskStatus.Cancelled,
        creator: creatorAddress,
        helper: helperAddress,
      });

      mockVerifySignature.mockReturnValue(true);
      mockExtractTaskIdFromMessage.mockReturnValue(taskId);

      const response = await request(app)
        .post('/api/contacts/decrypt')
        .send({
          taskId,
          address: creatorAddress,
          signature,
          message,
        })
        .expect(403);

      expect(response.body.error).toContain('Task status does not allow decryption');
    });

    it('应该允许 InProgress 状态的 Creator 解密', async () => {
      // Mock 链上状态为 InProgress
      mockGetTaskOnChainStatus.mockResolvedValue({
        status: chainService.TaskStatus.InProgress,
        creator: creatorAddress,
        helper: helperAddress,
      });

      mockVerifySignature.mockReturnValue(true);
      mockExtractTaskIdFromMessage.mockReturnValue(taskId);

      const response = await request(app)
        .post('/api/contacts/decrypt')
        .send({
          taskId,
          address: creatorAddress,
          signature,
          message,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.wrappedDEK).toBeDefined();
      expect(typeof response.body.wrappedDEK).toBe('string');
    });

    it('应该允许 Submitted 状态的 Helper 解密', async () => {
      // Mock 链上状态为 Submitted
      mockGetTaskOnChainStatus.mockResolvedValue({
        status: chainService.TaskStatus.Submitted,
        creator: creatorAddress,
        helper: helperAddress,
      });

      mockVerifySignature.mockReturnValue(true);
      mockExtractTaskIdFromMessage.mockReturnValue(taskId);

      const response = await request(app)
        .post('/api/contacts/decrypt')
        .send({
          taskId,
          address: helperAddress,
          signature,
          message,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.wrappedDEK).toBeDefined();
    });

    it('应该允许 Completed 状态的任务解密', async () => {
      // Mock 链上状态为 Completed
      mockGetTaskOnChainStatus.mockResolvedValue({
        status: chainService.TaskStatus.Completed,
        creator: creatorAddress,
        helper: helperAddress,
      });

      mockVerifySignature.mockReturnValue(true);
      mockExtractTaskIdFromMessage.mockReturnValue(taskId);

      const response = await request(app)
        .post('/api/contacts/decrypt')
        .send({
          taskId,
          address: creatorAddress,
          signature,
          message,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.wrappedDEK).toBeDefined();
    });

    it('应该拒绝非任务参与者解密（403）', async () => {
      const nonParticipant = '0x9999999999999999999999999999999999999999';
      
      mockGetTaskOnChainStatus.mockResolvedValue({
        status: chainService.TaskStatus.InProgress,
        creator: creatorAddress,
        helper: helperAddress,
      });

      mockVerifySignature.mockReturnValue(true);
      mockExtractTaskIdFromMessage.mockReturnValue(taskId);

      const response = await request(app)
        .post('/api/contacts/decrypt')
        .send({
          taskId,
          address: nonParticipant,
          signature,
          message,
        })
        .expect(403);

      expect(response.body.error).toContain('Only task creator or helper can decrypt');
    });

    it('应该拒绝无效签名（401）', async () => {
      // Mock 签名验证失败
      mockVerifySignature.mockReturnValue(false);

      const response = await request(app)
        .post('/api/contacts/decrypt')
        .send({
          taskId,
          address: creatorAddress,
          signature: 'invalid_signature',
          message,
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid signature');
    });

    it('应该拒绝 message 中 taskId 不匹配（401）', async () => {
      // Mock 签名验证通过但 taskId 不匹配
      mockVerifySignature.mockReturnValue(true);
      mockExtractTaskIdFromMessage.mockReturnValue('different_task_id');

      const response = await request(app)
        .post('/api/contacts/decrypt')
        .send({
          taskId,
          address: creatorAddress,
          signature,
          message,
        })
        .expect(401);

      expect(response.body.error).toBe('TaskId mismatch in signature message');
    });
  });

  describe('AES 加密解密端到端测试', () => {
    it('应该能正确加密和解密 contacts', () => {
      const plaintext = 'WeChat: alice123, Email: alice@example.com, Phone: +86-138-0013-8000';
      const dek = encryptionService.generateDEK();
      
      // 加密
      const encrypted = encryptionService.encryptContacts(plaintext, dek);
      expect(encrypted).toBeDefined();
      expect(encrypted.length).toBeGreaterThan(0);
      
      // 解密
      const decrypted = encryptionService.decryptContacts(encrypted, dek);
      expect(decrypted).toBe(plaintext);
    });

    it('应该生成不同的 DEK', () => {
      const dek1 = encryptionService.generateDEK();
      const dek2 = encryptionService.generateDEK();
      
      expect(dek1).not.toEqual(dek2);
      expect(dek1.length).toBe(32);
      expect(dek2.length).toBe(32);
    });

    it('应该正确包裹 DEK', () => {
      const dek = encryptionService.generateDEK();
      const pubKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      const wrappedDEK = encryptionService.wrapDEK(dek, pubKey);
      expect(wrappedDEK).toBeDefined();
      expect(typeof wrappedDEK).toBe('string');
      expect(wrappedDEK.length).toBeGreaterThan(0);
    });

    it('应该支持 0x 前缀的公钥', () => {
      const dek = encryptionService.generateDEK();
      const pubKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      const wrappedDEK = encryptionService.wrapDEK(dek, pubKey);
      expect(wrappedDEK).toBeDefined();
    });

    it('应该拒绝无效长度的公钥', () => {
      const dek = encryptionService.generateDEK();
      const invalidPubKey = '1234'; // 太短
      
      expect(() => {
        encryptionService.wrapDEK(dek, invalidPubKey);
      }).toThrow('Invalid public key length');
    });
  });

  describe('encryptionPubKey 格式校验', () => {
    it('应该接受 64 字符 hex（不含 0x）', () => {
      const pubKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(encryptionService.validateEncryptionPubKey(pubKey)).toBe(true);
    });

    it('应该接受 64 字符 hex（含 0x）', () => {
      const pubKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(encryptionService.validateEncryptionPubKey(pubKey)).toBe(true);
    });

    it('应该拒绝长度不正确的公钥', () => {
      const shortKey = '1234567890abcdef';
      expect(encryptionService.validateEncryptionPubKey(shortKey)).toBe(false);
    });

    it('应该拒绝非 hex 字符', () => {
      const invalidKey = '1234567890abcdefGHIJKLMNOPQRSTUVWXYZ1234567890abcdef1234567890ab';
      expect(encryptionService.validateEncryptionPubKey(invalidKey)).toBe(false);
    });

    it('应该拒绝空字符串', () => {
      expect(encryptionService.validateEncryptionPubKey('')).toBe(false);
    });
  });
});
