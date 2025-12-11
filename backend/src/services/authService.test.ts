import { ethers } from 'ethers';
import {
  generateSignMessage,
  verifySignature,
  verifySignatureDetailed,
  extractTaskIdFromMessage,
  verifySignatureWithTaskId,
  validateSignatureParams,
} from './authService';

describe('AuthService - P0-B4', () => {
  // 测试用钱包
  let wallet: ethers.Wallet;
  let address: string;

  beforeAll(() => {
    // 创建测试钱包
    wallet = ethers.Wallet.createRandom();
    address = wallet.address;
  });

  describe('generateSignMessage', () => {
    it('应该生成标准格式的签名消息', () => {
      const taskId = '123';
      const message = generateSignMessage(taskId);
      
      expect(message).toBe('EverEcho: decrypt for task 123');
      expect(message).toContain(taskId);
    });

    it('应该支持自定义 action', () => {
      const taskId = '456';
      const message = generateSignMessage(taskId, 'submit');
      
      expect(message).toBe('EverEcho: submit for task 456');
    });
  });

  describe('extractTaskIdFromMessage', () => {
    it('应该从标准格式消息中提取 taskId', () => {
      const message = 'EverEcho: decrypt for task 123';
      const taskId = extractTaskIdFromMessage(message);
      
      expect(taskId).toBe('123');
    });

    it('应该支持简化格式', () => {
      const message = 'task 456';
      const taskId = extractTaskIdFromMessage(message);
      
      expect(taskId).toBe('456');
    });

    it('应该支持 taskId: 格式', () => {
      const message = 'taskId: 789';
      const taskId = extractTaskIdFromMessage(message);
      
      expect(taskId).toBe('789');
    });

    it('应该在消息不含 taskId 时返回 null', () => {
      const message = 'Hello world';
      const taskId = extractTaskIdFromMessage(message);
      
      expect(taskId).toBeNull();
    });
  });

  describe('verifySignature', () => {
    it('应该验证正确的签名', async () => {
      const message = 'EverEcho: decrypt for task 123';
      const signature = await wallet.signMessage(message);
      
      const isValid = verifySignature(message, signature, address);
      
      expect(isValid).toBe(true);
    });

    it('应该拒绝错误的签名', () => {
      const message = 'EverEcho: decrypt for task 123';
      const fakeSignature = '0x' + '0'.repeat(130);
      
      const isValid = verifySignature(message, fakeSignature, address);
      
      expect(isValid).toBe(false);
    });

    it('应该拒绝地址不匹配的签名', async () => {
      const message = 'EverEcho: decrypt for task 123';
      const signature = await wallet.signMessage(message);
      const wrongAddress = '0x0000000000000000000000000000000000000001';
      
      const isValid = verifySignature(message, signature, wrongAddress);
      
      expect(isValid).toBe(false);
    });

    it('应该不区分地址大小写', async () => {
      const message = 'EverEcho: decrypt for task 123';
      const signature = await wallet.signMessage(message);
      
      const isValid = verifySignature(message, signature, address.toUpperCase());
      
      expect(isValid).toBe(true);
    });
  });

  describe('verifySignatureDetailed', () => {
    it('应该返回详细的验证结果（成功）', async () => {
      const message = 'EverEcho: decrypt for task 123';
      const signature = await wallet.signMessage(message);
      
      const result = verifySignatureDetailed(message, signature, address);
      
      expect(result.success).toBe(true);
      expect(result.recoveredAddress).toBe(address);
      expect(result.error).toBeUndefined();
    });

    it('应该返回详细的验证结果（失败）', async () => {
      const message = 'EverEcho: decrypt for task 123';
      const signature = await wallet.signMessage(message);
      const wrongAddress = '0x0000000000000000000000000000000000000001';
      
      const result = verifySignatureDetailed(message, signature, wrongAddress);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Address mismatch');
      expect(result.details).toContain('Expected');
    });

    it('应该处理缺少参数的情况', () => {
      const result = verifySignatureDetailed('', '', '');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required parameters');
    });

    it('应该处理无效签名格式', () => {
      const message = 'EverEcho: decrypt for task 123';
      const invalidSignature = 'invalid';
      
      const result = verifySignatureDetailed(message, invalidSignature, address);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });
  });

  describe('verifySignatureWithTaskId', () => {
    it('应该验证签名并校验 taskId（成功）', async () => {
      const taskId = '123';
      const message = generateSignMessage(taskId);
      const signature = await wallet.signMessage(message);
      
      const result = verifySignatureWithTaskId(message, signature, address, taskId);
      
      expect(result.success).toBe(true);
      expect(result.recoveredAddress).toBe(address);
    });

    it('应该拒绝消息中不含 taskId 的签名', async () => {
      const message = 'Hello world';
      const signature = await wallet.signMessage(message);
      
      const result = verifySignatureWithTaskId(message, signature, address, '123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('TaskId not found in message');
    });

    it('应该拒绝 taskId 不匹配的签名', async () => {
      const taskId = '123';
      const message = generateSignMessage(taskId);
      const signature = await wallet.signMessage(message);
      
      const result = verifySignatureWithTaskId(message, signature, address, '456');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('TaskId mismatch');
      expect(result.details).toContain('Expected taskId 456, got 123');
    });

    it('应该拒绝签名无效的请求', async () => {
      const taskId = '123';
      const message = generateSignMessage(taskId);
      const fakeSignature = '0x' + '0'.repeat(130);
      
      const result = verifySignatureWithTaskId(message, fakeSignature, address, taskId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });
  });

  describe('validateSignatureParams', () => {
    it('应该验证完整的参数', () => {
      const params = {
        address: '0x123',
        taskId: '456',
        message: 'test',
        signature: '0xabc',
      };
      
      const result = validateSignatureParams(params);
      
      expect(result.valid).toBe(true);
      expect(result.missing).toBeUndefined();
    });

    it('应该检测缺少的参数', () => {
      const params = {
        address: '0x123',
        taskId: '456',
      };
      
      const result = validateSignatureParams(params);
      
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(['message', 'signature']);
    });

    it('应该检测所有缺少的参数', () => {
      const params = {};
      
      const result = validateSignatureParams(params);
      
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(['address', 'taskId', 'message', 'signature']);
    });
  });
});
