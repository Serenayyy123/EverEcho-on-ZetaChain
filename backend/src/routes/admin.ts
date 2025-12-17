import { Router, Request, Response } from 'express';
import { getOrphanDetectionService } from '../services/orphanDetectionService';

const router = Router();

/**
 * POST /api/admin/tasks/cleanup-orphans
 * P0 Fix: 管理员清理 orphan metadata 端点
 */
router.post('/tasks/cleanup-orphans', async (req: Request, res: Response) => {
  try {
    const { dryRun = true, daysBack, batchSize = 100 } = req.query;
    
    console.log(`[AdminAPI] Orphan cleanup requested:`, {
      dryRun: dryRun === 'true',
      daysBack: daysBack ? parseInt(daysBack as string) : undefined,
      batchSize: parseInt(batchSize as string)
    });

    const orphanService = getOrphanDetectionService();
    
    // 执行扫描和清理
    const result = await orphanService.scanAndCleanup(
      {
        daysBack: daysBack ? parseInt(daysBack as string) : undefined,
        batchSize: parseInt(batchSize as string),
        dryRun: dryRun === 'true'
      },
      true // 执行清理
    );

    res.status(200).json({
      success: true,
      scanReport: result.scanReport,
      cleanupReport: result.cleanupReport
    });

  } catch (error) {
    console.error('[AdminAPI] Orphan cleanup failed:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;