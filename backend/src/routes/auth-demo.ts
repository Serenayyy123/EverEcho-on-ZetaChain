import { Router, Request, Response } from 'express';
import { verifySignatureMiddleware } from '../middleware/verifySignature';

const router = Router();

/**
 * 演示路由：使用签名验证中间件
 * 
 * 使用方式：
 * POST /api/auth-demo/protected
 * Body: {
 *   address: "0x...",
 *   taskId: "123",
 *   message: "EverEcho: decrypt for task 123",
 *   signature: "0x..."
 * }
 */
router.post('/protected', verifySignatureMiddleware, (req: Request, res: Response) => {
  // 中间件验证通过后，req.user 包含验证后的用户信息
  res.status(200).json({
    success: true,
    message: 'Signature verified successfully',
    user: req.user,
  });
});

/**
 * 健康检查（无需签名）
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is running',
  });
});

export default router;
