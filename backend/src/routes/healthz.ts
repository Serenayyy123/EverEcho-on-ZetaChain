/**
 * 健康检查路由
 * 用于监控后端服务状态
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

const router = Router();

// 全局 Prisma 实例（如果已在其他地方初始化，可以导入）
let prisma: PrismaClient;

try {
  prisma = new PrismaClient();
} catch (error) {
  console.error('Failed to initialize Prisma for healthz:', error);
}

/**
 * GET /healthz
 * 返回服务健康状态
 */
router.get('/', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      rpc: 'unknown',
    },
  };

  let allHealthy = true;

  // 检查数据库连接
  try {
    if (prisma) {
      await prisma.$queryRaw`SELECT 1`;
      health.checks.database = 'ok';
    } else {
      health.checks.database = 'not_initialized';
      allHealthy = false;
    }
  } catch (error) {
    health.checks.database = 'error';
    allHealthy = false;
    console.error('Database health check failed:', error);
  }

  // 检查 RPC 连接
  try {
    const rpcUrl = process.env.RPC_URL;
    if (rpcUrl) {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      await provider.getBlockNumber();
      health.checks.rpc = 'ok';
    } else {
      health.checks.rpc = 'not_configured';
      allHealthy = false;
    }
  } catch (error) {
    health.checks.rpc = 'error';
    allHealthy = false;
    console.error('RPC health check failed:', error);
  }

  // 设置总体状态
  if (!allHealthy) {
    health.status = 'degraded';
  }

  // 返回状态码
  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * GET /healthz/ready
 * 返回服务是否准备好接收请求
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // 检查关键依赖
    const checks = [];

    // 数据库检查
    if (prisma) {
      await prisma.$queryRaw`SELECT 1`;
      checks.push({ name: 'database', status: 'ready' });
    } else {
      checks.push({ name: 'database', status: 'not_ready' });
    }

    // RPC 检查
    const rpcUrl = process.env.RPC_URL;
    if (rpcUrl) {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      await provider.getBlockNumber();
      checks.push({ name: 'rpc', status: 'ready' });
    } else {
      checks.push({ name: 'rpc', status: 'not_ready' });
    }

    const allReady = checks.every(check => check.status === 'ready');

    res.status(allReady ? 200 : 503).json({
      ready: allReady,
      checks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /healthz/live
 * 返回服务是否存活（简单检查）
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
