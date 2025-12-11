import { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import { verifySignatureMiddleware, verifySignatureOptionalTaskId } from './verifySignature';
import { generateSignMessage } from '../services/authService';

describe('VerifySignature Middleware - P0-B4', () => {
  let wallet: ethers.Wallet;
  let address: string;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    // 创建测试钱包
    wallet = ethers.Wallet.createRandom();
    address = wallet.address;

    // Mock Express 对象
    req = {
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe('verifySignatureMiddleware', () => {
    it('应该通过有效的签名并调用 next()', async () => {
      const taskId = '123';
      const message = generateSignMessage(taskId);
      const signature = await wallet.signMessage(message);

      req.body = {
        address,
        taskId,
        message,
        signature,
      };

      verifySignatureMiddleware(req as Request, res as Response, next);

      // 等待异步操作
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        address,
        taskId,
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该拒绝缺少必填字段的请求（400）', () => {
      req.body = {
        address,
        taskId: '123',
        // 缺少 message 和 signature
      };

      verifySignatureMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Missing required fields',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝消息中不含 taskId 的签名（401）', async () => {
      const message = 'Hello world'; // 不含 taskId
      const signature = await wallet.signMessage(message);

      req.body = {
        address,
        taskId: '123',
        message,
        signature,
      };

      verifySignatureMiddleware(req as Request, res as Response, next);

      // 等待异步操作
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'TaskId not found in message',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝 taskId 不匹配的签名（401）', async () => {
      const taskId = '123';
      const message = generateSignMessage(taskId);
      const signature = await wallet.signMessage(message);

      req.body = {
        address,
        taskId: '456', // 不匹配
        message,
        signature,
      };

      verifySignatureMiddleware(req as Request, res as Response, next);

      // 等待异步操作
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'TaskId mismatch',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝签名与 address 不匹配的请求（401）', async () => {
      const taskId = '123';
      const message = generateSignMessage(taskId);
      const signature = await wallet.signMessage(message);
      const wrongAddress = '0x0000000000000000000000000000000000000001';

      req.body = {
        address: wrongAddress,
        taskId,
        message,
        signature,
      };

      verifySignatureMiddleware(req as Request, res as Response, next);

      // 等待异步操作
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Address mismatch',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝无效的签名格式（401）', async () => {
      const taskId = '123';
      const message = generateSignMessage(taskId);
      const invalidSignature = 'invalid';

      req.body = {
        address,
        taskId,
        message,
        signature: invalidSignature,
      };

      verifySignatureMiddleware(req as Request, res as Response, next);

      // 等待异步操作
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid signature',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('verifySignatureOptionalTaskId', () => {
    it('应该通过没有 taskId 的有效签名', async () => {
      const message = 'EverEcho: Update profile';
      const signature = await wallet.signMessage(message);

      req.body = {
        address,
        message,
        signature,
      };

      verifySignatureOptionalTaskId(req as Request, res as Response, next);

      // 等待异步操作
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        address,
        taskId: '',
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该拒绝缺少必填字段的请求（400）', () => {
      req.body = {
        address,
        // 缺少 message 和 signature
      };

      verifySignatureOptionalTaskId(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Missing required fields',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝签名无效的请求（401）', async () => {
      const message = 'EverEcho: Update profile';
      const signature = await wallet.signMessage(message);
      const wrongAddress = '0x0000000000000000000000000000000000000001';

      req.body = {
        address: wrongAddress,
        message,
        signature,
      };

      verifySignatureOptionalTaskId(req as Request, res as Response, next);

      // 等待异步操作
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
