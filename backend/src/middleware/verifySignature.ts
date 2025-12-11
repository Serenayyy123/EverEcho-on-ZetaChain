import { Request, Response, NextFunction } from 'express';
import {
  verifySignatureWithTaskId,
  validateSignatureParams,
} from '../services/authService';

/**
 * 扩展 Express Request 类型，添加 user 字段
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        address: string;
        taskId: string;
      };
    }
  }
}

/**
 * 签名验证中间件（P0-B4）
 * 冻结点 1.3：签名验证必须包含 taskId
 * 冻结点 2.2-P0-B4：验证只做身份确认
 * 
 * 使用方式：
 * router.post('/api/some-endpoint', verifySignatureMiddleware, handler);
 */
export function verifySignatureMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { address, taskId, message, signature } = req.body;

    // 1. 参数完整性校验
    const validation = validateSignatureParams({ address, taskId, message, signature });
    
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: `Required: ${validation.missing?.join(', ')}`,
      });
      return;
    }

    // 2. 验证签名并校验 taskId
    const result = verifySignatureWithTaskId(message, signature, address, taskId);

    if (!result.success) {
      res.status(401).json({
        success: false,
        error: result.error,
        details: result.details,
      });
      return;
    }

    // 3. 验证通过，将用户信息附加到 request
    req.user = {
      address,
      taskId,
    };

    next();
  } catch (error) {
    console.error('Signature verification middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * 可选的签名验证中间件（不强制要求 taskId）
 * 用于不需要 taskId 的场景（如 Profile 更新）
 */
export function verifySignatureOptionalTaskId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { address, message, signature } = req.body;

    // 参数校验
    if (!address || !message || !signature) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'Required: address, message, signature',
      });
      return;
    }

    // 验证签名
    const { verifySignatureDetailed } = require('../services/authService');
    const result = verifySignatureDetailed(message, signature, address);

    if (!result.success) {
      res.status(401).json({
        success: false,
        error: result.error,
        details: result.details,
      });
      return;
    }

    // 验证通过
    req.user = {
      address,
      taskId: req.body.taskId || '', // 可选
    };

    next();
  } catch (error) {
    console.error('Signature verification middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
